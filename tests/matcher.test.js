import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_RULES, DEFAULT_CONFIG, COLORS } from "../extension/lib/defaults.js";
import {
  hostOf, cleanDomain, categorize, assignDomain, normalizeUrl, validateRules
} from "../extension/lib/matcher.js";

const cat = (url, rules = DEFAULT_RULES, ignored = []) => categorize(url, rules, ignored)?.name ?? null;

test("default rules are valid", () => {
  assert.doesNotThrow(() => validateRules(DEFAULT_RULES, COLORS));
});

test("hostOf strips www and rejects non-web URLs", () => {
  assert.equal(hostOf("https://www.Example.com/a"), "example.com");
  assert.equal(hostOf("chrome://newtab/"), null);
  assert.equal(hostOf("not a url"), null);
});

test("cleanDomain accepts bare domains and full links", () => {
  assert.equal(cleanDomain("anime-sama.to"), "anime-sama.to");
  assert.equal(cleanDomain("  https://www.Foo-Bar.to/x?y=1 "), "foo-bar.to");
  assert.equal(cleanDomain("localhost"), "localhost");
  assert.equal(cleanDomain("foo"), null);
  assert.equal(cleanDomain(""), null);
});

test("default categories", () => {
  const cases = {
    "https://moodle.epita.fr/course/1": "school",
    "https://zeus.ionis-it.com/": "school",
    "https://www.root-me.org/": "cyber",
    "https://tryhackme.com/room/x": "cyber",
    "https://portswigger.net/web-security": "cyber",
    "https://unknown-ctf.example.com/": "cyber",
    "https://github.com/user/repo": "dev",
    "http://localhost:3000/": "dev",
    "https://claude.ai/new": "ai",
    "https://www.impots.gouv.fr/": "admin",
    "https://www.amazon.fr/": "shopping",
    "https://shop.example.com/checkout": "shopping",
    "https://www.youtube.com/watch?v=1": "chill",
    "https://anime-sama.to/catalogue": "chill",
    "https://discord.com/channels/@me": "social",
    "https://www.linkedin.com/in/x": "jobs",
    "https://example.org/": null,
    "chrome://extensions/": null
  };
  for (const [url, expected] of Object.entries(cases)) assert.equal(cat(url), expected, url);
});

test("the most specific domain wins", () => {
  // cyber.gouv.fr (cyber) beats gouv.fr (admin)
  assert.equal(cat("https://cyber.gouv.fr/"), "cyber");
  // EPITA's own GitLab is school, not dev
  assert.equal(cat("https://gitlab.cri.epita.fr/x"), "school");
});

test("domain matches beat keyword matches", () => {
  // "hack" keyword would say cyber, but the domain list says dev
  const rules = [
    { name: "cyber", hostKeywords: ["hack"] },
    { name: "dev", domains: ["hackerrank.com"] }
  ];
  assert.equal(cat("https://www.hackerrank.com/", rules), "dev");
});

test("assignDomain moves a domain between categories", () => {
  const next = assignDomain(DEFAULT_CONFIG, "youtube.com", "school");
  assert.equal(cat("https://youtube.com/watch", next.rules), "school");
  assert.ok(!next.rules.find(r => r.name === "chill").domains.includes("youtube.com"));
  // input is not mutated
  assert.ok(DEFAULT_RULES.find(r => r.name === "chill").domains.includes("youtube.com"));
});

test("assignDomain with no category ignores the site, even over keywords", () => {
  const next = assignDomain(DEFAULT_CONFIG, "hackernoon.com", "");
  assert.equal(cat("https://hackernoon.com/", next.rules), "cyber"); // keyword alone
  assert.equal(cat("https://hackernoon.com/", next.rules, next.ignored), null);
  // assigning it again lifts the ignore
  const back = assignDomain(next, "hackernoon.com", "dev");
  assert.deepEqual(back.ignored, []);
  assert.equal(cat("https://hackernoon.com/", back.rules, back.ignored), "dev");
});

test("normalizeUrl drops the fragment and trailing slash", () => {
  assert.equal(normalizeUrl("https://a.com/x/#top"), "https://a.com/x");
  assert.equal(normalizeUrl("https://a.com/x"), "https://a.com/x");
  assert.equal(normalizeUrl("chrome://newtab/"), null);
});

test("validateRules reports bad input", () => {
  assert.throws(() => validateRules({}, COLORS), /array/);
  assert.throws(() => validateRules([{ name: "a" }, { name: "a" }], COLORS), /Duplicate/);
  assert.throws(() => validateRules([{ name: "a", color: "teal" }], COLORS), /color/);
  assert.throws(() => validateRules([{ name: "a", domains: "x.com" }], COLORS), /array/);
});
