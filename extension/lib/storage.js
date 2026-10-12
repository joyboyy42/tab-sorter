import { DEFAULT_CONFIG } from "./defaults.js";

// chrome.storage.local rather than .sync: sync caps items at 8 KB,
// and the rule set is larger than that.

export async function loadConfig() {
  const { config } = await chrome.storage.local.get("config");
  return { ...DEFAULT_CONFIG, ...(config ?? {}) };
}

export async function saveConfig(patch) {
  const current = await loadConfig();
  const next = { ...current, ...patch };
  await chrome.storage.local.set({ config: next });
  return next;
}
