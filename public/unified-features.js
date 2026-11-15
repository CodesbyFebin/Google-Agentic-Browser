/* Google Agentic Browser — unified demo extensions.
 * Adds the Activity, Money OS and Workspace controls to the supplied UI.
 * No third-party services, identities or payments are connected here.
 */
(() => {
  const storageKey = "google-agentic-browser-unified-v1";
  const initialActivity = [
    { id: "a1", time: "09:02", source: "Gmail", confidence: "High", text: "Found marketing report (sample)", why: "Demo Gmail search found two example report messages. No mailbox was accessed." },
    { id: "a2", time: "09:12", source: "Drive", confidence: "Low", text: "Flagged an invoice duplicate (sample)", why: "Example invoice 4218 has a repeated line. The amount differs by ₹40, so this needs human review." },
    { id: "a3", time: "09:28", source: "Calendar", confidence: "High", text: "Proposed a meeting for Friday (sample)", why: "A demonstration calendar has a free 3 PM slot. No invitation was sent." },
    { id: "a4", time: "10:04", source: "Search", confidence: "High", text: "Prepared a sourced research plan (sample)", why: "This is a fictional example of a grounded search workflow, not a live search result." },
    { id: "a5", time: "11:15", source: "Gmail", confidence: "High", text: "Prepared an email draft (sample)", why: "The sample draft asks a vendor to correct an invoice. Nothing was sent." },
  ];
  const initialApprovals = [
    { id: "p1", title: "Swiggy family order", amount: 642, risk: "Low" },
    { id: "p2", title: "Amazon personal order", amount: 1299, risk: "Medium" },
    { id: "p3", title: "Shared rent", amount: 8000, risk: "High" },
  ];
  const initialTransactions = [
    { id: "t1", title: "Notion team plan", amount: 499, status: "Demo approved" },
    { id: "t2", title: "Figma Pro", amount: 1299, status: "Demo approved" },
  ];
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { /* private mode */ }
  S.unified = {
    autonomy: ["Approval Required", "Supervised", "Demo autonomy"].includes(saved.autonomy) ? saved.autonomy : "Approval Required",
    approvals: Array.isArray(saved.approvals) ? saved.approvals : initialApprovals,
    transactions: Array.isArray(saved.transactions) ? saved.transactions : initialTransactions,
    activity: Array.isArray(saved.activity) ? saved.activity : initialActivity,
    consent: saved.consent && typeof saved.consent === "object" ? saved.consent : {},
    filter: "All",
  };

  const u = S.unified;
  const money = n => "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const tag = text => `<span class="unified-tag">${esc(text)}</span>`;
  const action = (fn, label, color) => `<button onclick="${fn}" class="unified-action"${color ? ` style="background:${color};color:#fff"` : ""}>${label}</button>`;
  function persist() {
    try {
      const { autonomy, approvals, transactions, activity, consent } = u;
      localStorage.setItem(storageKey, JSON.stringify({ autonomy, approvals, transactions, activity: activity.slice(0, 80), consent }));
    } catch { /* storage not available */ }
  }
  function logActivity(source, text, why, confidence = "High") {
    u.activity.unshift({ id: "a" + Date.now() + Math.random().toString(36).slice(2, 5), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), source, text, why, confidence });
    persist();
  }
  function panelTitle(name, subtitle) {
    return `<div class="unified-panel-heading"><h2>${name}</h2><p>${subtitle}</p></div>`;
  }
  function modePicker() {
    return `<label class="unified-label" for="autonomy-mode">Autonomy policy · demo</label><select id="autonomy-mode" class="unified-select" onchange="setAutonomy(this.value)">
      ${["Approval Required", "Supervised", "Demo autonomy"].map(m => `<option${m === u.autonomy ? " selected" : ""}>${m}</option>`).join("")}
    </select><p class="unified-subtext">Payments, sending messages, deleting data and consent always need your explicit approval, in every mode.</p>`;
  }
  function activityRows(limit = 12) {
    const rows = u.activity.filter(e => u.filter === "All" || e.source === u.filter).slice(0, limit);
    return rows.map(e => `<button class="unified-activity-row" onclick="showActivity('${e.id}')"><span class="unified-activity-dot" style="background:${e.confidence === "High" ? "#34A853" : "#FBBC04"}"></span><span class="min-w-0"><b>${esc(e.text)}</b><small>${esc(e.source)} · ${esc(e.time)} · ${esc(e.confidence)} confidence</small></span><span class="text-white/50">↗</span></button>`).join("") || `<p class="unified-subtext">No matching entries yet.</p>`;
  }
  function activityView() {
    return `${panelTitle("Agent Activity", "A decision trail with explanations. All sample entries are clearly marked.")}
      <div class="unified-filters">${["All", "Gmail", "Drive", "Calendar", "Search", "Agent", "Money", "Workspace"].map(f => `<button class="unified-filter ${u.filter === f ? "selected" : ""}" onclick="filterActivity('${f}')">${f}</button>`).join("")}</div>
      ${activityRows(30)}<div class="unified-card">${modePicker()}</div>`;
  }
  function approvalRows() {
    return u.approvals.map(a => `<div class="unified-card"><div class="flex items-start justify-between gap-3"><div><b>${esc(a.title)}</b><p class="unified-subtext">${esc(a.risk)} risk · simulated request</p></div><strong class="whitespace-nowrap">${money(a.amount)}</strong></div><div class="flex flex-wrap gap-2 mt-3">${action(`decideApproval('${a.id}',true)`, "Approve demo", "#188A59")}${action(`decideApproval('${a.id}',false)`, "Reject", "#B23A4F")}</div></div>`).join("") || `<div class="unified-card text-emerald-300">No approvals are waiting.</div>`;
  }
  function walletView() {
    const total = u.transactions.filter(t => t.status === "Demo approved").reduce((n, t) => n + Number(t.amount), 0);
    return `${panelTitle("Money OS", "Approval-first payments and orders · demonstration only")}
      <div class="unified-stats"><div><span>Example balance</span><strong>₹1,84,250</strong></div><div><span>Demo approved</span><strong>${money(total)}</strong></div></div>
      <h3 class="unified-section-title">Waiting for your approval <span>${u.approvals.length}</span></h3>${approvalRows()}
      <form class="unified-card" onsubmit="return requestOrder(event)"><label class="unified-label" for="new-order">Create an order request</label><input id="new-order" class="unified-input" placeholder="Order title" maxlength="70" required><div class="flex gap-2 mt-2"><input id="new-amount" class="unified-input min-w-0" type="number" min="1" max="1000000" placeholder="Amount (₹)" required>${action("", "Add for approval", "#4285F4").replace('<button onclick=""', '<button type="submit"')}</div></form>
      <h3 class="unified-section-title">Recent demo transactions</h3>${u.transactions.slice(0, 12).map(t => `<div class="unified-transaction"><span>${esc(t.title)}<small>${esc(t.status)}</small></span><b>${money(t.amount)}</b></div>`).join("")}
      <div class="unified-card">${modePicker()}<p class="unified-subtext">No real PayPal payment, digital asset, wallet or bank account is connected.</p></div>`;
  }
  const scopes = [
    { name: "Gmail", key: "gmail.readonly", reason: "Search example emails" },
    { name: "Calendar", key: "calendar.events", reason: "Suggest times and events" },
    { name: "Drive", key: "drive.file", reason: "Use files you select" },
    { name: "Gmail archive", key: "gmail.modify", reason: "Archive a selected message" },
    { name: "YouTube", key: "youtube.readonly", reason: "Find saved videos" },
  ];
  function consentView() {
    return `${panelTitle("Workspace Consent", "Review what each agent would ask for before connecting an account")}
      <div class="unified-card border-amber-400/30"><b>Prototype permissions only</b><p class="unified-subtext">These switches store a local demonstration choice. They do not sign in to Google or grant OAuth permissions.</p></div>
      ${scopes.map(s => `<div class="unified-card"><div class="flex items-start justify-between gap-2"><div><b>${esc(s.name)}</b><code class="unified-scope">${esc(s.key)}</code><p class="unified-subtext">${esc(s.reason)}</p></div>${tag(u.consent[s.key] ? "Demo allowed" : "Not connected")}</div><div class="mt-3">${action(`requestScope('${s.key}')`, u.consent[s.key] ? "Review / revoke" : "Review scope")}</div></div>`).join("")}
      <p class="unified-subtext">A production integration would use secure OAuth, scope verification, revocation and provider-side audit records.</p>`;
  }
  function blueprintView() {
    const current = [
      ["Browser shell", "Spaces, tab previews, launcher, themes and Focus / Zen modes"],
      ["Mission flight recorder", "Six simulated agents, approval checkpoints and replay"],
      ["Guarded demo actions", "Local decision log, Money OS and sample consent choices"],
    ];
    const planned = [
      ["Chrome Manifest V3", "Side panel, scoped tab APIs and an ephemeral service worker"],
      ["Live agent execution", "Validated tools, isolated capabilities and prompt-injection controls"],
      ["Real integrations", "Per-scope Google OAuth, verified payment receipts and explicit write approval"],
      ["Trusted agent UI", "Declarative A2UI rendering, signed passports, durable audit export"],
    ];
    const cards = (items, status) => items.map(([name, desc]) => `<div class="unified-card"><div class="flex items-center justify-between gap-2"><b>${esc(name)}</b>${tag(status)}</div><p class="unified-subtext">${esc(desc)}</p></div>`).join("");
    return `${panelTitle("Agents Edition Blueprint", "How the selected UI grows into a real, auditable Chrome extension")}
      <div class="unified-card border-blue-400/30"><b>Independent concept · current build</b><p class="unified-subtext">This version is a web UI demonstration, not a Chromium engine, Chrome extension, or connected Google product. The roadmap below describes future engineering work.</p></div>
      <h3 class="unified-section-title">Available in this demo</h3>${cards(current, "Demo")}
      <h3 class="unified-section-title">Specified for future implementation</h3>${cards(planned, "Planned")}
      <div class="unified-card"><b>Safety rules throughout</b><p class="unified-subtext">Separate planning from execution. Never send, spend, delete or publish without human authorization. Use least-privilege scopes, enforce budgets in the tool layer, and keep an inspectable record.</p><a href="/BLUEPRINT.md" target="_blank" rel="noopener noreferrer" class="unified-document-link">Read full engineering blueprint ↗</a></div>`;
  }
  GP.money = () => pgx("Money OS · Guarded payments", walletView());
  GP.activity = () => pgx("Agent Activity & Decisions", activityView());
  GP.connect = () => pgx("Google Workspace permissions", consentView());
  GP.blueprint = () => pgx("Agents Edition roadmap", blueprintView());

  window.openUnified = function (page) {
    const labels = { money: "Money OS", activity: "Activity Log", connect: "Workspace Consent", blueprint: "Agents Blueprint" };
    if (!labels[page]) return;
    openPage(labels[page], page, "agentic://" + page);
  };
  window.showActivity = function (id) {
    const e = u.activity.find(x => x.id === id);
    if (!e) return;
    $("modal").innerHTML = `<div class="unified-modal-backdrop" onclick="if(event.target===this)this.innerHTML=''"><div class="unified-modal"><div class="flex items-start justify-between gap-3"><h2 class="text-xl font-bold">Why this action?</h2><button onclick="document.getElementById('modal').innerHTML=''" aria-label="Close">✕</button></div><div class="mt-4">${tag(e.source)} ${tag(e.confidence + " confidence")}</div><h3 class="font-bold mt-4">${esc(e.text)}</h3><p class="mt-3 text-sm text-white/75 leading-6">${esc(e.why)}</p><p class="unified-subtext mt-3">Simulated / local activity log</p></div></div>`;
  };
  window.filterActivity = function (filter) { u.filter = filter; refreshUnified(); };
  window.setAutonomy = function (mode) {
    if (!["Approval Required", "Supervised", "Demo autonomy"].includes(mode)) return;
    u.autonomy = mode;
    persist();
    logActivity("Agent", "Policy changed to " + mode, "High-stakes simulated actions still require explicit approval.");
    toast("Demo policy: " + mode);
    refreshUnified();
  };
  window.decideApproval = function (id, allow) {
    const index = u.approvals.findIndex(x => x.id === id);
    if (index < 0) return;
    const [item] = u.approvals.splice(index, 1);
    u.transactions.unshift({ id: "t" + Date.now(), title: item.title, amount: item.amount, status: allow ? "Demo approved" : "Demo rejected" });
    logActivity("Money", `${allow ? "Approved" : "Rejected"} ${item.title} (${money(item.amount)})`, "You explicitly made this local demo decision. No funds moved.");
    persist(); toast(allow ? "Demo approval recorded — no payment sent" : "Demo request rejected"); refreshUnified();
  };
  window.requestOrder = function (event) {
    event.preventDefault();
    const title = document.getElementById("new-order").value.trim();
    const amount = Number(document.getElementById("new-amount").value);
    if (!title || !(amount > 0) || amount > 1000000 || !Number.isFinite(amount)) { toast("Enter a valid title and amount"); return false; }
    u.approvals.unshift({ id: "p" + Date.now(), title: title.slice(0, 70), amount, risk: amount > 5000 ? "High" : "Medium" });
    logActivity("Money", "Requested approval for " + title, "The order was queued for your approval, not charged.");
    persist(); toast("Demo order added to approvals"); refreshUnified(); return false;
  };
  window.requestScope = function (key) {
    const s = scopes.find(x => x.key === key); if (!s) return;
    const revoke = !!u.consent[key];
    $("modal").innerHTML = `<div class="unified-modal-backdrop"><div class="unified-modal"><h2 class="text-xl font-bold">${revoke ? "Revoke demo choice" : "Review permission"}</h2><p class="unified-subtext mt-2">${esc(s.name)} · ${esc(s.key)}</p><p class="mt-4 text-sm">${esc(s.reason)}</p><p class="unified-subtext mt-3">This is not a real Google authorization request. It affects this preview only.</p><div class="flex gap-2 mt-5">${action(`grantScope('${key}',${!revoke})`, revoke ? "Revoke locally" : "Allow in demo", "#188A59")}${action("document.getElementById('modal').innerHTML=''", "Cancel")}</div></div></div>`;
  };
  window.grantScope = function (key, grant) {
    if (!scopes.some(x => x.key === key)) return;
    u.consent[key] = !!grant;
    logActivity("Workspace", `${grant ? "Allowed" : "Revoked"} demo ${key}`, "This permission setting was changed locally. No Google OAuth operation occurred.");
    persist(); $("modal").innerHTML = ""; toast(grant ? "Demo permission noted" : "Demo permission revoked"); refreshUnified();
  };

  const oldRight = rRight;
  rRight = function () {
    oldRight();
    const buttons = $("rtabs");
    buttons.classList.add("unified-right-tabs");
    for (const [key, name] of [["activity", "Activity"], ["wallet", "Money OS"], ["connect", "Connect"], ["blueprint", "Blueprint"]]) {
      const button = document.createElement("button");
      button.className = "unified-right-tab" + (S.rtab === key ? " active" : "");
      button.textContent = name;
      button.onclick = () => { S.rtab = key; rRight(); };
      buttons.append(button);
    }
    if (S.rtab === "activity") $("rbody").innerHTML = activityView();
    else if (S.rtab === "wallet") $("rbody").innerHTML = walletView();
    else if (S.rtab === "connect") $("rbody").innerHTML = consentView();
    else if (S.rtab === "blueprint") $("rbody").innerHTML = blueprintView();
  };
  const oldAll = rAll;
  rAll = function () { oldAll(); rRight(); };
  const oldPush = push;
  push = function (step, extra) {
    oldPush(step, extra);
    logActivity("Agent", (extra?.msg || step.msg).slice(0, 180), "Simulated mission recorder step. Open the Recorder tab to inspect the sequence.");
    if (["activity", "wallet", "connect", "blueprint"].includes(S.rtab)) rRight();
  };
  function refreshUnified() {
    rRight();
    const active = S.tabs.find(t => t.id === S.active);
    if (active && ["money", "activity", "connect", "blueprint"].includes(active.page)) rMain();
  }
  const header = document.querySelector("#inner > header");
  if (header) {
    const bar = document.createElement("nav");
    bar.className = "unified-primary-nav";
    bar.setAttribute("aria-label", "Unified browser workspaces");
    bar.innerHTML = `<button onclick="openPage('New Tab','home','agentic://new-tab')">✦ Browser</button><button onclick="goMission()">🦄 Agents</button><button onclick="openUnified('activity')">◉ Activity</button><button onclick="openUnified('money')">◈ Money OS</button><button onclick="openUnified('connect')">⊞ Workspace</button><button onclick="openUnified('blueprint')">◇ Blueprint</button>`;
    if (location.pathname.endsWith("google-agentic-browser.html")) {
      bar.innerHTML += `<a href="/agents-edition" target="_top">Agents Edition ↗</a><a href="/classic" target="_top">Classic browser ↗</a><a href="/money" target="_top">Full Money OS ↗</a><a href="/guardian" target="_top">Guardian ↗</a><a href="/mission" target="_top">Mission lab ↗</a>`;
    }
    header.insertAdjacentElement("afterend", bar);
  }
  const side = $("side");
  if (side) {
    const actions = document.createElement("div");
    actions.className = "unified-side-actions";
    actions.innerHTML = `<span class="text-[11px] font-bold tracking-widest text-white/50">WORKSPACES</span><div><button onclick="openUnified('money')">◈ Money OS</button><button onclick="openUnified('activity')">◉ Decision log</button><button onclick="openUnified('connect')">⊞ App consent</button><button onclick="openUnified('blueprint')">◇ Blueprint</button></div>`;
    side.insertBefore(actions, side.lastElementChild);
  }
  window.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "m") { event.preventDefault(); openUnified("money"); }
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "a") { event.preventDefault(); openUnified("activity"); }
  });
  rAll();
})();
