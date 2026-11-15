// Google Agentic Browser — merged static data.
// Combines the workspace skeleton (themes, spaces, features) with the
// mission system from the rich HTML prototype (agents, steps) and the
// Money OS / payments data from the single-file App.tsx prototypes.

export type PageKind =
  | "home"
  | "wiki"
  | "mdn"
  | "github"
  | "youtube"
  | "figma"
  | "news"
  | "notion"
  | "linear"
  | "gemini"
  | "money"
  | "agent";

export type Tab = {
  id: string;
  title: string;
  space: string;
  page: PageKind;
  fav: string;
  muted?: boolean;
  pinned?: boolean;
  domain: string;
};

export type ThemeDef = {
  accent: string;
  accent2: string;
  bg: string;
  glow: string;
  card: string;
  muted: string;
};

export const THEMES: Record<string, ThemeDef> = {
  "Agentic Blue": {
    accent: "#4285F4",
    accent2: "#EA4335",
    bg: "#060814",
    glow: "rgba(66,133,244,0.42)",
    card: "#11142a",
    muted: "#9aa0bc",
  },
  "Gemini Iris": {
    accent: "#7B61FF",
    accent2: "#00D4FF",
    bg: "#0B071A",
    glow: "rgba(123,97,255,0.45)",
    card: "#171029",
    muted: "#a39fc4",
  },
  "Solar Flare": {
    accent: "#FA3D1D",
    accent2: "#FFD400",
    bg: "#160B08",
    glow: "rgba(250,61,29,0.42)",
    card: "#211209",
    muted: "#b08a7a",
  },
  "Ocean Glass": {
    accent: "#00B8C7",
    accent2: "#5092C7",
    bg: "#051418",
    glow: "rgba(0,184,199,0.4)",
    card: "#0B1D25",
    muted: "#7fa5ad",
  },
  "Neo Mint": {
    accent: "#00C48C",
    accent2: "#A8FF3E",
    bg: "#07130F",
    glow: "rgba(0,196,140,0.38)",
    card: "#0F211A",
    muted: "#86a89a",
  },
  "Cyber Peach": {
    accent: "#FF6B9D",
    accent2: "#FFB86B",
    bg: "#17101A",
    glow: "rgba(255,107,157,0.4)",
    card: "#221A26",
    muted: "#b08ba0",
  },
  "Mono Chrome": {
    accent: "#E8E8E8",
    accent2: "#8A8A8A",
    bg: "#0A0A0A",
    glow: "rgba(255,255,255,0.22)",
    card: "#151515",
    muted: "#888888",
  },
  "Dia Sunglow": {
    accent: "#FFAA00",
    accent2: "#FF5E9A",
    bg: "#181008",
    glow: "rgba(255,170,0,0.38)",
    card: "#241B0C",
    muted: "#a8937a",
  },
};

export type SpaceDef = {
  name: string;
  accent: string;
  icon: string;
  desc: string;
};

export const SPACES: SpaceDef[] = [
  { name: "Work", accent: "#4285F4", icon: "B", desc: "Shipping Agentic Browser" },
  { name: "Money", accent: "#34A853", icon: "₹", desc: "Payments & budgets" },
  { name: "Personal", accent: "#EA4335", icon: "P", desc: "Life, music & play" },
  { name: "Research", accent: "#8B5CF6", icon: "R", desc: "Deep reading" },
  { name: "Focus", accent: "#FBBC04", icon: "F", desc: "One thing at a time" },
];

export type PinnedSite = {
  name: string;
  icon: string;
  color: string;
  page: PageKind;
  domain: string;
};

