import { loadConfig, saveConfig } from "./lib/storage.js";
import { DEFAULT_RULES, COLORS } from "./lib/defaults.js";
import { cleanDomain, validateRules } from "./lib/matcher.js";

const $ = id => document.getElementById(id);

// chrome.storage returns keys alphabetically; put them back in a readable order.
const tidy = ({ name, color, domains = [], hostKeywords = [], urlKeywords = [], ...rest }) =>
  ({ name, color, domains, hostKeywords, urlKeywords, ...rest });

function render(config) {
  $("rules").value = JSON.stringify(config.rules.map(tidy), null, 2);
  $("ignored").value = (config.ignored ?? []).join("\n");
  const select = $("newCategory");
  select.replaceChildren(...config.rules.map(r => new Option(r.name, r.name)));
}

render(await loadConfig());

$("add").onclick = async () => {
  const r = await chrome.runtime.sendMessage({
    type: "assign",
    domain: $("newDomain").value,
    category: $("newCategory").value
  });
  if (r?.error) return void ($("addStatus").textContent = `Error: ${r.error}`);
  $("addStatus").textContent = `${r.domain} → ${r.category}`;
  $("newDomain").value = "";
  render(await loadConfig());
};

$("save").onclick = async () => {
  try {
    const rules = JSON.parse($("rules").value);
    validateRules(rules, COLORS);
    const ignored = [];
    for (const line of $("ignored").value.split("\n")) {
      if (!line.trim()) continue;
      const d = cleanDomain(line);
      if (!d) throw new Error(`Not a valid domain: ${line.trim()}`);
      ignored.push(d);
    }
    render(await saveConfig({ rules, ignored }));
    $("saveStatus").textContent = "Saved. Click “Sort now” in the popup to apply.";
  } catch (err) {
    $("saveStatus").textContent = `Error: ${err.message}`;
  }
};

$("reset").onclick = async () => {
  render(await saveConfig({ rules: DEFAULT_RULES, ignored: [] }));
  $("saveStatus").textContent = "Defaults restored.";
};
