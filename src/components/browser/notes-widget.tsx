"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";

export type Note = {
  id: string;
  text: string;
  done: boolean;
  pinned?: boolean;
  space?: string;
};

type Props = {
  space: string;
  onToast: (m: string) => void;
};

export function NotesWidget({ space, onToast }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/notes?space=${encodeURIComponent(space)}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j.error) throw new Error(j.error || "Failed to load notes");
      setNotes(j.notes || []);
    } catch (e: any) {
      setError(e?.message || "Notes unavailable right now.");
    } finally {
      setLoading(false);
    }
  }, [space]);

  useEffect(() => {
    // Schedule async loading after the effect; cancel the pending start on unmount.
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function add() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: t, space }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j.error) throw new Error(j.error || "Failed to save note");
      setNotes((n) => [j.note, ...n]);
      setText("");
      onToast("Note saved");
    } catch (e: any) {
      onToast(e?.message || "Could not save note");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(n: Note) {
    setNotes((arr) =>
      arr.map((x) => (x.id === n.id ? { ...x, done: !x.done } : x))
    );
    try {
      const res = await fetch(`/api/notes/${n.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ done: !n.done }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j.error) throw new Error(j.error || "Update failed");
    } catch {
      setNotes((arr) =>
        arr.map((x) => (x.id === n.id ? { ...x, done: n.done } : x))
      );
      onToast("Could not update note");
    }
  }

  async function remove(id: string) {
    const prev = notes;
    setNotes((arr) => arr.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onToast("Note deleted");
    } catch {
      setNotes(prev);
      onToast("Could not delete note");
    }
  }

  return (
    <div className="ag-glass rounded-[22px] p-4">
      <div className="flex justify-between items-center">
        <b>Quick Notes</b>
        <span className="text-xs opacity-45">Saved - {space}</span>
      </div>
      {error && (
        <p className="text-xs text-amber-300 mt-2">{error}</p>
      )}
      {loading ? (
        <div className="text-sm opacity-55 mt-3 flex items-center gap-2">
          <Loader2 size={14} className="ag-spin" /> Loading notes…
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm opacity-55 mt-3">
          No notes yet. Add one — it persists across reloads.
        </p>
      ) : (
        <div className="space-y-2 mt-3 max-h-64 overflow-y-auto ag-no-scrollbar">
          {notes.map((n) => (
            <div
              key={n.id}
              className="flex gap-2 items-center bg-white/5 p-2.5 rounded-xl"
            >
              <button
                onClick={() => toggle(n)}
                className="w-5 h-5 rounded-md border grid place-items-center shrink-0"
                style={{
                  background: n.done ? "var(--ag-accent)" : "transparent",
                  borderColor: n.done ? "var(--ag-accent)" : "rgba(255,255,255,0.25)",
                }}
                aria-label={n.done ? "Mark not done" : "Mark done"}
              >
                {n.done && <Check size={13} />}
              </button>
              <span
                className={`flex-1 text-sm ${n.done ? "line-through opacity-50" : ""}`}
              >
                {n.text}
              </span>
              <button
                onClick={() => remove(n.id)}
                aria-label="Delete note"
                className="opacity-60 hover:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a quick note…"
          className="flex-1 min-w-0 bg-white/8 border border-white/10 rounded-full px-3 py-2.5 text-sm"
          aria-label="New note text"
        />
        <button
          onClick={add}
          disabled={busy || !text.trim()}
          className="px-4 rounded-full text-white text-sm font-bold shrink-0 disabled:opacity-50 flex items-center gap-1"
          style={{ background: "var(--ag-accent)" }}
        >
          {busy ? <Loader2 size={14} className="ag-spin" /> : <Plus size={14} />}
          Save
        </button>
      </div>
    </div>
  );
}