export const PINNED: PinnedSite[] = [
  { name: "Gmail", icon: "M", color: "#EA4335", page: "notion", domain: "mail.google.com" },
  { name: "GitHub", icon: "G", color: "#8B949E", page: "github", domain: "github.com" },
  { name: "YouTube", icon: "Y", color: "#FF0000", page: "youtube", domain: "youtube.com" },
  { name: "Figma", icon: "F", color: "#A259FF", page: "figma", domain: "figma.com" },
  { name: "Notion", icon: "N", color: "#E1E1FE", page: "notion", domain: "notion.so" },
  { name: "X", icon: "X", color: "#FFFFFF", page: "news", domain: "x.com" },
  { name: "Linear", icon: "L", color: "#5E6AD2", page: "linear", domain: "linear.app" },
  { name: "Money", icon: "₹", color: "#34A853", page: "money", domain: "pay.google/money-os" },
  { name: "Agents", icon: "✦", color: "#4285F4", page: "agent", domain: "agenet://mission" },
  { name: "Gemini", icon: "S", color: "#4285F4", page: "gemini", domain: "gemini.google.com" },
];

/* ===================== Agents & Missions ===================== */
// Ported from the rich HTML prototype: AGENTS, MISSION_SCRIPT, MISSION_POS, didFor().

export type AgentId =
  | "orch"
  | "scout"
  | "ana"
  | "sent"
  | "buy"
  | "scr";

export type AgentDef = {
  id: AgentId;
  name: string;
  emoji: string;
  role: string;
  capabilities: string[];
  scopes?: string;
  spendLimit: number; // USDC per mission
  reputation: number; // /100
  balance: number; // USDC balance
};

export const AGENTS: Record<AgentId, AgentDef> = {
  orch: {
    id: "orch",
    name: "Nova Prime",
    emoji: "🦄",
    role: "Orchestrator",
    capabilities: ["plan", "delegate", "recover"],
    spendLimit: 0.5,
    reputation: 99,
    balance: 1,
  },
  scout: {
    id: "scout",
    name: "Scout Fox",
    emoji: "🦊",
    role: "Browser recon",
    capabilities: ["browse", "extract", "tabs"],
    spendLimit: 0.5,
    reputation: 96,
    balance: 0.5,
  },
  ana: {
    id: "ana",
    name: "Professor Octo",
    emoji: "🐙",
    role: "Analyst",
    capabilities: ["compare", "rank", "cite"],
    spendLimit: 0.5,
    reputation: 94,
    balance: 0.5,
  },
  sent: {
    id: "sent",
    name: "Sentinel Owl",
    emoji: "🦉",
    role: "Policy guard",
    capabilities: ["approve", "block", "audit"],
    spendLimit: 0,
    reputation: 100,
    balance: 0,
  },
  buy: {
    id: "buy",
    name: "Bee Buyer",
    emoji: "🐝",
    role: "x402 payments",
    capabilities: ["pay", "vault", "receipt"],
    spendLimit: 5,
    reputation: 97,
    balance: 5,
  },
  scr: {
    id: "scr",
    name: "Scribe Turtle",
    emoji: "🐢",
    role: "Workspace: Drive, Docs, Calendar, Gmail",
    capabilities: ["drive", "docs", "calendar", "email"],
    scopes: "drive.file · docs.create · calendar.events · gmail.send",
    spendLimit: 0.5,
    reputation: 95,
    balance: 0.5,
  },
};

export type MissionPage =
  | "home"
  | "search"
  | "repo"
  | "pay"
  | "done"
  | "drive"
  | "docs"
  | "cal"
  | "mail"
  | "github";

export type MissionStepKind =
  | "plan"
  | "act"
  | "think"
  | "gate"
  | "pay"
  | "done"
  | "deny";

export type MissionStep = {
  a: AgentId; // acting agent
  t: MissionStepKind; // kind
  page: MissionPage; // page shown in the agent viewport
  url: string;
  msg: string;
  cost?: number; // USDC
  g?: number; // gated behind Google OAuth (1)
  k?: "oauth" | undefined; // gate kind (oauth vs payment)
};

// A runtime event the recorder logs (one MissionStep + the `at` timestamp).
// Kept in browser-data so both the store and the API route share the shape.
export type MissionEvent = {
  a: string; // agent id
  t: string; // kind
  page: string;
  url: string;
  msg: string;
  cost?: number;
  twin?: boolean;
  at: string; // seconds since mission start
};

