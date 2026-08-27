const fs = require("fs");
const ROWS = [
  ["real", "Diagnosis engine", "Real", "Deterministic rules, fixed B1 to B6 precedence, evidence-carrying. No model involved."],
  ["real", "Mock government systems and fault injection", "Real", "Seven independently modelled, independently failing systems."],
  ["real", "Case create, read and event log", "Real", "Real append-only events. The log lives in server memory only, so it does not survive a restart or reach a second instance."],
  ["not_built", "AI or language model", "Not used", "No language model runs in this build and none is present in the code. There is no model library, no key is read, and no request leaves the app. Every sentence you see is a pre-authored string in a committed file."],
  ["partial", "Languages", "Partly shipped", "The selector lists every language the official portal offers. English is the only resolved language; the rest are labelled as coming, and choosing one keeps the interface in English rather than showing you a half-translated screen."],
  ["partial", "Input checking on our own routes", "Hand-written", "Our own specification asks for a validation library at the boundary. Adding a dependency the day before submission was judged the larger risk, so inputs are checked by hand. Same coverage, less machinery."],
  ["partial", "Mock endpoint isolation", "Weaker than specified", "Our specification asks that the mock record endpoints not be reachable from outside the app. Inside a single deployment that cannot be enforced at the network layer, so they apply a same-origin check instead. They return synthetic data only."],
  ["simulated", "Aadhaar and identity checks", "Simulated", "No real identity system is contacted."],
  ["simulated", "Payment, bank, land record and tax systems", "Simulated", "Synthetic modules with deliberately inconsistent records and injectable faults."],
  ["simulated", "One-time code", "Simulated", "No message is sent to any phone. The demo code is shown on the screen that asks for it."],
  ["simulated", "The people", "Synthetic", "Eight invented people. Every identifier is structurally invalid as a real credential, so nothing here could be mistaken for or reused as real."],
  ["real", "Fix path progress", "Real, on your device", "Kept in this browser. It survives a reload and never leaves your phone."],
  ["not_built", "Offline queue and background sync", "Not built", "Cut for this round. What survives is progress that persists and a guard against submitting the same thing twice."],
  ["not_built", "Complaint filing, deadline clocks, escalation", "Not built", "Cut for this round. The escalation ladder is described in the product, not executed by it."],
  ["not_built", "Case timeline screen", "Not built", "Events are recorded but not shown."],
  ["not_built", "Read aloud", "Not built", "Cut for this round."],
  ["planned", "Voice input", "Planned", "The microphone button is visible and disabled. It requests no permission and loads no speech library."],
  ["planned", "In-browser face check", "Planned", "Described, not shipped."]
];
const LIMITS = [
  "No real integration. A real deployment would need sanctioned access from the agriculture department and from each state.",
  "The blocker list is derived from public documentation, not from operational data.",
  "Land record rules vary by state. This models one generic state.",
  "English only for now. A real deployment needs the full language set.",
  "No SMS or phone-line channel, which the least connected people would need most.",
  "Escalation is described, not executed. We cannot verify whether an officer acted, only whether money arrived in the mock bank record.",
  "The refund, voluntary surrender and revocation flows on the official portal are deliberately out of scope. They are the opposite of \u201Cmy instalment did not arrive\u201D, and this build answers one question."
];

const add = {};
ROWS.forEach(([, comp, label, note], i) => {
  add["real.row." + i + ".component"] = comp;
  add["real.row." + i + ".label"] = label;
  add["real.row." + i + ".note"] = note;
});
LIMITS.forEach((l, i) => { add["real.limit." + i] = l; });

const px = { en: "", hi: "TODO_HI: ", ta: "TODO_TA: " };
for (const loc of ["en", "hi", "ta"]) {
  const p = "content/catalogue." + loc + ".json";
  const c = JSON.parse(fs.readFileSync(p, "utf8"));
  let n = 0;
  for (const [k, v] of Object.entries(add)) { if (k in c) continue; c[k] = loc === "en" ? v : px[loc] + v; n++; }
  fs.writeFileSync(p, JSON.stringify(c, null, 2) + "\n");
  console.log(loc, "+" + n, "->", Object.keys(c).length);
}
fs.writeFileSync("/dev/stdout", "");
// emit the status list the page needs
console.log("STATUSES=" + JSON.stringify(ROWS.map(r => r[0])));
console.log("ROWCOUNT=" + ROWS.length + " LIMITCOUNT=" + LIMITS.length);
