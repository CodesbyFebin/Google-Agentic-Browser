/* Dependency-free smoke test for the user's standalone HTML and unified demo layer. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const publicDir = path.resolve(__dirname, "../public");
const html = fs.readFileSync(path.join(publicDir, "google-agentic-browser.html"), "utf8");
const extension = fs.readFileSync(path.join(publicDir, "unified-features.js"), "utf8");
const studio = fs.readFileSync(path.join(publicDir, "google-studio.js"), "utf8");
assert.match(html, /unified-features\.js/);
assert.match(html, /unified-features\.css/);
assert.match(html, /google-studio\.js/);
assert.match(html, /google-studio\.css/);
const inline = [...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)]
  .map(x => x[1]).find(x => x.includes("const TH="));
assert.ok(inline, "supplied UI script is present");
new vm.Script(inline, { filename: "user-ui-inline.js" });
new vm.Script(extension, { filename: "unified-features.js" });
new vm.Script(studio, { filename: "google-studio.js" });

const el = () => ({
  innerHTML: "", value: "", style: { setProperty() {} }, classList: { add() {} },
  append() {}, remove() {}, insertBefore() {}, insertAdjacentElement() {},
  addEventListener() {}, setAttribute() {}, lastElementChild: {},
});
const elements = new Map();
const element = id => {
  if (!elements.has(id)) elements.set(id, el());
  return elements.get(id);
};
const local = new Map();
const ctx = vm.createContext({
  console,
  Date,
  Math,
  setTimeout() {},
  matchMedia() { return { matches: false }; },
  localStorage: { getItem: key => local.get(key) || null, setItem: (key, value) => local.set(key, value) },
  location: { pathname: "/" },
  document: {
    getElementById: element,
    createElement: () => el(),
    querySelector: () => el(),
    addEventListener() {},
    documentElement: { style: {} },
  },
  addEventListener() {},
  window: { addEventListener() {} },
});
ctx.window = ctx; // In a real classic script, window properties are globals.

// Set up the supplied UI's state and render functions without booting a real DOM.
const beforeBoot = inline.slice(0, inline.indexOf("$('root').innerHTML=`"));
assert.ok(beforeBoot.length > 1000);
vm.runInContext(beforeBoot, ctx);
vm.runInContext("rShell=()=>{};rSide=()=>{};rMain=()=>{};upd=()=>{};rBack=()=>{};rRight=()=>{};", ctx);
vm.runInContext(extension, ctx);
assert.equal(vm.runInContext("S.unified.approvals.length", ctx), 3);
assert.match(vm.runInContext("GP.money()", ctx), /Waiting for your approval/);
assert.match(vm.runInContext("GP.connect()", ctx), /Not connected/);
assert.match(vm.runInContext("GP.blueprint()", ctx), /Chrome Manifest V3/);
assert.match(vm.runInContext("GP.activity()", ctx), /Why this action\?|Agent Activity/);

vm.runInContext("decideApproval('p1',true)", ctx);
assert.equal(vm.runInContext("S.unified.approvals.length", ctx), 2);
assert.equal(vm.runInContext("S.unified.transactions[0].status", ctx), "Demo approved");
assert.match(vm.runInContext("S.unified.activity[0].why", ctx), /No funds moved/);
vm.runInContext("grantScope('gmail.readonly',true)", ctx);
assert.equal(vm.runInContext("S.unified.consent['gmail.readonly']", ctx), true);
assert.ok(local.has("google-agentic-browser-unified-v1"));
vm.runInContext("openUnified('money')", ctx);
assert.equal(vm.runInContext("S.tabs.at(-1).page", ctx), "money");

// Check that the real API panel mounts without modifying the original app boot.
ctx.document.querySelector = () => null;
ctx.fetch = async url => ({
  ok: true,
  json: async () => url.includes('/status') ? {
    gemini: { configured: false, model: 'gemini-2.5-flash' },
    googleDrive: { configured: false, connected: false },
  } : {},
});
vm.runInContext(studio, ctx);
assert.match(vm.runInContext('GP.studio()', ctx), /Six minds\. One mission/);
assert.match(vm.runInContext('GP.studio()', ctx), /Approval-first/);
assert.match(vm.runInContext('GP.studio()', ctx), /Generate Gemini plan/);
assert.equal(typeof ctx.openGoogleStudio, 'function');

console.log("PASS: supplied UI parses; demo approvals, audit, consent, navigation and Gemini Studio panel mount");