export const MISSION_SCRIPT: MissionStep[] = [
  { a: "orch", t: "plan", page: "home", url: "agenet://mission-control", msg: "Split the mission into 4 tasks and spawned Scout, Octo, Bee and Scribe." },
  { a: "scout", t: "act", page: "search", url: "mcpserver.in/search?q=postgres", msg: "Opened the registry and searched \u201cpostgres mcp server\u201d." },
  { a: "scout", t: "act", page: "search", url: "mcpserver.in/search?q=postgres", msg: "Read 12 listings in parallel tabs: license, uptime, price." },
  { a: "ana", t: "think", page: "repo", url: "mcpserver.in/s/pg-mcp-gateway", msg: "Ranked all 12. Winner: pg-mcp-gateway (MIT, 99.9% uptime, 2 USDC)." },
  { a: "sent", t: "gate", page: "pay", url: "mcpserver.in/s/pg-mcp-gateway/buy", msg: "2.00 USDC is above the 1.00 auto-approve policy. Human checkpoint required." },
  { a: "buy", t: "pay", page: "pay", url: "mcpserver.in/s/pg-mcp-gateway/buy", cost: 2, msg: "Server replied HTTP 402. Signed an x402 payment of 2.00 USDC." },
  { a: "buy", t: "act", page: "done", url: "mcpserver.in/keys/new", msg: "API key received. Stored in the vault, never shown to a model." },
  { a: "sent", t: "gate", k: "oauth", page: "drive", url: "accounts.google.com/consent (simulated)", msg: "Scribe Turtle needs Google Workspace access. A consent screen was shown to you." },
  { a: "scr", t: "act", g: 1, page: "drive", url: "drive.google.com/drive/my-drive", msg: "Saved the receipt to Drive as \u201cMCP key receipt\u201d." },
  { a: "scr", t: "act", g: 1, page: "docs", url: "docs.google.com/document/d/mission-summary", msg: "Wrote the mission summary in Docs." },
  { a: "scr", t: "act", g: 1, page: "cal", url: "calendar.google.com/r/eventedit", msg: "Added \u201cReview API key rotation\u201d to Calendar for next month." },
  { a: "scr", t: "act", g: 1, page: "mail", url: "mail.google.com/mail/u/0/#compose", msg: "Emailed you the summary with the receipt and the Docs link." },
  { a: "orch", t: "done", page: "done", url: "agenet://receipt", msg: "Mission complete. Receipt hash " },
];

// Cursor positions for the agent emoji inside each mission page (percentages).
export const MISSION_POS: Record<MissionPage, [number, number]> = {
  home: [38, 45],
  search: [30, 55],
  repo: [62, 35],
  pay: [55, 62],
  done: [45, 32],
  mail: [50, 45],
  github: [40, 40],
  drive: [42, 48],
  docs: [46, 42],
  cal: [40, 55],
};

export const MISSION_GOAL_DEFAULT =
  "Find the best Postgres MCP server and buy API access";

// Deterministic did:agenet handle for an agent id.
export function didFor(id: string): string {
  let h = 7;
  for (const c of "agenet" + id) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return "did:agenet:z6Mk" + h.toString(36).padStart(7, "0");
}

// Mission receipt hash — stable across the run so the final step can quote it.
export function missionHash(steps: { msg: string }[]): string {
  let h = 5381;
  for (const e of steps) for (const c of e.msg) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
  return "0x" + h.toString(16).padStart(8, "0");
}

/* ===================== Money OS (port of GB1/GB2) ===================== */

export type Tx = {
  id: number;
  name: string;
  amount: number; // INR
  cat: string;
  rule: string;
  space: string;
  time: string;
  icon: string;
};

export type Approval = {
  id: number;
  title: string;
  amount: number;
  detail: string;
  risk: "Low" | "Medium" | "High";
  autoIn?: number; // supervised countdown seconds
};

export type Order = {
  id: string;
  name: string;
  amount: number;
  status: "Paid" | "Refunded";
  date: string;
};

