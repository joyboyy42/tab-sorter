// Default categories. Each category becomes a Chrome tab group.
//
//   name          group title shown in the tab strip
//   color         grey | blue | red | yellow | green | pink | purple | cyan | orange
//   domains       a site and all its subdomains ("gouv.fr" matches "impots.gouv.fr")
//   hostKeywords  substring of the hostname ("moodle" matches "moodle.example.edu")
//   urlKeywords   substring of host + path + query ("/checkout")
//
// Order matters: it is the tie-breaker for keyword matches and the order
// groups are laid out in after a full sort. Domain matches always win over
// keywords, and the most specific domain wins.
//
// The defaults are tuned for a student in France; edit them freely from the
// options page.

export const DEFAULT_RULES = [
  {
    name: "school", color: "blue",
    domains: ["epita.fr", "ionis-it.com", "ionisx.com", "ionis-group.com"],
    hostKeywords: ["epita", "moodle", "zeus", "auriga", "ionis"],
    urlKeywords: []
  },
  {
    name: "cyber", color: "purple",
    domains: [
      // Challenge and CTF platforms
      "root-me.org", "hackthebox.com", "tryhackme.com", "ctftime.org", "picoctf.org", "pwn.college",
      "overthewire.org", "hackropole.fr", "cryptohack.org", "pentesterlab.com", "vulnhub.com",
      "cyberdefenders.org", "letsdefend.io", "blueteamlabs.online", "hackthissite.org",
      "ringzer0ctf.com", "247ctf.com", "challenges.re", "crackmes.one", "w3challs.com",
      // Courses and training
      "portswigger.net", "offsec.com", "academy.tcm-sec.com", "tcm-sec.com", "sans.org",
      "cybrary.it", "immersivelabs.com", "secnumacademie.gouv.fr", "cyber.gouv.fr",
      "cybermalveillance.gouv.fr", "owasp.org",
      // References and tools
      "book.hacktricks.xyz", "hacktricks.wiki", "gtfobins.github.io", "lolbas-project.github.io",
      "exploit-db.com", "attack.mitre.org", "cve.mitre.org", "cwe.mitre.org", "nvd.nist.gov",
      "gchq.github.io", "dcode.fr", "crackstation.net", "hashes.com", "revshells.com", "ired.team",
      "virustotal.com", "shodan.io", "censys.io", "censys.com", "crt.sh", "haveibeenpwned.com",
      "osintframework.com", "any.run", "hybrid-analysis.com"
    ],
    hostKeywords: ["ctf", "hack", "pwn", "cyber", "exploit"],
    urlKeywords: ["ctf", "writeup", "write-up", "pentest", "osint"]
  },
  {
    name: "dev", color: "green",
    domains: [
      "github.com", "gitlab.com", "bitbucket.org", "github.io", "githubusercontent.com",
      "stackoverflow.com", "stackexchange.com", "superuser.com", "serverfault.com", "askubuntu.com",
      "developer.mozilla.org", "docs.python.org", "pypi.org", "npmjs.com", "crates.io", "docs.rs",
      "rust-lang.org", "go.dev", "cppreference.com", "man7.org", "devdocs.io",
      "readthedocs.io", "readthedocs.org", "docker.com", "kubernetes.io",
      "vercel.com", "netlify.app", "netlify.com", "replit.com", "codepen.io", "codesandbox.io",
      "jsfiddle.net", "leetcode.com", "codingame.com", "regex101.com", "git-scm.com",
      "w3schools.com", "geeksforgeeks.org", "vscode.dev", "localhost", "127.0.0.1"
    ],
    hostKeywords: ["gitlab", "gitea", "jenkins"],
    urlKeywords: []
  },
  {
    name: "ai", color: "cyan",
    domains: [
      "claude.ai", "chatgpt.com", "chat.openai.com", "openai.com", "gemini.google.com",
      "notebooklm.google.com", "perplexity.ai", "mistral.ai", "copilot.microsoft.com",
      "huggingface.co", "poe.com", "deepseek.com"
    ],
    hostKeywords: [],
    urlKeywords: []
  },
  {
    name: "admin", color: "grey",
    domains: [
      "gouv.fr", "service-public.fr", "ameli.fr", "caf.fr", "urssaf.fr", "francetravail.fr",
      "crous.fr", "laposte.fr", "doctolib.fr",
      "edf.fr", "engie.fr", "totalenergies.fr", "free.fr", "orange.fr", "sfr.fr",
      "bouyguestelecom.fr", "sosh.fr", "red-by-sfr.fr",
      "boursobank.com", "boursorama.com", "credit-agricole.fr", "societegenerale.fr", "sg.fr",
      "bnpparibas", "mabanque.bnpparibas", "lcl.fr", "labanquepostale.fr", "caisse-epargne.fr",
      "banquepopulaire.fr", "creditmutuel.fr", "cic.fr", "hellobank.fr", "fortuneo.fr",
      "revolut.com", "n26.com", "lydia-app.com", "sumeria.eu", "paypal.com",
      "mail.google.com", "outlook.live.com", "outlook.office.com", "mail.proton.me"
    ],
    hostKeywords: ["banque", "impots", "assurance", "mutuelle"],
    urlKeywords: []
  },
  {
    name: "shopping", color: "orange",
    domains: [
      "amazon.fr", "amazon.com", "amazon.de", "amazon.co.uk", "cdiscount.com", "fnac.com",
      "darty.com", "boulanger.com", "leboncoin.fr", "vinted.fr", "ebay.fr", "ebay.com",
      "aliexpress.com", "temu.com", "shein.com", "zalando.fr", "ldlc.com", "materiel.net",
      "topachat.com", "rakuten.fr", "ikea.com", "decathlon.fr", "backmarket.fr", "veepee.fr",
      "asos.com", "nike.com", "adidas.fr", "zara.com", "hm.com", "uniqlo.com",
      "carrefour.fr", "auchan.fr", "e.leclerc", "ubereats.com", "deliveroo.fr",
      "17track.net", "colissimo.fr", "chronopost.fr", "mondialrelay.fr", "dhl.com", "dhl.fr",
      "ups.com", "fedex.com", "dpd.fr", "relaiscolis.com"
    ],
    hostKeywords: [],
    urlKeywords: ["/cart", "/checkout", "/panier", "/commande", "/mes-commandes", "/your-orders", "/order-history"]
  },
  {
    name: "chill", color: "red",
    domains: [
      "youtube.com", "youtu.be", "twitch.tv", "netflix.com", "primevideo.com", "disneyplus.com",
      "canalplus.com", "crunchyroll.com", "animationdigitalnetwork.fr", "animationdigitalnetwork.com",
      "max.com", "paramountplus.com", "tv.apple.com", "france.tv", "arte.tv", "tf1.fr", "m6.fr",
      "molotov.tv", "spotify.com", "deezer.com", "soundcloud.com",
      "imdb.com", "allocine.fr", "senscritique.com", "letterboxd.com", "myanimelist.net",
      "anilist.co", "betaseries.com", "justwatch.com", "anime-sama.to",
      "store.steampowered.com", "steamcommunity.com", "epicgames.com"
    ],
    hostKeywords: [],
    urlKeywords: []
  },
  {
    name: "social", color: "pink",
    domains: [
      "discord.com", "discord.gg", "reddit.com", "x.com", "twitter.com", "instagram.com",
      "facebook.com", "messenger.com", "whatsapp.com", "telegram.org", "snapchat.com",
      "tiktok.com", "threads.net", "bsky.app", "mastodon.social", "pinterest.com"
    ],
    hostKeywords: [],
    urlKeywords: []
  },
  {
    name: "jobs", color: "yellow",
    domains: [
      "linkedin.com", "welcometothejungle.com", "indeed.com", "hellowork.com", "jobteaser.com",
      "glassdoor.fr", "glassdoor.com", "apec.fr", "malt.fr"
    ],
    hostKeywords: [],
    urlKeywords: []
  }
];

export const DEFAULT_CONFIG = {
  auto: true,            // sort each tab as soon as it loads a page
  collapseOthers: false, // collapse every managed group except the active one
  ignored: [],           // domains that must never be grouped
  rules: DEFAULT_RULES
};

export const COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];
