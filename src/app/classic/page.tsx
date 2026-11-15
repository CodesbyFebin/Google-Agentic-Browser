"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Columns2,
  Grid3x3,
  LayoutGrid,
  Pause,
  Play,
  Plus,
  Square,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  INITIAL_TABS,
  SPACES,
  THEMES,
  type PageKind,
  type Tab,
} from "@/components/browser/browser-data";
import { Sidebar } from "@/components/browser/sidebar";
import { TopBar } from "@/components/browser/top-bar";
import { RightPanel, type RightTab } from "@/components/browser/right-panel";
import {
  CommandPalette,
  ShortcutsModal,
} from "@/components/browser/command-palette";
import {
  AddressBar,
  FigmaPage,
  GeminiPage,
  GitHubPage,
  HomePage,
  LinearPage,
  MDNPage,
  NewsPage,
  NotionPage,
  WikiPage,
  YouTubePage,
  type PageRendererProps,
} from "@/components/browser/pages";
import type { SettingsState } from "@/components/browser/settings-panel";

const DEFAULT_SETTINGS: SettingsState = {
  adblock: true,
  trackers: true,
  autonap: true,
  breathing: true,
  zen: false,
  sound: false,
  sync: true,
};

export default function Home() {
  const [dark, setDark] = useState(true);
  const [themeName, setThemeName] = useState("Agentic Blue");
  const theme = THEMES[themeName];

  const [sidebar, setSidebar] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [rightTab, setRightTab] = useState<RightTab>("features");
  const [split, setSplit] = useState<1 | 2 | 3 | 4>(1);
  const [space, setSpace] = useState("Work");
  const [search, setSearch] = useState("");
  const [palette, setPalette] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [zen, setZen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [pip, setPip] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [profile, setProfile] = useState("Work — Guest");
  const [blocked, setBlocked] = useState(184);
  const [cpu, setCpu] = useState(0.4);
  const [ram, setRam] = useState(312);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [tabs, setTabs] = useState<Tab[]>(INITIAL_TABS);
  const [activeId, setActiveId] = useState("t1");
  const [cleaned, setCleaned] = useState<Tab[]>([]);

  const onToast = useCallback((msg: string) => toast.success(msg), []);

  // Theme variables injected onto the root wrapper
  const themeVars = useMemo(
    () =>
      ({
        "--ag-accent": theme.accent,
        "--ag-accent2": theme.accent2,
        "--ag-bg": dark ? theme.bg : "#F2F3F8",
        "--ag-card": dark ? theme.card : "#FFFFFF",
        "--ag-glow": theme.glow,
        "--ag-muted": dark ? theme.muted : "#66708A",
        "--ag-text": dark ? "#F4F5FF" : "#11182E",
      }) as React.CSSProperties,
    [theme, dark]
  );

  // Live stat ticker
  useEffect(() => {
    const i = setInterval(() => {
      if (settings.trackers) setBlocked((b) => b + Math.floor(Math.random() * 3));
      setCpu(0.3 + Math.random() * 0.6);
      setRam(298 + Math.floor(Math.random() * 35));
    }, 4000);
    return () => clearInterval(i);
  }, [settings.trackers]);

  const cycleSplit = () => {
    setSplit((s) => (s === 1 ? 2 : s === 2 ? 3 : s === 3 ? 4 : 1));
    onToast("Split view cycled");
  };

  const toggleZen = () => {
    setZen((v) => {
      const next = !v;
      setSettings((s) => ({ ...s, zen: next }));
      onToast(next ? "Zen mode on - only the page remains" : "Zen mode off");
      return next;
    });
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      } else if (meta && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setRightOpen(true);
        setRightTab("ai");
        onToast("Gemini opened");
      } else if (meta && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        toggleZen();
      } else if (meta && e.key === "\\") {
        e.preventDefault();
        cycleSplit();
      } else if (meta && e.key === "/") {
        e.preventDefault();
        setShortcuts(true);
      } else if (e.key === "Escape") {
        setPalette(false);
        setShortcuts(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onToast]);

  const spaceTabs = useMemo(() => tabs.filter((t) => t.space === space), [tabs, space]);
  const active = tabs.find((t) => t.id === activeId) || tabs[0];

  // Pane tabs for split view
  const paneTabs = useMemo(() => {
    const idx = Math.max(0, spaceTabs.findIndex((t) => t.id === activeId));
    const arr: Tab[] = [];
    for (let i = 0; i < split; i++) {
      arr.push(spaceTabs[(idx + i) % Math.max(1, spaceTabs.length)] || active);
    }
    return arr;
  }, [split, spaceTabs, activeId, active]);

  const switchSpace = (s: string) => {
    setSpace(s);
    const first = tabs.find((t) => t.space === s);
    if (first) setActiveId(first.id);
    onToast(`Space switched to ${s}`);
  };

  const openPage = useCallback(
    (title: string, page: PageKind, domain: string, fav: string = "A") => {
      const id = "t" + Date.now();
      setTabs((t) => [...t, { id, title, space, page, fav, domain }]);
      setActiveId(id);
      setRightTab("ai");
      onToast(`Opened ${title}`);
    },
    [space, onToast]
  );

  const toggleMute = (id: string) => {
    setTabs((x) =>
      x.map((y) => (y.id === id ? { ...y, muted: !y.muted } : y))
    );
    const t = tabs.find((x) => x.id === id);
    onToast(t?.muted ? "Tab unmuted" : "Tab muted");
  };
  const togglePin = (id: string) => {
    setTabs((x) =>
      x.map((y) => (y.id === id ? { ...y, pinned: !y.pinned } : y))
    );
    const t = tabs.find((x) => x.id === id);
    onToast(t?.pinned ? "Unpinned" : "Pinned to space");
  };
  const closeTab = (id: string) => {
    setTabs((x) => x.filter((y) => y.id !== id));
    if (id === activeId) {
      const next = tabs.find((t) => t.id !== id);
      if (next) setActiveId(next.id);
    }
    onToast("Tab closed");
  };

  const cleanUp = () => {
    const keep = tabs.filter((t) => t.pinned || t.id === activeId || t.space !== space);
    const moved = tabs.filter((t) => !t.pinned && t.id !== activeId && t.space === space);
    setCleaned((c) => [...moved, ...c]);
    setTabs(keep);
    onToast(`Cleaned up ${moved.length} tabs - moved to Recently Cleaned`);
  };
  const restoreCleaned = () => {
    if (!cleaned.length) {
      onToast("Recently Cleaned is empty");
      return;
    }
    setTabs((t) => [...t, ...cleaned]);
    setCleaned([]);
    onToast("Restored cleaned tabs");
  };

  const handlePaletteAction = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("new tab")) openPage("Agentic Home", "home", "agentic://new-tab", "A");
    else if (l.includes("split")) {
      if (l.includes("4")) setSplit(4);
      else cycleSplit();
    } else if (l.includes("gemini") || l.includes("ai")) {
      setRightOpen(true);
      setRightTab("ai");
    } else if (l.includes("clean")) cleanUp();
    else if (l.includes("space")) onToast("New space created (concept)");
    else if (l.includes("theme")) {
      setDark((d) => !d);
      onToast("Theme toggled");
    } else if (l.includes("shortcut")) setShortcuts(true);
    else if (l.includes("zen")) toggleZen();
    else if (l.includes("focus")) {
      setFocusMode((v) => !v);
      onToast("Focus mode toggled");
    } else onToast(`Opened: ${label}`);
  };

  const renderPage = (tab: Tab) => {
    const props: PageRendererProps = {
      domain: tab.domain,
      title: tab.title,
      space: tab.space,
      onToast,
      onOpenAI: () => {
        setRightOpen(true);
        setRightTab("ai");
      },
      onOpenPage: openPage,
    };
    switch (tab.page) {
      case "home":
        return <HomePage {...props} space={space} />;
      case "github":
        return <GitHubPage {...props} />;
      case "youtube":
        return <YouTubePage {...props} />;
      case "wiki":
        return <WikiPage {...props} />;
      case "mdn":
        return <MDNPage {...props} />;
      case "notion":
        return <NotionPage {...props} />;
      case "linear":
        return <LinearPage {...props} />;
      case "figma":
        return <FigmaPage {...props} />;
      case "news":
        return <NewsPage {...props} />;
      case "gemini":
        return <GeminiPage {...props} />;
      default:
        return <HomePage {...props} space={space} />;
    }
  };

  return (
    <div
      data-safe-area-inset-root
      style={{
        boxSizing: "border-box",
        minHeight: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        background: dark ? theme.bg : "#F2F3F8",
        color: dark ? "#F4F5FF" : "#11182E",
        ...themeVars,
      }}
      className="overflow-x-clip relative min-h-screen flex flex-col"
    >
      {/* Breathing backdrop */}
      {settings.breathing && !zen && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <div
            className="ag-breathe absolute -top-[180px] left-[8%] w-[520px] h-[520px] rounded-full blur-[110px] opacity-50"
            style={{
              background:
                "conic-gradient(from 0deg,#4285F4,#34A853,#FBBC04,#EA4335,#4285F4)",
            }}
          />
          <div
            className="ag-breathe absolute bottom-[-140px] right-[2%] w-[420px] h-[420px] rounded-full blur-[100px] opacity-30"
            style={{
              background: "linear-gradient(120deg,#EA4335,#4285F4,#FBBC04)",
            }}
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
        {/* TOP BAR */}
        {!zen && (
          <TopBar
            onToggleSidebar={() => {
              setSidebar((v) => !v);
              onToast(sidebar ? "Sidebar hidden" : "Sidebar shown");
            }}
            onSplit={cycleSplit}
            onOpenAI={() => {
              setRightOpen(true);
              setRightTab("ai");
              onToast("Gemini opened");
            }}
            onToggleFocus={() => {
              setFocusMode((v) => !v);
              onToast(focusMode ? "Focus mode off" : "Focus mode on - distractions dimmed");
            }}
            onToggleZen={toggleZen}
            onOpenSettings={() => {
              setRightOpen(true);
              setRightTab("settings");
              onToast("Settings opened");
            }}
            onOpenFeatures={() => {
              setRightOpen(true);
              setRightTab("features");
              onToast("112 additions - explore them all");
            }}
            focusMode={focusMode}
            zen={zen}
            split={split}
          />
        )}

        {/* MAIN ROW */}
        <div className="flex flex-1 min-h-0">
          {!zen && sidebar && (
            <Sidebar
              space={space}
              search={search}
              setSearch={setSearch}
              tabs={tabs}
              activeId={activeId}
              setActiveId={setActiveId}
              switchSpace={switchSpace}
              openPage={openPage}
              toggleMute={toggleMute}
              togglePin={togglePin}
              closeTab={closeTab}
              cleanUp={cleanUp}
              restoreCleaned={restoreCleaned}
              cleanedCount={cleaned.length}
              onOpenPalette={() => setPalette(true)}
              profile={profile}
              setProfile={setProfile}
              cpu={cpu}
              ram={ram}
              blocked={blocked}
              onToast={onToast}
            />
          )}

          {/* MAIN */}
          <main className="flex-1 min-w-0 flex flex-col min-h-[620px]">
            {/* Tab strip */}
            {!zen && (
              <div className="px-3 sm:px-4 pt-3 flex flex-wrap items-center gap-2">
                <div className="flex gap-1 overflow-x-auto ag-no-scrollbar max-w-full">
                  {spaceTabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveId(t.id)}
                      className="ag-tab-chip shrink-0 flex items-center gap-2 px-3 py-2 rounded-full text-[13px] border"
                      style={{
                        background:
                          t.id === activeId ? "var(--ag-accent)" : "rgba(255,255,255,0.05)",
                        borderColor:
                          t.id === activeId ? "var(--ag-accent)" : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <span className="text-[11px] font-bold opacity-80">{t.fav}</span>
                      <span className="max-w-[130px] truncate">{t.title}</span>
                      {t.id === activeId && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(t.id);
                          }}
                          className="cursor-pointer"
                          role="button"
                          aria-label="Close tab"
                        >
                          <X size={13} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => openPage("Agentic Home", "home", "agentic://new-tab", "A")}
                  className="w-8 h-8 rounded-full ag-glass grid place-items-center shrink-0 hover:border-white/30"
                  aria-label="New tab"
                >
                  <Plus size={16} />
                </button>
                <div className="ml-auto flex items-center gap-1 bg-white/5 rounded-full p-1 shrink-0">
                  {([1, 2, 3, 4] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setSplit(n);
                        onToast(n === 1 ? "Single pane" : `${n} panes - split view`);
                      }}
                      className="px-2.5 py-1.5 rounded-full text-xs flex gap-1 items-center transition"
                      style={{
                        background: split === n ? "white" : "transparent",
                        color: split === n ? "black" : "inherit",
                      }}
                      aria-label={`${n} pane${n > 1 ? "s" : ""}`}
                    >
                      {n === 1 ? (
                        <Square size={13} />
                      ) : n === 2 ? (
                        <Columns2 size={13} />
                      ) : n === 3 ? (
                        <LayoutGrid size={13} />
                      ) : (
                        <Grid3x3 size={13} />
                      )}
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile space switcher */}
            {!zen && (
              <div className="md:hidden px-3 pt-2 flex gap-1 overflow-x-auto ag-no-scrollbar">
                {SPACES.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => switchSpace(s.name)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs border"
                    style={{ background: space === s.name ? s.accent : "transparent", borderColor: space === s.name ? s.accent : "rgba(255,255,255,0.12)" }}
                  >
                    {s.icon} {s.name}
                  </button>
                ))}
              </div>
            )}

            {/* Viewport */}
            <div className="flex-1 p-3 sm:p-4 min-h-0">
              <div
                className={`h-full grid gap-3 ${
                  split === 1
                    ? "grid-cols-1"
                    : split === 2
                    ? "grid-cols-1 lg:grid-cols-2"
                    : split === 3
                    ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {paneTabs.map((tab, i) => (
                  <section
                    key={tab.id + "-" + i}
                    className="rounded-[24px] overflow-hidden flex flex-col min-h-[520px] ag-slide-up"
                    style={{
                      background: dark ? "rgba(16,19,36,0.88)" : "white",
                      border: "1px solid rgba(255,255,255,0.12)",
                      boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
                    }}
                  >
                    {!zen && (
                      <AddressBar
                        domain={tab.domain}
                        paneIndex={i}
                        totalPanes={split}
                        onToast={onToast}
                      />
                    )}
                    <div
                      className={`flex-1 overflow-y-auto ${
                        focusMode && i > 0 ? "opacity-35 blur-[1px]" : ""
                      }`}
                    >
                      {renderPage(tab)}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            {/* Footer (sticky bottom) */}
            {!zen && (
              <footer className="mt-auto px-3 sm:px-4 py-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] opacity-55 justify-between border-t border-white/10">
                <span>
                  Google Agentic Browser - concept prototype. Gemini AI via
                  z-ai-web-dev-sdk. Not the Chromium engine.
                </span>
                <span className="ag-mono">
                  Naps: 12 sleeping - {cpu.toFixed(1)}% CPU - {ram} MB -{" "}
                  {blocked} trackers blocked - uBlock ON - Sync E2EE
                </span>
              </footer>
            )}
          </main>

          {/* RIGHT PANEL */}
          {!zen && rightOpen && (
            <RightPanel
              rightTab={rightTab}
              setRightTab={setRightTab}
              onClose={() => setRightOpen(false)}
              onToast={onToast}
              activeTabTitle={active?.title || ""}
              activeTabDomain={active?.domain || ""}
              space={space}
              settings={settings}
              setSettings={setSettings}
              themeName={themeName}
              setThemeName={setThemeName}
              dark={dark}
              setDark={setDark}
              onOpenShortcuts={() => setShortcuts(true)}
            />
          )}
          {!rightOpen && !zen && (
            <button
              onClick={() => setRightOpen(true)}
              className="hidden lg:flex w-10 shrink-0 items-center justify-center border-l border-white/10 text-xs opacity-60 hover:opacity-100"
              style={{ writingMode: "vertical-rl" }}
            >
              Open Gemini - 112+ Features
            </button>
          )}
        </div>

        {/* Mobile bottom nav */}
        {!zen && (
          <div
            className="md:hidden sticky bottom-0 z-30 flex gap-1 px-3 py-2 border-t border-white/10"
            style={{ background: "rgba(8,10,22,0.95)", backdropFilter: "blur(20px)" }}
          >
            <button
              onClick={() => setSidebar(true)}
              className="flex-1 py-2 rounded-xl bg-white/10 text-xs"
            >
              Sidebar
            </button>
            <button
              onClick={() => setPalette(true)}
              className="flex-1 py-2 rounded-xl bg-white/10 text-xs"
            >
              Cmd+K
            </button>
            <button
              onClick={() => {
                setRightOpen(true);
                setRightTab("ai");
              }}
              className="flex-1 py-2 rounded-xl text-xs text-white"
              style={{ background: "var(--ag-accent)" }}
            >
              Gemini
            </button>
            <button
              onClick={() => {
                setRightOpen(true);
                setRightTab("features");
              }}
              className="flex-1 py-2 rounded-xl bg-white/10 text-xs"
            >
              112+
            </button>
          </div>
        )}

        {/* Mobile sidebar drawer */}
        {sidebar && (
          <div
            className="md:hidden fixed inset-0 z-[65] bg-black/70"
            onClick={() => setSidebar(false)}
          >
            <div
              className="w-[300px] h-full p-4 overflow-y-auto"
              style={{ background: "var(--ag-card)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <b>Agentic Browser</b>
                <button onClick={() => setSidebar(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs opacity-55 mt-1">
                Use the desktop layout for the full sidebar. On mobile, spaces
                live above the content.
              </p>
              <div className="grid grid-cols-4 gap-1.5 mt-4">
                {SPACES.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => {
                      switchSpace(s.name);
                      setSidebar(false);
                    }}
                    className="rounded-2xl p-2 text-center border"
                    style={{
                      borderColor: space === s.name ? s.accent : "rgba(255,255,255,0.08)",
                      background: space === s.name ? s.accent + "22" : "transparent",
                    }}
                  >
                    <div
                      className="w-7 h-7 mx-auto rounded-lg grid place-items-center text-sm font-bold text-white"
                      style={{ background: s.accent }}
                    >
                      {s.icon}
                    </div>
                    <div className="text-[11px] mt-1">{s.name}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setPalette(true);
                  setSidebar(false);
                }}
                className="w-full mt-4 py-3 rounded-2xl text-white"
                style={{ background: "var(--ag-accent)" }}
              >
                Open Cmd+K Search
              </button>
              <button
                onClick={() => {
                  setRightOpen(true);
                  setRightTab("ai");
                  setSidebar(false);
                }}
                className="w-full mt-2 py-3 rounded-2xl ag-glass"
              >
                Open Gemini AI
              </button>
            </div>
          </div>
        )}

        {/* PiP for YouTube */}
        {active?.page === "youtube" && pip && !zen && (
          <div
            className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-50 w-[280px] rounded-2xl overflow-hidden shadow-2xl border border-white/20 ag-slide-in-right"
            style={{ background: "#111" }}
          >
            <div
              className="h-[158px] relative grid place-items-center"
              style={{ background: "linear-gradient(135deg,#EA4335,#4285F4)" }}
            >
              <span className="text-4xl">{playing ? "❚❚" : "▶"}</span>
              <span className="absolute top-2 left-2 text-[10px] bg-black/60 px-2 py-1 rounded-full">
                PICTURE-IN-PICTURE
              </span>
              <button
                onClick={() => {
                  setPip(false);
                  onToast("PiP closed");
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full grid place-items-center"
                aria-label="Close PiP"
              >
                <X size={13} />
              </button>
            </div>
            <div className="p-3">
              <b className="text-sm block">Lo-fi for deep work</b>
              <span className="text-xs opacity-55">Agentic Radio - Playing in PiP</span>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="flex-1 py-2 rounded-full bg-white text-black text-xs font-bold flex justify-center gap-1 items-center"
                >
                  {playing ? <Pause size={13} /> : <Play size={13} />}{" "}
                  {playing ? "Pause" : "Play"}
                </button>
                <button
                  onClick={() => {
                    setPip(false);
                    onToast("Returned to YouTube tab");
                  }}
                  className="flex-1 py-2 rounded-full bg-white/15 text-xs"
                >
                  Return to tab
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zen exit button */}
        {zen && (
          <button
            onClick={toggleZen}
            className="fixed top-4 right-4 z-50 px-3 py-2 rounded-full text-xs text-white"
            style={{ background: "var(--ag-accent)" }}
          >
            Exit Zen
          </button>
        )}
      </div>

      {/* Command palette (mounted only when open so query resets naturally) */}
      {palette && (
        <CommandPalette
          tabs={tabs}
          onAction={handlePaletteAction}
          onOpenTab={(id) => {
            setActiveId(id);
            const t = tabs.find((x) => x.id === id);
            if (t) setSpace(t.space);
            onToast(`Switched to ${t?.title}`);
          }}
          onClose={() => setPalette(false)}
        />
      )}

      {/* Shortcuts modal */}
      {shortcuts && <ShortcutsModal onClose={() => setShortcuts(false)} />}
    </div>
  );
}