export const INITIAL_TX: Tx[] = [
  { id: 1, name: "Notion", amount: 499, cat: "Productivity", rule: "Auto-tagged · Work", space: "Work", time: "09:12", icon: "N" },
  { id: 2, name: "Swiggy", amount: 642, cat: "Food", rule: "Ask First · Personal", space: "Personal", time: "12:40", icon: "S" },
  { id: 3, name: "Uber", amount: 318, cat: "Travel", rule: "Auto · Work", space: "Work", time: "13:05", icon: "U" },
  { id: 4, name: "Figma", amount: 1299, cat: "Design", rule: "Approved · Money", space: "Money", time: "14:22", icon: "F" },
  { id: 5, name: "BookMyShow", amount: 890, cat: "Entertainment", rule: "Ask First · Personal", space: "Personal", time: "18:10", icon: "B" },
  { id: 6, name: "DMart", amount: 1840, cat: "Groceries", rule: "Auto · Personal", space: "Personal", time: "19:45", icon: "D" },
];

export const INITIAL_APPROVALS: Approval[] = [
  { id: 1, title: "Pay ₹642 · Swiggy", amount: 642, detail: "Food delivery · Personal · Low risk", risk: "Low" },
  { id: 2, title: "Pay ₹1,299 · Amazon", amount: 1299, detail: "Order · Personal · Medium risk", risk: "Medium" },
  { id: 3, title: "Pay ₹8,000 · Rent share", amount: 8000, detail: "Monthly share · Personal · High stakes", risk: "High" },
];

export const INITIAL_ORDERS: Order[] = [
  { id: "ORD-1042", name: "Notion Team Plan", amount: 499, status: "Paid", date: "Today" },
  { id: "ORD-1041", name: "Figma Pro", amount: 1299, status: "Paid", date: "Yesterday" },
];

export const GOALS = [
  { name: "Japan Trip", saved: 28400, target: 85000, color: "#4285F4" },
  { name: "Emergency Fund", saved: 42000, target: 60000, color: "#34A853" },
  { name: "New Laptop", saved: 18400, target: 95000, color: "#FBBC04" },
];

export const MONEY_GUARDS = [
  "Ask first above limit",
  "Block duplicate charges",
  "Auto-approve trusted merchants",
];

export const PAYPAL_REPOS = [
  { name: "agent-toolkit", use: "Use for agent payments" },
  { name: "mcp-server", use: "Use for tool access" },
  { name: "AI Toolkit", use: "Use for Gemini workflows" },
  { name: "paypal-js", use: "Use for checkout UI" },
  { name: "server-sdks", use: "Use for server payouts" },
  { name: "messages", use: "Use for pay-later UI" },
  { name: "ruleshub", use: "Use for guard rules" },
];

export const SPEND_BY_CATEGORY = [
  { l: "Groceries", v: 1840 },
  { l: "Design", v: 1299 },
  { l: "Entertainment", v: 890 },
  { l: "Food", v: 642 },
  { l: "Productivity", v: 499 },
  { l: "Travel", v: 318 },
];

/* ===================== Activity feed (port of GB2) ===================== */

export type FeedEntry = {
  id: number;
  time: string;
  source: "Gmail" | "Drive" | "Calendar" | "Search";
  conf: "high" | "low";
  text: string;
  why: string;
};

export const INITIAL_FEED: FeedEntry[] = [
  { id: 1, time: "09:02", source: "Gmail", conf: "high", text: "Checked Gmail for marketing report", why: "You asked for the latest report. Found 2 unread messages matching \u201cmarketing report\u201d from the last 24 hours." },
  { id: 2, time: "09:12", source: "Drive", conf: "low", text: "Flagged invoice #4218", why: "Vendor submitted a duplicate line item matching 3 previous submissions. Confidence is low because the total differs by ₹40." },
  { id: 3, time: "09:28", source: "Calendar", conf: "high", text: "Proposed meeting Fri 3pm", why: "Checked Calendar — Fri 3pm is free, no overlap with standup, and all attendees are available." },
  { id: 4, time: "10:04", source: "Search", conf: "high", text: "Grounded answer with 3 sources", why: "Used Gemini grounding to check current pricing and docs before answering, instead of relying on memory." },
  { id: 5, time: "10:31", source: "Calendar", conf: "low", text: "Suggested moving standup to 10:30", why: "One attendee has a tentative hold at 10:00. Low confidence — the hold has no title or location." },
  { id: 6, time: "11:15", source: "Gmail", conf: "high", text: "Drafted reply to vendor", why: "Draft only — no message was sent. The draft quotes invoice #4218 and asks for a corrected line item." },
];

