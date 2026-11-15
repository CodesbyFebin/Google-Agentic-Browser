"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FEATURES, CATS } from "./browser-data";

export function FeaturesPanel({ onToast }: { onToast: (m: string) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const filtered = useMemo(
    () =>
      FEATURES.filter(
        (f) =>
          (cat === "All" || f.cat === cat) &&
          (f.title + f.desc).toLowerCase().includes(q.toLowerCase())
      ),
    [q, cat]
  );

  return (
    <div>
      <div className="flex justify-between items-end">
        <div>
          <b className="text-xl">112 Additions</b>
          <p className="text-xs opacity-55 mt-0.5">
            The upgrade, in one list.
          </p>
        </div>
        <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
          {filtered.length} shown
        </span>
      </div>
      <div className="relative mt-3">
        <Search
          size={15}
          className="absolute left-3 top-3 opacity-60"
          aria-hidden
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search 112 additions…"
          className="w-full bg-white/8 border border-white/10 rounded-full pl-9 pr-3 py-2.5 text-sm"
          aria-label="Search additions"
        />
      </div>
      <div className="flex gap-1.5 overflow-x-auto ag-no-scrollbar mt-3 pb-1">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs border transition"
            style={{
              background: cat === c ? "var(--ag-accent)" : "transparent",
              borderColor: cat === c ? "var(--ag-accent)" : "rgba(255,255,255,0.12)",
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="space-y-2 mt-3 max-h-[calc(100vh-260px)] overflow-y-auto ag-no-scrollbar pr-1">
        {filtered.map((f) => (
          <div
            key={f.n}
            className="ag-glass rounded-2xl p-3 flex gap-3"
          >
            <span
              className="ag-mono text-xs w-8 h-8 shrink-0 rounded-lg grid place-items-center"
              style={{
                background: "var(--ag-accent)22",
                color: "var(--ag-accent)",
              }}
            >
              {String(f.n).padStart(3, "0")}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1.5 items-center">
                <b className="text-sm">{f.title}</b>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10">
                  {f.badge}
                </span>
                <span className="text-[10px] opacity-45">{f.cat}</span>
              </div>
              <p className="text-xs opacity-60 mt-1 leading-5">{f.desc}</p>
            </div>
            <button
              onClick={() => onToast(`${f.title} - enabled in this concept`)}
              className="ml-auto shrink-0 text-xs px-2 py-1 rounded-full bg-white/10 h-fit hover:bg-white/20 transition"
            >
              Try
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm opacity-55 p-3">
            No additions match that search.
          </p>
        )}
      </div>
    </div>
  );
}
