// Google Agentic Browser — static data, themes, features, spaces, pinned sites.

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
  | "gemini";

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
  { name: "Personal", accent: "#EA4335", icon: "P", desc: "Life, music & play" },
  { name: "Research", accent: "#34A853", icon: "R", desc: "Deep reading" },
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
  { name: "Gemini", icon: "S", color: "#4285F4", page: "gemini", domain: "gemini.google.com" },
];

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
];

export const INITIAL_TABS: Tab[] = [
  { id: "t1", title: "google/agentic-browser", space: "Work", page: "github", fav: "G", pinned: true, domain: "github.com/google/agentic-browser" },
  { id: "t2", title: "Linear — Launch Board", space: "Work", page: "linear", fav: "L", domain: "linear.app" },
  { id: "t3", title: "Notion — Product Docs", space: "Work", page: "notion", fav: "N", domain: "notion.so" },
  { id: "t4", title: "YouTube — Lo-fi Focus", space: "Personal", page: "youtube", fav: "Y", domain: "youtube.com" },
  { id: "t5", title: "The Hay Wain — Wikipedia", space: "Research", page: "wiki", fav: "W", domain: "en.wikipedia.org" },
  { id: "t6", title: "MDN — CSS Grid", space: "Research", page: "mdn", fav: "M", domain: "developer.mozilla.org" },
  { id: "t7", title: "Hacker News", space: "Research", page: "news", fav: "H", domain: "news.ycombinator.com" },
  { id: "t8", title: "Agentic Home", space: "Focus", page: "home", fav: "A", domain: "agentic://new-tab" },
];