export type Autonomy = "Full Autonomy" | "Supervised Autonomy" | "Approval Required";

export const AUTONOMY_DESC: Record<Autonomy, string> = {
  "Full Autonomy": "Full: the agent acts and logs silently. Use only for low-risk, reversible work.",
  "Supervised Autonomy": "Supervised: low-risk actions auto-approve after a 5-second countdown you can stop. High-stakes actions still ask.",
  "Approval Required": "Approval Required: every action waits for your Approve / Reject. Nothing moves without you.",
};

/* ===================== Connect / OAuth (port of GB2) ===================== */

export type ConnectApp = {
  name: string;
  scope: string;
  desc: string;
  status: "Connected" | "Request Access";
};

export const CONNECT_APPS: ConnectApp[] = [
  { name: "Gmail", scope: "gmail.readonly", desc: "Read mail to find reports, receipts and drafts.", status: "Connected" },
  { name: "Calendar", scope: "calendar.events", desc: "Read events to propose times without conflicts.", status: "Connected" },
  { name: "Drive", scope: "drive.file", desc: "Open only files you pick or mention.", status: "Connected" },
  { name: "Search", scope: "Gemini grounding", desc: "Ground answers in current web sources.", status: "Connected" },
  { name: "YouTube", scope: "youtube.readonly", desc: "Find focus music and saved videos.", status: "Request Access" },
  { name: "Photos", scope: "photos.readonly", desc: "Find trip photos when you ask for them.", status: "Request Access" },
];

export type Quota = { l: string; v: number; note: string };
export const QUOTAS: Quota[] = [
  { l: "YouTube", v: 32, note: "10,000 units / day" },
  { l: "Gmail", v: 18, note: "6,000 units / min / user" },
  { l: "Gemini grounding", v: 55, note: "$14 / 1k beyond 5k free" },
];

export const ROADMAP = [
  { phase: "Phase 1 — MVP", title: "Search, Gmail, Calendar, Drive", items: ["Gemini summaries of any tab", "Gmail + Drive search with WHY explanations", "Calendar proposals with conflict checks", "Guarded payments with approvals"], status: "In progress" },
  { phase: "Phase 2 — Media + IoT", title: "YouTube, Photos, Home", items: ["YouTube focus player + PiP", "Photos search by trip or person", "Home routines that ask before acting", "Quota-aware media requests"], status: "Planned" },
  { phase: "Phase 3 — Mobile + Enterprise", title: "Maps, AMAPI, Cloud", items: ["Mobile companion with the same approvals", "Enterprise controls + audit export", "Admin-managed scopes and consent", "Workspace MCP with is_agentic clients"], status: "Planned" },
];

export const PLAN_STEPS = [
  "Check Calendar for Friday — find the free blocks",
  "Draft the plan in order: focus, meetings, errands",
  "Check Drive for the Friday report you need",
  "Propose times and ask for approval before booking",
  "Turn the approved plan into 4 to-dos",
];

/* ===================== Features (kept from workspace) ===================== */

export type Feature = {
  n: number;
  title: string;
  desc: string;
  cat: string;
  badge: string;
};

