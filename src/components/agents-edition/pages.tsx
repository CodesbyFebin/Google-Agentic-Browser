"use client";

import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Link2,
  Lock,
  Pause,
  Play,
  RotateCw,
  Share2,
  Sparkles,
  Star,
} from "lucide-react";
import { useState } from "react";
import { NotesWidget } from "./notes-widget";
import { MoneyPanel } from "./money-panel";
import { AGENTS, MISSION_POS, type MissionPage } from "./browser-data";
import { useMission } from "./mission-store";

export type PageRendererProps = {
  domain: string;
  title: string;
  space: string;
  onToast: (msg: string) => void;
  onOpenAI: () => void;
  onOpenPage: (title: string, page: any, domain: string, fav?: string) => void;
};

// Thin wrapper so the Money page can reuse the right-side MoneyPanel.
function MoneyInline({ onToast }: { onToast: (m: string) => void }) {
  return <MoneyPanel onToast={onToast} />;
}

// Inline mission viewport that plays back the current recorder state.
function MissionViewport() {
  const { events, view, running } = useMission();
  const k = view === null ? events.length : view;
  const cur = k > 0 ? events[k - 1] : null;
  const page: MissionPage = (cur?.page as MissionPage) || "home";
  const pos = MISSION_POS[page] || MISSION_POS.home;
  const agent = cur ? AGENTS[cur.a as keyof typeof AGENTS] : AGENTS.orch;

  return (
    <div
      className="relative overflow-hidden rounded-[24px] flex flex-col min-h-[460px]"
      style={{ background: "rgba(16,19,36,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/5 text-xs">
        <Lock size={12} className="text-emerald-400" />
        <span className="truncate ag-mono">{cur?.url || "agenet://mission-control"}</span>
        <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-white/10">
          {running ? "LIVE" : view === null ? (events.length ? "DONE" : "IDLE") : `REPLAY ${k}/${events.length}`}
        </span>
      </div>
      <div className="relative flex-1 overflow-y-auto p-4">
        <div className="max-w-[680px] mx-auto">
          <div className="ag-glass rounded-2xl p-5">
            <div className="text-xs opacity-60 mb-2">
              {page.toUpperCase()} · mission page
            </div>
            <h2 className="text-xl font-bold">
              {page === "home" && "Mission Control"}
              {page === "search" && "Registry results"}
              {page === "repo" && "pg-mcp-gateway"}
              {page === "pay" && "Checkout · HTTP 402"}
              {page === "done" && "Mission complete"}
              {page === "drive" && "Drive"}
              {page === "docs" && "Docs"}
              {page === "cal" && "Calendar"}
              {page === "mail" && "Compose"}
              {page === "github" && "GitHub"}
            </h2>
            <p className="text-sm opacity-70 mt-2">
              {cur?.msg || "Press Run in the Agents tab to launch a mission."}
            </p>
            {cur?.cost ? (
              <div className="mt-3 ag-glass rounded-xl p-3 text-xs">
                x402 payment: <b>{cur.cost.toFixed(2)} USDC</b>{" "}
                {cur.twin ? "· simulated (Digital Twin)" : "· signed by Bee Buyer"}
              </div>
            ) : null}
          </div>
        </div>
        {cur && (
          <div
            className="absolute text-3xl transition-all duration-700"
            style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
            aria-hidden
          >
            {agent.emoji}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== HOME ===================== */
export function HomePage({
  onToast,
  onOpenAI,
  onOpenPage,
  space,
}: PageRendererProps & { space: string }) {
  return (
    <div className="p-4 sm:p-7 max-w-[1000px] mx-auto">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-[28px] p-5 sm:p-8 ag-aurora"
        style={{
          background:
            "linear-gradient(120deg,#4285F4,#34A853,#FBBC04,#EA4335,#4285F4)",
          color: "#0A0A0A",
        }}
      >
        <div className="ag-grain absolute inset-0 opacity-20" />
        <div className="relative">
          <span className="text-xs font-bold bg-black/15 px-2.5 py-1 rounded-full">
            AGENTIC HOME - GOOD MORNING
          </span>
          <h1 className="text-[clamp(30px,6vw,58px)] leading-[0.95] font-bold mt-4">
            The browser
            <br />
            that does.
          </h1>
          <p className="mt-3 max-w-[540px] font-medium text-black/75">
            Google Agentic Browser blends Gemini AI, agentic tabs, spaces and
            112 additions into one calm, futuristic window. Touch grass. But
            faster.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={onOpenAI}
              className="bg-white/90 rounded-full px-4 py-3 text-sm text-black font-bold flex items-center gap-2 hover:bg-white"
            >
              <Sparkles size={15} /> Ask Gemini to plan my day
            </button>
            <button
              onClick={() =>
                onOpenPage("Gemini - New chat", "gemini", "gemini.google.com", "S")
              }
              className="bg-black text-white rounded-full px-4 py-3 text-sm font-bold flex items-center gap-2"
            >
              <Play size={14} /> Open Gemini
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {[
          ["Focus streak", "12 days"],
          ["Tabs napped", "12 sleeping"],
          ["Trackers blocked", "184 today"],
          ["Time saved", "38 min"],
        ].map((x) => (
          <div key={x[0]} className="ag-glass p-4 rounded-2xl">
            <div className="text-2xl font-bold">{x[1]}</div>
            <div className="text-xs opacity-60 mt-1">{x[0]}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <NotesWidget space={space} onToast={onToast} />
        <div className="ag-glass rounded-[22px] p-4">
          <b>Quick actions</b>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              ["Split to 4", "Split the window"],
              ["Clean Up", "Nap inactive tabs"],
              ["Focus Timer", "25 minutes"],
              ["Copy as Markdown", "Clean link"],
            ].map((x) => (
              <button
                key={x[0]}
                onClick={() => onOpenPage(x[0], "home", "agentic://new-tab")}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left transition"
              >
                <b className="text-sm block">{x[0]}</b>
                <span className="text-xs opacity-50">{x[1]}</span>
              </button>
            ))}
          </div>
          <b className="block mt-4">Recent sites</b>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              ["github.com", "github", "G"],
              ["figma.com", "figma", "F"],
              ["notion.so", "notion", "N"],
              ["youtube.com", "youtube", "Y"],
              ["wikipedia.org", "wiki", "W"],
              ["gemini.google.com", "gemini", "S"],
            ].map((d) => (
              <button
                key={d[0]}
                onClick={() => onOpenPage(d[0], d[1], d[0], d[2])}
                className="text-xs px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                {d[0]}
              </button>
            ))}
          </div>
          <b className="block mt-4">Agentic tips</b>
          <div className="space-y-1.5 mt-2 text-xs">
            {[
              "Press Cmd+K and type 'split to 4' - instant quad view.",
              "Say 'Hey Gemini, summarize this' on any tab.",
              "Right-click a tab to nap it and free RAM.",
              "Pin your top 4 spaces for one-tap context switching.",
            ].map((t) => (
              <div
                key={t}
                className="bg-white/5 p-2 rounded-lg flex items-start gap-2"
              >
                <Check size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                <span className="opacity-85">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== GITHUB ===================== */
export function GitHubPage({ onToast }: PageRendererProps) {
  return (
    <div className="p-4 sm:p-8 max-w-[940px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-9 h-9 rounded-xl grid place-items-center text-lg font-bold"
              style={{ background: "#8B949E22", color: "#c9d1d9" }}
            >
              G
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold">
              google /{" "}
              <span style={{ color: "var(--ag-accent)" }}>agentic-browser</span>
            </h1>
            <span className="text-xs border rounded-full px-2 py-1">Public</span>
          </div>
          <p className="opacity-65 mt-2 max-w-[620px]">
            The browser that does. Gemini AI in the sidebar, agentic tabs,
            spaces, 112 additions. Free and open-source concept.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onToast("Starred agentic-browser — thank you!")}
            className="ag-glass px-3 py-2 rounded-full text-sm flex gap-1 items-center"
          >
            <Star size={15} /> Star <b>2,184</b>
          </button>
          <button
            onClick={() => onToast("Fork created in this concept")}
            className="ag-glass px-3 py-2 rounded-full text-sm"
          >
            Fork 312
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-3 mt-5">
        {[
          ["Apache-2.0", "License"],
          ["MIT", "Also licensed"],
          ["TypeScript", "98.4%"],
          ["Chromium", "Engine"],
        ].map((x) => (
          <div key={x[0]} className="ag-glass p-3 rounded-2xl">
            <div className="font-bold">{x[0]}</div>
            <div className="text-xs opacity-55">{x[1]}</div>
          </div>
        ))}
      </div>

      <div className="ag-glass rounded-2xl mt-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex justify-between">
          <b>Files</b>
          <span className="text-xs opacity-55">main branch</span>
        </div>
        {[
          ["src/", "Browser UI + spaces + Gemini panel"],
          ["browser/", "Chromium integration + agentic runtime"],
          ["extensions/", "Extension host with sleep"],
          ["agent/", "LLM task planner + executor"],
          ["README.md", "Start here"],
          ["LICENSE", "Apache-2.0 / MIT"],
        ].map((f) => (
          <button
            key={f[0]}
            onClick={() => onToast(`Opened ${f[0]}`)}
            className="w-full text-left px-4 py-3 flex justify-between hover:bg-white/5 border-b border-white/5"
          >
            <span className="ag-mono">{f[0]}</span>
            <span className="text-sm opacity-55 hidden sm:block">{f[1]}</span>
          </button>
        ))}
      </div>

      <div className="ag-glass rounded-2xl p-4 mt-4">
        <b>README.md</b>
        <div className="mt-3 text-sm leading-6 opacity-85 space-y-2">
          <p>
            <b>Google Agentic Browser</b> is a concept for the browser in 2027.
            It blends Gemini AI, agentic tabs, calm spaces and 112 additions
            into one breathing window.
          </p>
          <p>
            <b>Why?</b> The web got louder. Tabs became a pile. Agentic Browser
            makes tabs feel like a workspace — and lets Gemini actually do
            things for you, not just answer questions.
          </p>
          <pre className="ag-mono bg-black/40 p-3 rounded-xl text-xs overflow-x-auto">
            {`bun install
bun run dev    # starts on :3000`}
          </pre>
        </div>
      </div>
    </div>
  );
}

/* ===================== YOUTUBE ===================== */
export function YouTubePage({ onToast }: PageRendererProps) {
  const [playing, setPlaying] = useState(true);
  const videos = [
    ["Lo-fi for deep work", "Agentic Radio - 2.1M views", "linear-gradient(135deg,#FF6B9D,#7B61FF)"],
    ["Build a browser in 2027", "Agentic Lab - 184K views", "linear-gradient(135deg,#4285F4,#00D4FF)"],
    ["Touch grass. But faster.", "Agentic Films - 92K views", "linear-gradient(135deg,#34A853,#FBBC04)"],
    ["The calm web", "Design Daily - 41K views", "linear-gradient(135deg,#EA4335,#FFAA00)"],
    ["Spaces that think", "Product Club - 67K views", "linear-gradient(135deg,#7B61FF,#5092C7)"],
    ["Why tabs nap", "Perf Talks - 28K views", "linear-gradient(135deg,#5092C7,#E1E1FE)"],
  ];
  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Watch next</h2>
        <span className="text-xs bg-red-500 px-2 py-1 rounded-full">
          LIVE PREVIEW
        </span>
      </div>
      {/* Hero player */}
      <div
        className="mt-4 h-[200px] sm:h-[260px] rounded-2xl relative grid place-items-center overflow-hidden"
        style={{ background: videos[0][2] }}
      >
        <button
          onClick={() => setPlaying((p) => !p)}
          className="w-14 h-14 rounded-full bg-black/55 grid place-items-center text-white"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <span className="absolute bottom-2 right-2 bg-black/70 text-xs px-2 py-1 rounded">
          12:42
        </span>
        <span className="absolute top-2 left-2 text-xs bg-black/60 px-2 py-1 rounded-full">
          NOW PLAYING - Lo-fi for deep work
        </span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {videos.slice(1).map((v, i) => (
          <button
            key={i}
            onClick={() => onToast("Playing in picture-in-picture")}
            className="text-left group"
          >
            <div
              className="h-32 rounded-2xl relative overflow-hidden"
              style={{ background: v[2] }}
            >
              <span className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-black/50 grid place-items-center text-lg">
                Play
              </span>
              <span className="absolute bottom-2 right-2 bg-black/70 text-xs px-2 py-1 rounded">
                08:14
              </span>
            </div>
            <b className="block mt-2 leading-snug text-sm">{v[0]}</b>
            <span className="text-xs opacity-55">{v[1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===================== WIKIPEDIA ===================== */
export function WikiPage({ onToast }: PageRendererProps) {
  return (
    <article className="p-4 sm:p-8 max-w-[880px] mx-auto">
      <div className="flex flex-wrap gap-2 text-[12px]">
        <span className="px-2 py-1 rounded-full bg-white/10">Article</span>
        <span className="px-2 py-1 rounded-full bg-white/10">Featured</span>
        <span className="px-2 py-1 rounded-full bg-white/10">1821 painting</span>
      </div>
      <h1 className="text-[clamp(28px,5vw,52px)] leading-none font-bold mt-4">
        The Hay Wain
      </h1>
      <p className="opacity-65 mt-2">
        A landscape in Suffolk, a cart crossing a river - and a study in light
        that still feels modern.
      </p>
      <div className="grid md:grid-cols-[1fr_240px] gap-5 mt-6">
        <div>
          <div
            className="h-[240px] rounded-[22px] overflow-hidden relative"
            style={{
              background:
                "linear-gradient(135deg,#7FB069,#E9D8A6,#4A7C59)",
            }}
          >
            <div className="absolute bottom-4 left-4 text-white font-bold">
              Constable Country - 1821
            </div>
            <div className="absolute top-4 right-4 bg-white/90 text-black text-xs px-2 py-1 rounded-full">
              Simulated artwork
            </div>
          </div>
          <p className="mt-4 leading-7 text-[15px] opacity-85">
            John Constable painted the Hay Wain as part of a series of
            six-footers - large canvases made to be noticed. A horse-drawn cart
            pauses in the River Stour while clouds gather above Dedham Vale. The
            scene looks quiet, but every brushstroke is a decision about
            weather, labor and home.
          </p>
          <h3 className="font-bold text-xl mt-6">Why it matters</h3>
          <ul className="list-disc ml-5 mt-2 space-y-2 opacity-80">
            <li>
              It made English landscape painting feel ambitious, not decorative.
            </li>
            <li>
              Constable studied clouds like a scientist - and painted them like
              a poet.
            </li>
            <li>The National Gallery has kept it in London since 1888.</li>
          </ul>
        </div>
        <aside className="ag-glass rounded-2xl p-4 h-fit">
          <b>The Hay Wain</b>
          <div
            className="h-28 rounded-xl mt-3"
            style={{
              background: "linear-gradient(135deg,#A8DADC,#F4A261)",
            }}
          />
          <dl className="text-sm mt-3 space-y-2 opacity-75">
            <div>
              <dt className="opacity-50">Artist</dt>
              <dd>John Constable</dd>
            </div>
            <div>
              <dt className="opacity-50">Year</dt>
              <dd>1821</dd>
            </div>
            <div>
              <dt className="opacity-50">Medium</dt>
              <dd>Oil on canvas</dd>
            </div>
            <div>
              <dt className="opacity-50">Location</dt>
              <dd>National Gallery, London</dd>
            </div>
          </dl>
        </aside>
      </div>
    </article>
  );
}

/* ===================== MDN ===================== */
export function MDNPage({ onToast }: PageRendererProps) {
  return (
    <div className="p-4 sm:p-8 max-w-[880px] mx-auto">
      <div className="ag-mono text-xs opacity-60">
        MDN WEB DOCS / CSS / GRID
      </div>
      <h1 className="text-[clamp(28px,5vw,48px)] font-bold mt-2">
        CSS Grid Layout
      </h1>
      <p className="mt-3 opacity-80 leading-7">
        Grid gives you rows and columns at the same time. It is the layout
        system behind Agentic Browser&apos;s split view - one container, many
        panes, no fragile floats.
      </p>
      <div className="ag-glass rounded-2xl p-4 mt-5">
        <div className="ag-mono text-xs text-emerald-300">
          {`.split { display: grid; grid-template-columns: 1fr 1fr; }`}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl flex items-center justify-center font-bold"
              style={{
                background: i % 2 ? "var(--ag-accent)" : "var(--ag-accent2)",
              }}
            >
              Pane {i}
            </div>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        {["Explicit grid", "Auto placement", "Alignment"].map((x) => (
          <div key={x} className="ag-glass p-4 rounded-2xl">
            <b>{x}</b>
            <p className="text-sm opacity-60 mt-1">
              A practical pattern you can use today.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== NOTION ===================== */
export function NotionPage({ onToast }: PageRendererProps) {
  return (
    <div className="p-4 sm:p-8 max-w-[820px] mx-auto">
      <div
        className="w-12 h-12 rounded-2xl grid place-items-center text-white font-bold text-xl"
        style={{ background: "var(--ag-accent)" }}
      >
        A
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold mt-3">Product Docs</h1>
      <p className="opacity-60 mt-2">
        Everything the team needs, one search away.
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mt-6">
        {[
          ["Vision", "A browser that feels like a studio."],
          ["Roadmap", "112 additions, shipped in waves."],
          ["Principles", "Calm first, speed always."],
          ["Research", "What 2,400 people asked for."],
        ].map((x) => (
          <button
            key={x[0]}
            onClick={() => onToast(`Opened ${x[0]}`)}
            className="ag-glass p-4 rounded-2xl text-left hover:border-white/30"
          >
            <b>{x[0]}</b>
            <p className="text-sm opacity-55 mt-1">{x[1]}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===================== LINEAR / FIGMA ===================== */
export function LinearPage({ onToast }: PageRendererProps) {
  return <BoardPage onToast={onToast} kind="linear" />;
}

export function FigmaPage({ onToast }: PageRendererProps) {
  return <BoardPage onToast={onToast} kind="figma" />;
}

export function BoardPage({
  onToast,
  kind,
}: {
  onToast: (m: string) => void;
  kind: "linear" | "figma";
}) {
  const isFigma = kind === "figma";
  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold">
        {isFigma ? "Figma - Agentic Design System" : "Linear - Launch Board"}
      </h2>
      <p className="opacity-55 text-sm">
        Drag is simulated - click a card to see it react.
      </p>
      <div className="grid md:grid-cols-3 gap-4 mt-5">
        {[
          ["Backlog", "Refine split view", "Agentic tokens", 3],
          ["In Progress", "Breathing light polish", "PiP drag", 2],
          ["Done", "Sidebar glass", "Cmd+K palette", 2],
        ].map((c, i) => (
          <div key={i} className="ag-glass rounded-2xl p-3">
            <div className="flex justify-between">
              <b>{c[0]}</b>
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                {c[3]}
              </span>
            </div>
            <div className="space-y-2 mt-3">
              {[c[1], c[2]].map((x) => (
                <button
                  key={x}
                  onClick={() => onToast(`Opened card: ${x}`)}
                  className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-xl text-sm"
                >
                  {x}
                  <div className="text-xs opacity-45 mt-1">
                    Gemini - Due today
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="ag-glass rounded-2xl p-4 mt-4 flex flex-wrap justify-between gap-3">
        <div>
          <b>Team velocity</b>
          <div className="text-sm opacity-50">Sprint 24 - 82% complete</div>
        </div>
        <div className="flex gap-1 items-end h-10">
          {[30, 55, 42, 70, 58, 88, 76].map((h, i) => (
            <div
              key={i}
              className="w-6 rounded-t"
              style={{ height: h + "%", background: "var(--ag-accent)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===================== NEWS ===================== */
export function NewsPage({ onToast }: PageRendererProps) {
  return (
    <div className="p-4 sm:p-6 max-w-[900px] mx-auto">
      <h2 className="text-2xl font-bold">Hacker News - Today</h2>
      <div className="space-y-2 mt-5">
        {[
          ["Agentic Browser imagines the browser in 2027", "412 points - 189 comments"],
          ["Tab napping is the new tab hoarding", "298 points - 96 comments"],
          ["The calm web wins", "187 points - 74 comments"],
          ["Show HN: A browser that breathes", "342 points - 141 comments"],
          ["Gemini in the sidebar, finally useful", "266 points - 88 comments"],
        ].map((n, i) => (
          <button
            key={i}
            onClick={() => onToast("Opened story in this concept")}
            className="w-full ag-glass p-4 rounded-2xl text-left flex gap-3 items-start"
          >
            <span className="font-bold opacity-40">{i + 1}.</span>
            <span>
              <b className="block">{n[0]}</b>
              <span className="text-xs opacity-50">{n[1]}</span>
            </span>
            <ArrowRight className="ml-auto shrink-0" size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===================== GEMINI (in-tab) ===================== */
export function GeminiPage({ onToast }: PageRendererProps) {
  return (
    <div className="p-4 sm:p-8 max-w-[760px] mx-auto">
      <div
        className="rounded-[28px] p-6 text-white ag-aurora"
        style={{
          background:
            "linear-gradient(120deg,#4285F4,#34A853,#FBBC04,#EA4335,#4285F4)",
        }}
      >
        <div className="flex items-center gap-3">
          <Sparkles size={26} />
          <div>
            <b className="text-xl">Gemini</b>
            <p className="text-sm opacity-80">
              Open the right panel for the full chat. Here is a quick start.
            </p>
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {[
          ["Summarize any tab", "One-line summary, on-device."],
          ["Plan a research session", "Gemini breaks it into steps."],
          ["Draft an email", "Warm, short, professional."],
          ["Compare two products", "Side-by-side, evidence-backed."],
        ].map((x) => (
          <button
            key={x[0]}
            onClick={() => onToast(`${x[0]} - opening Gemini chat`)}
            className="ag-glass p-4 rounded-2xl text-left hover:border-white/30"
          >
            <b className="block">{x[0]}</b>
            <span className="text-sm opacity-60">{x[1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===================== Money OS page ===================== */
export function MoneyPage({ onToast }: PageRendererProps) {
  return (
    <div className="p-4 sm:p-6 max-w-[1000px] mx-auto">
      <div className="ag-glass rounded-[24px] p-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">💰</span>
          <h1 className="text-2xl font-bold">Money OS</h1>
        </div>
        <p className="text-sm opacity-60">
          Guarded payments, agent approvals, and a sandbox wallet. Open the Money tab
          on the right to drive the queue.
        </p>
      </div>
      <MoneyInline onToast={onToast} />
    </div>
  );
}

/* ===================== Agent mission page ===================== */
export function AgentMissionPage({ onToast }: PageRendererProps) {
  return (
    <div className="p-4 sm:p-6 max-w-[1000px] mx-auto">
      <MissionViewport />
      <div className="mt-4 ag-glass rounded-[22px] p-4">
        <b className="text-sm">Agent mission</b>
        <p className="text-xs opacity-60 mt-1">
          The Mission tab on the right launches Nova Prime. Six agents browse, rank,
          pay and write — and pause at every human checkpoint (x402 payment and Google
          OAuth consent). The recorder logs each step; drag the scrubber to replay.
        </p>
        <button
          onClick={() => onToast("Open the Agents tab on the right to launch a mission")}
          className="mt-3 px-4 py-2 rounded-full text-white text-sm font-bold"
          style={{ background: "var(--ag-accent)" }}
        >
          Open Agents tab →
        </button>
      </div>
    </div>
  );
}

/* ===================== Address bar (shared) ===================== */
export function AddressBar({
  domain,
  paneIndex,
  totalPanes,
  onToast,
}: {
  domain: string;
  paneIndex?: number;
  totalPanes?: number;
  onToast: (m: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/5">
      <button onClick={() => onToast("Back in this concept")} aria-label="Back">
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => onToast("Forward in this concept")}
        aria-label="Forward"
      >
        <ChevronRight size={16} />
      </button>
      <button onClick={() => onToast("Page reloaded")} aria-label="Reload">
        <RotateCw size={14} />
      </button>
      <div className="flex-1 min-w-0 flex items-center gap-1.5 bg-black/30 rounded-full px-3 py-1.5 text-xs truncate">
        <Lock size={12} className="shrink-0 text-emerald-400" />
        <span className="truncate">{domain}</span>
      </div>
      {typeof paneIndex === "number" && totalPanes && totalPanes > 1 && (
        <span className="text-[10px] px-2 py-1 rounded-full bg-white/10">
          Pane {paneIndex + 1}/{totalPanes}
        </span>
      )}
      <button
        onClick={() => onToast("Link cleaned - tracking removed")}
        aria-label="Clean link"
      >
        <Link2 size={14} />
      </button>
      <button onClick={() => onToast("Bookmarked")} aria-label="Bookmark">
        <Bookmark size={14} />
      </button>
      <button onClick={() => onToast("Share link copied")} aria-label="Share">
        <Share2 size={14} />
      </button>
    </div>
  );
}
