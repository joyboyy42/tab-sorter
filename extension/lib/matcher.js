// Pure functions: no Chrome APIs here, so they can be unit-tested with Node.

/** Hostname without "www.", or null for non-web URLs (chrome://, file://, about:...). */
export function hostOf(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** True if `host` is `domain` or one of its subdomains. */
export function matchesDomain(host, domain) {
  return host === domain || host.endsWith("." + domain);
}

/**
 * Turn user input into a bare domain.
 * "https://www.Example.com/path?q" -> "example.com", "example.com" -> "example.com".
 * Returns null if the input does not look like a domain.
 */
export function cleanDomain(input) {
  let v = String(input ?? "").trim().toLowerCase();
  if (!v) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(v)) v = "https://" + v;
  const host = hostOf(v);
  if (!host) return null;
  return host.includes(".") || host === "localhost" ? host : null;
}

/**
 * Return the rule a URL belongs to, or null.
 *
 * 1. Ignored domains never match.
 * 2. Domain lists: the most specific match wins across all rules
 *    ("gitlab.cri.epita.fr" beats "epita.fr").
 * 3. Hostname keywords, in rule order.
 * 4. URL keywords (host + path + query), in rule order.
 */
export function categorize(url, rules, ignored = []) {
  const host = hostOf(url);
  if (!host) return null;
  if (ignored.some(d => matchesDomain(host, d))) return null;

  let best = null;
  let bestLen = -1;
  for (const rule of rules) {
    for (const d of rule.domains ?? []) {
      if (matchesDomain(host, d) && d.length > bestLen) {
        best = rule;
        bestLen = d.length;
      }
    }
  }
  if (best) return best;

  for (const rule of rules) {
    if ((rule.hostKeywords ?? []).some(k => host.includes(k))) return rule;
  }

  const u = new URL(url);
  const full = (host + u.pathname + u.search).toLowerCase();
  for (const rule of rules) {
    if ((rule.urlKeywords ?? []).some(k => full.includes(k))) return rule;
  }
  return null;
}

/**
 * Move `domain` into `category` (or into the ignore list when category is "").
 * The domain is removed from every other rule so there is a single source of truth.
 * Returns a new config object; the input is not mutated.
 */
export function assignDomain(config, domain, category) {
  const rules = config.rules.map(rule => {
    const domains = (rule.domains ?? []).filter(d => d !== domain);
    if (rule.name === category) domains.unshift(domain);
    return { ...rule, domains };
  });
  const ignored = (config.ignored ?? []).filter(d => d !== domain);
  if (!category) ignored.push(domain);
  return { ...config, rules, ignored };
}

/** URL key used to spot duplicate tabs: same URL ignoring the #fragment and a trailing slash. */
export function normalizeUrl(url) {
  if (!hostOf(url)) return null;
  const u = new URL(url);
  u.hash = "";
  return u.toString().replace(/\/$/, "");
}

/** Throw a readable error if a rules array is malformed. */
export function validateRules(rules, colors) {
  if (!Array.isArray(rules)) throw new Error("Rules must be a JSON array.");
  const names = new Set();
  for (const r of rules) {
    if (!r || typeof r.name !== "string" || !r.name.trim()) throw new Error("Every category needs a name.");
    if (names.has(r.name)) throw new Error(`Duplicate category: ${r.name}`);
    names.add(r.name);
    if (r.color && !colors.includes(r.color)) throw new Error(`Unknown color for ${r.name}: ${r.color}`);
    for (const key of ["domains", "hostKeywords", "urlKeywords"]) {
      if (r[key] !== undefined && !Array.isArray(r[key])) throw new Error(`${r.name}.${key} must be an array.`);
    }
  }
}