const aiFeatures: [string, string][] = [
  ["AI Tab Summaries", "Every tab gets a one-line, on-device summary."],
  ["Agentic Command Bar", "Ask in plain language — Gemini runs the action."],
  ["Ask Any Tab", "Chat with any open page without switching."],
  ["Auto Research Notes", "Tabs turn into structured notes automatically."],
  ["AI Meeting Recap", "Turn a call tab into decisions and owners."],
  ["Smart Tab Naming", "Tabs rename themselves from what matters."],
  ["AI Writing in Any Textbox", "Rewrite, shorten or warm up any draft."],
  ["Voice Command Hey Gemini", "Hands-free tabs, search and navigation."],
  ["AI Screenshot Q&A", "Ask questions about anything you capture."],
  ["Auto Alt-Text", "Images get useful descriptions instantly."],
  ["AI Translation On-Device", "Private translation that never leaves the tab."],
  ["AI Code Explainer", "Hover code — get a plain-language walkthrough."],
  ["AI Price Tracker", "Watch prices across tabs and alert on drops."],
  ["AI Email Triage", "Your inbox, sorted by what needs you."],
  ["AI Focus Coach", "Gentle nudges when attention drifts."],
  ["AI Memory", "Gemini remembers pages you actually loved."],
  ["AI Playlist from Tabs", "Videos and songs become a queue."],
  ["AI Duplicate Tab Detector", "Finds and merges near-identical tabs."],
];

const prodFeatures: [string, string][] = [
  ["Split to 4", "Four live panes in one window."],
  ["Vertical Tabs", "A calm, scannable sidebar for heavy days."],
  ["Tab Stacks", "Group tabs like a deck, flip with a key."],
  ["Workspaces v2", "Spaces with rules, widgets and memory."],
  ["Focus Timer + Pomodoro", "A timer that dims the rest of the browser."],
  ["Calendar in Sidebar", "Today, without opening another app."],
  ["Tasks from Tabs", "Turn any page into a checked-off task."],
  ["Read Later Queue", "Save it now, read it when you breathe."],
  ["Quick Notes per Tab", "A note that lives on the page it belongs to."],
  ["Clipboard History", "Everything you copied, searchable."],
  ["Session Snapshots", "Save this exact moment and return to it."],
  ["Tab Timelines", "See how a research rabbit hole unfolded."],
  ["Auto-Archive", "Old tabs rest themselves."],
  ["Smart Bookmarks", "Bookmarks that know why you saved them."],
  ["Link Cleaner v2", "Strip tracking junk before you share."],
  ["Copy as Markdown", "Clean links, headings and quotes."],
  ["Screenshot Full Page", "The whole page, not just the viewport."],
  ["Web Clipper to Notion", "Clip anything into a tidy Notion page."],
];

const privacyFeatures: [string, string][] = [
  ["Built-in VPN", "One tap, private by default."],
  ["Fingerprint Spoofing", "Look ordinary to trackers."],
  ["Cookie Auto-Delete per Space", "Work cookies never follow you home."],
  ["Tracker Map", "See who tried to follow you — live."],
  ["Passkey Vault", "No passwords to leak, ever."],
  ["Disposable Profiles", "A fresh identity for one risky click."],
  ["Anti-Phishing AI", "Warnings before the page loads."],
  ["Permission Timeline", "Every mic, camera and location ask, logged."],
  ["Private AI Mode", "AI help with zero history kept."],
  ["Tor Tab", "One tab, routed through Tor."],
  ["Encrypted Notes", "Notes locked to your device."],
  ["Breach Alerts", "Know the moment your data appears elsewhere."],
  ["DNS over HTTPS", "Lookups that stay yours."],
  ["Camera/Mic Indicators", "A glow whenever something is watching."],
];

const perfFeatures: [string, string][] = [
  ["Tab Napping v2", "Sleeping tabs wake in milliseconds."],
  ["Memory Saver AI", "Frees RAM before you notice a slowdown."],
  ["Battery Saver", "Hours back on a long flight."],
  ["Instant Startup", "Your last session, instantly."],
  ["Prefetch AI", "The next page loads before you click."],
  ["GPU Acceleration", "Silky scrolling on every page."],
  ["Lazy Images", "Images arrive exactly when needed."],
  ["0.3% Idle CPU Mode", "Almost asleep when you are not looking."],
  ["Network Saver", "Less data, same web."],
  ["Extension Sleep", "Extensions nap when their tab does."],
  ["Cache Smart Clean", "Speed without losing what matters."],
  ["Background Sync Pause", "Quiet tabs stay quiet."],
];

