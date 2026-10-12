import { loadConfig, saveConfig } from "./lib/storage.js";
import { categorize, cleanDomain, hostOf, matchesDomain, normalizeUrl, assignDomain } from "./lib/matcher.js";

// All tab operations go through one queue so two tabs loading at the same
// time cannot both create the same group.
let queue = Promise.resolve();
function serial(fn) {
  const run = queue.then(fn);
  queue = run.catch(err => console.warn("[Tab Sorter]", err));
  return run;
}

const managedTitles = config => new Set(config.rules.map(r => r.name));

async function findGroup(windowId, title) {
  const groups = await chrome.tabGroups.query({ windowId });
  return groups.find(g => g.title === title);
}

/**
 * Put one tab in the group of its category.
 * Pinned tabs and groups the user created by hand are never touched.
 * Returns true if the tab ends up in a managed group.
 */
async function placeTab(tab, config) {
  if (!tab || tab.pinned) return false;
  const rule = categorize(tab.url || tab.pendingUrl, config.rules, config.ignored);

  let current = null;
  if (tab.groupId !== -1) {
    current = await chrome.tabGroups.get(tab.groupId).catch(() => null);
    if (current && !managedTitles(config).has(current.title)) return false;
  }

  if (!rule) {
    if (current) await chrome.tabs.ungroup(tab.id);
    return false;
  }
  if (current?.title === rule.name) return true;

  const existing = await findGroup(tab.windowId, rule.name);
  if (existing) {
    await chrome.tabs.group({ groupId: existing.id, tabIds: [tab.id] });
  } else {
    const groupId = await chrome.tabs.group({ tabIds: [tab.id], createProperties: { windowId: tab.windowId } });
    await chrome.tabGroups.update(groupId, { title: rule.name, color: rule.color || "grey" });
  }
  return true;
}

async function collapseInactive(config) {
  if (!config.collapseOthers) return;
  const managed = managedTitles(config);
  const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
  for (const w of windows) {
    const [active] = await chrome.tabs.query({ windowId: w.id, active: true });
    for (const g of await chrome.tabGroups.query({ windowId: w.id })) {
      if (!managed.has(g.title)) continue;
      const collapsed = active?.groupId !== g.id;
      if (g.collapsed !== collapsed) await chrome.tabGroups.update(g.id, { collapsed });
    }
  }
}

/** Sort every tab in every normal window, then lay groups out in rule order. */
async function sortAll() {
  const config = await loadConfig();
  const windows = await chrome.windows.getAll({ populate: true, windowTypes: ["normal"] });
  let grouped = 0;
  for (const w of windows) {
    for (const t of w.tabs) {
      const fresh = await chrome.tabs.get(t.id).catch(() => null);
      if (await placeTab(fresh, config).catch(() => false)) grouped++;
    }
    for (const r of config.rules) {
      const g = await findGroup(w.id, r.name);
      if (g) await chrome.tabGroups.move(g.id, { index: -1 }).catch(() => {});
    }
  }
  await collapseInactive(config);
  return { grouped };
}

/** Close tabs whose URL is already open elsewhere. Keeps the active or pinned copy. */
async function closeDuplicates() {
  const tabs = await chrome.tabs.query({ windowType: "normal" });
  tabs.sort((a, b) => (b.active - a.active) || (b.pinned - a.pinned));
  const seen = new Set();
  const toClose = [];
  for (const t of tabs) {
    const key = normalizeUrl(t.url);
    if (!key) continue;
    if (!seen.has(key)) seen.add(key);
    else if (!t.pinned) toClose.push(t.id);
  }
  if (toClose.length) await chrome.tabs.remove(toClose);
  return { closed: toClose.length };
}

/** Send a site to a category ("" = never group it), then re-sort its open tabs. */
async function assignSite(input, category) {
  const domain = cleanDomain(input);
  if (!domain) throw new Error("Not a valid domain");
  const config = await loadConfig();
  if (category && !config.rules.some(r => r.name === category)) throw new Error(`Unknown category: ${category}`);

  const next = assignDomain(config, domain, category);
  await saveConfig({ rules: next.rules, ignored: next.ignored });

  let moved = 0;
  for (const t of await chrome.tabs.query({ windowType: "normal" })) {
    const host = hostOf(t.url || "");
    if (host && matchesDomain(host, domain)) {
      await placeTab(t, next).catch(() => {});
      moved++;
    }
  }
  return { domain, category, moved };
}

// Right-click menu: "Send this site to > category", on a page or on a link.
const MENU_CONTEXTS = ["page", "link"];

async function buildMenus() {
  await chrome.contextMenus.removeAll();
  const { rules } = await loadConfig();
  chrome.contextMenus.create({ id: "root", title: "Send this site to", contexts: MENU_CONTEXTS });
  for (const r of rules) {
    chrome.contextMenus.create({ id: "cat:" + r.name, parentId: "root", title: r.name, contexts: MENU_CONTEXTS });
  }
  chrome.contextMenus.create({ id: "sep", parentId: "root", type: "separator", contexts: MENU_CONTEXTS });
  chrome.contextMenus.create({ id: "cat:", parentId: "root", title: "Never group this site", contexts: MENU_CONTEXTS });
}

chrome.runtime.onInstalled.addListener(() => serial(buildMenus));
chrome.runtime.onStartup.addListener(() => serial(buildMenus));

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.config) return;
  const names = v => JSON.stringify((v?.rules ?? []).map(r => r.name));
  if (names(changes.config.oldValue) !== names(changes.config.newValue)) serial(buildMenus);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const id = String(info.menuItemId);
  if (!id.startsWith("cat:")) return;
  serial(() => assignSite(info.linkUrl || info.pageUrl || tab?.url, id.slice(4)));
});

// Auto mode: sort a tab every time it navigates.
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (!info.url && info.status !== "complete") return;
  serial(async () => {
    const config = await loadConfig();
    if (!config.auto) return;
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    await placeTab(tab, config);
    await collapseInactive(config);
  });
});

chrome.tabs.onActivated.addListener(() => {
  serial(async () => collapseInactive(await loadConfig()));
});

chrome.commands.onCommand.addListener(command => {
  if (command === "sort-tabs") serial(sortAll);
});

// Messages from the popup and options page.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const jobs = {
    sort: sortAll,
    dedupe: closeDuplicates,
    assign: () => assignSite(msg.domain, msg.category)
  };
  const job = jobs[msg?.type];
  if (!job) return false;
  serial(job).then(sendResponse, err => sendResponse({ error: err.message ?? String(err) }));
  return true; // keep the channel open for the async response
});
