import { loadConfig, saveConfig } from "./lib/storage.js";
import { categorize, cleanDomain, hostOf } from "./lib/matcher.js";

const $ = id => document.getElementById(id);
const setStatus = text => { $("status").textContent = text; };
const send = msg => chrome.runtime.sendMessage(msg);

const config = await loadConfig();

// Settings
$("auto").checked = config.auto;
$("collapse").checked = config.collapseOthers;
$("auto").onchange = e => saveConfig({ auto: e.target.checked });
$("collapse").onchange = e => saveConfig({ collapseOthers: e.target.checked });
$("options").onclick = e => { e.preventDefault(); chrome.runtime.openOptionsPage(); };

// Actions
$("sort").onclick = async () => {
  setStatus("Sorting…");
  const r = await send({ type: "sort" });
  setStatus(r?.error ? `Error: ${r.error}` : `${r.grouped} tab(s) grouped.`);
};

$("dedupe").onclick = async () => {
  const r = await send({ type: "dedupe" });
  if (r?.error) return setStatus(`Error: ${r.error}`);
  setStatus(r.closed ? `${r.closed} duplicate(s) closed. Ctrl+Shift+T reopens one.` : "No duplicates.");
};

// "This site" picker for the active tab
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const domain = hostOf(tab?.url ?? "") ? cleanDomain(tab.url) : null;
const select = $("category");
select.add(new Option("None (never group)", ""));
for (const r of config.rules) select.add(new Option(r.name, r.name));

if (domain) {
  $("domain").textContent = domain;
  select.value = categorize(tab.url, config.rules, config.ignored)?.name ?? "";
} else {
  $("domain").textContent = "not a web page";
  select.disabled = $("assign").disabled = true;
}

$("assign").onclick = async () => {
  const r = await send({ type: "assign", domain, category: select.value });
  if (r?.error) return setStatus(`Error: ${r.error}`);
  setStatus(r.category ? `${r.domain} → ${r.category}` : `${r.domain} will no longer be grouped.`);
};