const designFeatures: [string, string][] = [
  ["12 Gradient Themes", "A whole mood in one click."],
  ["Dynamic Theme from Wallpaper", "Your wallpaper becomes the browser."],
  ["Glass Sidebar", "Frosted, calm, alive."],
  ["Breathing Light", "A soft spectrum glow behind everything."],
  ["Custom Fonts", "The web in your typeface."],
  ["Compact Mode", "More web, less chrome."],
  ["Zen Mode", "Only the page remains."],
  ["Cursor Glow", "A soft light follows your intent."],
  ["Animated Tab Icons", "Tabs that feel alive."],
  ["Custom New Tab Widgets", "Build your own home."],
  ["Live Wallpaper", "A home page that breathes."],
  ["Emoji Tab Icons", "A face for every tab."],
  ["Colorblind Modes", "Color that works for everyone."],
  ["Reduced Motion", "Calm animation, always an option."],
];

const tabsFeatures: [string, string][] = [
  ["Spaces v2", "Spaces with memory, rules and rituals."],
  ["Space Rules", "Tabs sort themselves into the right space."],
  ["Tab Groups Auto-Named", "Groups that name themselves."],
  ["Gemini Mini", "A tiny companion for quick jumps."],
  ["Tab Search Fuzzy", "Find a tab by a half-remembered word."],
  ["Recently Cleaned v2", "Everything you cleaned, one undo away."],
  ["Tab Hibernation", "Deep sleep for deep focus."],
  ["Duplicate Finder", "One tab instead of seven."],
  ["Tab Preview on Hover", "Peek without committing."],
  ["Pin to Space", "Keep it exactly where it belongs."],
  ["Cross-Device Handoff", "Start here, finish on your phone."],
  ["Tab Sharing Link", "Send a whole tab set as one link."],
];

const collabFeatures: [string, string][] = [
  ["Shared Spaces", "Browse together, in real time."],
  ["Live Co-Browsing", "Same page, same cursor, zero setup."],
  ["Comment on Any Page", "Leave a thought on the web itself."],
  ["Shared Tab Groups", "A tab set your team can open."],
  ["Presence Avatars", "See who is here with you."],
  ["Follow Mode", "Watch a teammate browse, live."],
  ["Shared Notes", "Notes that grow with the group."],
  ["Export Space as Site", "Turn a space into a shareable page."],
];

const devFeatures: [string, string][] = [
  ["DevTools AI", "Explain this console error, in English."],
  ["Responsive Lab", "Every device size, side by side."],
  ["Network Replay", "Replay a request until it behaves."],
  ["CSS Inspector AI", "Ask the stylesheet a question."],
  ["API Tester in Sidebar", "Test endpoints without leaving the tab."],
  ["Console in Command Bar", "Run JS from Cmd+K."],
  ["Lighthouse in 1 Click", "Performance, accessibility, SEO — instantly."],
  ["GitHub PR Preview", "Preview a PR like a live site."],
  ["Localhost Tunnel", "Share localhost with one link."],
  ["Extension Dev Mode", "Build and test extensions inside Agentic."],
];

const a11yFeatures: [string, string][] = [
  ["Voice Navigation", "Say it, Gemini does it."],
  ["Keyboard-Only Mode", "Every action has a key."],
  ["Screen Reader Boost", "Cleaner structure for assistive tech."],
  ["Auto Captions", "Captions for any video, anywhere."],
  ["Shortcuts Builder", "Make your own Cmd-magic."],
  ["Automations", "If this tab, then that action."],
];

function build(cat: string, rows: [string, string][], start: number, badgeFn: (i: number) => string): Feature[] {
  return rows.map((x, i) => ({
    n: start + i,
    title: x[0],
    desc: x[1],
    cat,
    badge: badgeFn(i),
  }));
}

