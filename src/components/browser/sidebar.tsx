"use client";

import {
  ArrowRight,
  Cpu,
  Layers,
  Pin,
  Plus,
  Search,
  Shield,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  PINNED,
  PROFILES,
  SPACES,
  type Tab,
  type SpaceDef,
} from "./browser-data";

type Props = {
  space: string;
  search: string;
  setSearch: (s: string) => void;
  tabs: Tab[];
  activeId: string;
  setActiveId: (id: string) => void;
  switchSpace: (s: string) => void;
  openPage: (title: string, page: any, domain: string, fav?: string) => void;
  toggleMute: (id: string) => void;
  togglePin: (id: string) => void;
  closeTab: (id: string) => void;
  cleanUp: () => void;
  restoreCleaned: () => void;
  cleanedCount: number;
  onOpenPalette: () => void;
  profile: string;
  setProfile: (p: string) => void;
  cpu: number;
  ram: number;
  blocked: number;
  onToast: (m: string) => void;
};

export function Sidebar(props: Props) {
  const {
    space,
    search,
    setSearch,
    tabs,
    activeId,
    setActiveId,
    switchSpace,
    openPage,
    toggleMute,
    togglePin,
    closeTab,
    cleanUp,
    restoreCleaned,
    cleanedCount,
    onOpenPalette,
    profile,
    setProfile,
    cpu,
    ram,
    blocked,
    onToast,
  } = props;

  const spaceTabs = tabs.filter((t) => t.space === space);
  const visibleTabs = spaceTabs.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );
  const activeSpace = SPACES.find((s) => s.name === space);

  return (
    <aside
      className="w-[268px] lg:w-[288px] shrink-0 hidden md:flex flex-col border-r border-white/10 p-3 gap-3 overflow-y-auto ag-no-scrollbar"
      style={{ background: "rgba(255,255,255,0.035)" }}
    >
      {/* Search */}
      <div>
        <button
          onClick={onOpenPalette}
          className="w-full ag-glass rounded-2xl px-3 py-2.5 flex items-center gap-2 text-left"
        >
          <Search size={16} className="shrink-0 opacity-70" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Search tabs, actions…"
            className="bg-transparent flex-1 min-w-0 text-sm placeholder:opacity-40 outline-none"
            aria-label="Search tabs"
          />
          <kbd className="text-[10px] border border-white/20 rounded px-1.5 py-0.5 opacity-70">
            Cmd+K
          </kbd>
        </button>

        {/* Spaces */}
        <div className="flex items-center justify-between mt-4 px-1">
          <b className="text-xs tracking-widest opacity-50">SPACES</b>
          <button
            onClick={() => onToast(`New space created - Space ${SPACES.length + 1}`)}
            className="text-xs px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            + New
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          {SPACES.map((s: SpaceDef) => (
            <button
              key={s.name}
              onClick={() => switchSpace(s.name)}
              className="rounded-2xl p-2 text-center border transition"
              style={{
                borderColor: space === s.name ? s.accent : "rgba(255,255,255,0.08)",
                background:
                  space === s.name ? s.accent + "22" : "rgba(255,255,255,0.03)",
              }}
              aria-pressed={space === s.name}
            >
              <div
                className="w-7 h-7 mx-auto rounded-lg grid place-items-center text-sm font-bold"
                style={{ background: s.accent, color: "#fff" }}
              >
                {s.icon}
              </div>
              <div className="text-[11px] font-bold mt-1 truncate">{s.name}</div>
            </button>
          ))}
        </div>
        <div className="text-[11px] opacity-45 px-1 mt-2">
          {activeSpace?.desc} - {spaceTabs.length} tabs
        </div>
      </div>

      {/* Pinned */}
      <div>
        <div className="flex justify-between px-1">
          <b className="text-xs tracking-widest opacity-50">PINNED</b>
          <span className="text-xs opacity-40">{PINNED.length} sites</span>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {PINNED.map((p) => (
            <button
              key={p.name}
              onClick={() => openPage(`${p.name} - ${space}`, p.page, p.domain, p.icon)}
              className="rounded-2xl p-2 ag-glass text-center hover:-translate-y-0.5 transition"
              title={p.name}
            >
              <div
                className="w-9 h-9 mx-auto rounded-xl grid place-items-center text-sm font-bold"
                style={{
                  background: p.color + "28",
                  border: `1px solid ${p.color}55`,
                  color: p.color,
                }}
              >
                {p.icon}
              </div>
              <div className="text-[11px] mt-1.5 truncate">{p.name}</div>
            </button>
          ))}
        </div>
      </div>

      <a href="/money" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition hover:bg-white/10" style={{background:"linear-gradient(90deg,rgba(3,88,247,.22),rgba(253,2,245,.10))", border:"1px solid rgba(3,88,247,.28)"}}>
        <span className="grid h-9 w-9 place-items-center rounded-xl text-lg" style={{background:"linear-gradient(135deg,#0358F7,#FD02F5)"}}>◈</span>
        <span className="min-w-0 flex-1"><span className="block">Money OS</span><span className="block text-[10px] font-medium opacity-55">AgentPAL × PayPal</span></span>
        <ArrowRight size={15} className="opacity-60" />
      </a>

      {/* Tabs list */}
      <div className="flex-1 min-h-[170px]">
        <div className="flex justify-between px-1">
          <b className="text-xs tracking-widest opacity-50">
            TABS - {space.toUpperCase()}
          </b>
          <span className="text-[11px] opacity-40">hold to reorder</span>
        </div>
        <div className="space-y-1 mt-2">
          {visibleTabs.map((t) => (
            <div
              key={t.id}
              className="group flex items-center gap-2 rounded-xl px-2 py-2 border transition"
              style={{
                background: t.id === activeId ? "var(--ag-accent)" : "rgba(255,255,255,0.04)",
                borderColor: t.id === activeId ? "var(--ag-accent)" : "transparent",
              }}
            >
              <button
                onClick={() => setActiveId(t.id)}
                className="flex-1 min-w-0 text-left flex gap-2 items-center"
              >
                <span
                  className="w-5 h-5 rounded grid place-items-center text-[10px] font-bold shrink-0"
                  style={{
                    background:
                      t.id === activeId ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                  }}
                >
                  {t.fav}
                </span>
                <span className="truncate text-[13px]">{t.title}</span>
                {t.muted && <VolumeX size={13} className="opacity-70" />}
                {t.pinned && <Pin size={11} className="opacity-70" />}
              </button>
              <button
                onClick={() => toggleMute(t.id)}
                className="opacity-0 group-hover:opacity-100 transition"
                aria-label="Mute tab"
              >
                {t.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <button
                onClick={() => togglePin(t.id)}
                className="opacity-0 group-hover:opacity-100 transition"
                aria-label="Pin tab"
              >
                <Pin size={14} />
              </button>
              <button
                onClick={() => closeTab(t.id)}
                className="opacity-0 group-hover:opacity-100 transition"
                aria-label="Close tab"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {visibleTabs.length === 0 && (
            <div className="text-sm opacity-55 p-3">
              No tabs match &ldquo;{search}&rdquo;.
            </div>
          )}
        </div>
      </div>

      {/* Gemini Mini / clean up */}
      <div className="space-y-2">
        <button
          onClick={() => {
            onOpenPalette();
            onToast("Gemini Mini is listening - use the palette");
          }}
          className="w-full rounded-2xl p-3 text-left text-white flex gap-2 items-center"
          style={{
            background: "linear-gradient(90deg,var(--ag-accent),var(--ag-accent2))",
          }}
        >
          <span className="text-xl">S</span>
          <span>
            <b className="block text-sm">Gemini Mini</b>
            <span className="text-xs opacity-80">Your quick companion</span>
          </span>
          <ArrowRight size={16} className="ml-auto" />
        </button>
        <button
          onClick={cleanUp}
          className="w-full ag-glass rounded-2xl px-3 py-2.5 flex justify-between text-sm"
        >
          <span>Clean Up</span>
          <span className="opacity-55">Move inactive tabs</span>
        </button>
        <button
          onClick={restoreCleaned}
          className="w-full text-left text-xs px-1 opacity-55 hover:opacity-80 transition"
        >
          Recently Cleaned ({cleanedCount}) - restore
        </button>
      </div>

      {/* Profile + stats */}
      <div className="ag-glass rounded-2xl p-3">
        <div className="flex gap-1">
          {PROFILES.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setProfile(p.name);
                onToast(`Profile switched to ${p.name}`);
              }}
              className="flex-1 rounded-xl py-2 text-center text-xs border transition"
              style={{
                borderColor: profile === p.name ? p.color : "transparent",
                background: profile === p.name ? p.color + "22" : "transparent",
              }}
            >
              <span
                className="w-7 h-7 rounded-full mx-auto grid place-items-center text-white font-bold"
                style={{ background: p.color }}
              >
                {p.letter}
              </span>
              <span className="block mt-1 truncate text-[10px]">
                {p.name.split(" — ")[0]}
              </span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[11px]">
          <div className="bg-white/5 rounded-xl p-2">
            <Cpu size={14} className="mx-auto opacity-70" />
            <b className="block mt-1">{cpu.toFixed(1)}%</b>
            <span className="opacity-50">CPU</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2">
            <Layers size={14} className="mx-auto opacity-70" />
            <b className="block mt-1">{ram}</b>
            <span className="opacity-50">MB</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2">
            <Shield size={14} className="mx-auto opacity-70" />
            <b className="block mt-1">{blocked}</b>
            <span className="opacity-50">blocked</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