export const FEATURES: Feature[] = [
  ...build("AI", aiFeatures, 1, (i) => (i % 3 === 0 ? "AI" : i % 3 === 1 ? "NEW" : "PRO")),
  ...build("Productivity", prodFeatures, 19, (i) => (i % 3 === 0 ? "NEW" : "PRO")),
  ...build("Privacy", privacyFeatures, 37, (i) => (i % 2 ? "PRO" : "NEW")),
  ...build("Performance", perfFeatures, 51, () => "PRO"),
  ...build("Design", designFeatures, 63, (i) => (i % 3 ? "NEW" : "PRO")),
  ...build("Tabs & Spaces", tabsFeatures, 77, () => "NEW"),
  ...build("Collaboration", collabFeatures, 89, () => "PRO"),
  ...build("Developer", devFeatures, 97, () => "PRO"),
  ...build("Accessibility", a11yFeatures, 107, () => "NEW"),
];

export const CATS = [
  "All",
  "AI",
  "Productivity",
  "Privacy",
  "Performance",
  "Design",
  "Tabs & Spaces",
  "Collaboration",
  "Developer",
  "Accessibility",
];

export type Profile = {
  name: string;
  letter: string;
  color: string;
};

export const PROFILES: Profile[] = [
  { name: "Work — Guest", letter: "G", color: "#4285F4" },
  { name: "Personal", letter: "P", color: "#EA4335" },
  { name: "Incognito", letter: "I", color: "#8A8A8A" },
];

export const SHORTCUTS: [string, string][] = [
  ["Cmd+T", "New Tab"],
  ["Cmd+L", "Focus address bar"],
  ["Cmd+K", "Command Palette"],
  ["Cmd+S", "Save session"],
  ["Alt+Cmd+K", "Clean Up Tabs"],
  ["Cmd+\\", "Split View"],
  ["Cmd+I", "Toggle Gemini AI"],
  ["Cmd+Shift+Z", "Zen Mode"],
  ["Cmd+Shift+N", "New Space"],
  ["Cmd+/", "Shortcuts"],
];

export const AI_SUGGESTIONS = [
  "Summarize this page",
  "Explain like I'm 5",
  "Rewrite for clarity",
  "Make a to-do list",
  "Plan my research",
  "Find the key dates",
];

export const AGENT_TASKS = [
  "Research the top 5 AI browsers and compare them",
  "Plan a 3-day trip to Kyoto with a budget",
  "Summarize this GitHub repo and list open issues",
  "Draft an email asking for a demo of a product",
  "Find the best Postgres MCP server and buy API access",
];

export const INITIAL_TABS: Tab[] = [
  { id: "t1", title: "google/agentic-browser", space: "Work", page: "github", fav: "G", pinned: true, domain: "github.com/google/agentic-browser" },
  { id: "t2", title: "Linear — Launch Board", space: "Work", page: "linear", fav: "L", domain: "linear.app" },
  { id: "t3", title: "Notion — Product Docs", space: "Work", page: "notion", fav: "N", domain: "notion.so" },
  { id: "t4", title: "Money OS", space: "Money", page: "money", fav: "₹", pinned: true, domain: "pay.google/money-os" },
  { id: "t5", title: "Agent Mission", space: "Research", page: "agent", fav: "✦", pinned: true, domain: "agenet://mission" },
  { id: "t6", title: "YouTube — Lo-fi Focus", space: "Personal", page: "youtube", fav: "Y", domain: "youtube.com" },
  { id: "t7", title: "The Hay Wain — Wikipedia", space: "Research", page: "wiki", fav: "W", domain: "en.wikipedia.org" },
  { id: "t8", title: "MDN — CSS Grid", space: "Research", page: "mdn", fav: "M", domain: "developer.mozilla.org" },
  { id: "t9", title: "Agentic Home", space: "Focus", page: "home", fav: "A", domain: "agentic://new-tab" },
];
