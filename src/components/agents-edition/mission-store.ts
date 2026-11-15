"use client";

// Mission store: client-side state for the agent mission runner.
// Ports the rich HTML prototype's `run()`, `push()`, `gate()`, `hsh()` and
// the replay scrubber into a typed zustand slice. The store is consumed by
// the agent panel (roster + recorder) and by the agent viewport in pages.tsx.

import { create } from "zustand";
import {
  AGENTS,
  MISSION_SCRIPT,
  MISSION_GOAL_DEFAULT,
  missionHash,
  type AgentId,
  type MissionEvent,
  type MissionPage,
  type MissionStep,
} from "./browser-data";

export type GateKind = "payment" | "oauth";

// A pending gate is a promise resolver the UI calls when the user clicks
// Approve / Deny on the x402 payment or the Google consent screen.
type GateResolver = (ok: boolean) => void;

export type MissionState = {
  goal: string;
  running: boolean;
  twin: boolean; // Digital Twin — dry run, no real spend
  noGoogle: boolean; // user denied OAuth at the gate
  events: MissionEvent[]; // the recorder log
  view: number | null; // replay index (null = live)
  missions: number;
  gate: GateResolver | null; // active gate, if waiting
  gateKind: GateKind | null;
  lastReceipt: string;

  // setters
  setGoal: (g: string) => void;
  toggleTwin: () => void;
  setView: (v: number | null) => void;
  resolveGate: (ok: boolean) => void;
  reset: () => void;

  // run a fresh mission
  run: () => Promise<void>;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useMission = create<MissionState>((set, get) => ({
  goal: MISSION_GOAL_DEFAULT,
  running: false,
  twin: false,
  noGoogle: false,
  events: [],
  view: null,
  missions: 0,
  gate: null,
  gateKind: null,
  lastReceipt: "",

  setGoal: (g) => set({ goal: g }),
  toggleTwin: () => set((s) => ({ twin: !s.twin })),
  setView: (v) => set({ view: v }),
  resolveGate: (ok) => {
    const g = get().gate;
    if (g) g(ok);
    set({ gate: null, gateKind: null });
  },
  reset: () =>
    set({
      running: false,
      events: [],
      view: null,
      gate: null,
      gateKind: null,
      noGoogle: false,
    }),

  run: async () => {
    const state = get();
    if (state.running) return;

    set({
      running: true,
      events: [],
      view: null,
      noGoogle: false,
      missions: state.missions + 1,
      gate: null,
      gateKind: null,
    });

    const t0 = Date.now();
    const push = (s: MissionStep, extra: Partial<MissionEvent> = {}) => {
      const ev: MissionEvent = {
        a: s.a,
        t: s.t,
        page: s.page,
        url: s.url,
        cost: s.cost,
        at: ((Date.now() - t0) / 1000).toFixed(1),
        ...extra,
        msg: "[Demo] " + (extra.msg || s.msg),
      };
      set((cur) => ({ events: [...cur.events, ev], view: null }));
    };

    for (const s of MISSION_SCRIPT) {
      await sleep(900);

      // --- Human gate (payment or OAuth consent) ---
      if (s.t === "gate") {
        const gateKind: GateKind = s.k === "oauth" ? "oauth" : "payment";
        push(s);
        const ok = await new Promise<boolean>((resolve) => {
          set({ gate: resolve, gateKind });
        });
        set({ gate: null, gateKind: null });

        if (s.k === "oauth") {
          if (ok) {
            push(
              { a: "sent", t: "act", page: "drive", url: s.url, msg: "You allowed Drive, Docs, Calendar and Gmail send, limited to items this mission creates." } as MissionStep
            );
          } else {
            set({ noGoogle: true });
            push(
              { a: "sent", t: "deny", page: "drive", url: s.url, msg: "You denied Google access. Scribe Turtle will skip Drive, Docs, Calendar and Gmail." } as MissionStep
            );
          }
          continue;
        }

        if (!ok) {
          push(
            { a: "sent", t: "deny", page: "pay", url: s.url, msg: "Human denied the payment. Bee Buyer and Scribe stood down." } as MissionStep
          );
          await sleep(700);
          const h = missionHash(get().events);
          set({ lastReceipt: h });
          push(
            { a: "orch", t: "done", page: "home", url: "agenet://receipt", msg: "Mission stopped by human. No funds moved. Receipt hash " + h + "." } as MissionStep
          );
          break;
        }
        push(
          { a: "sent", t: "act", page: "pay", url: s.url, msg: "Human approved. Released the spend limit for this one payment." } as MissionStep
        );
        continue;
      }

      // --- Google-gated steps skipped if OAuth denied ---
      if (s.g && get().noGoogle) continue;
      // Twin dry-run for Google-gated steps
      if (s.g && get().twin) {
        push(s, { twin: true, msg: "[Twin] Would have: " + s.msg });
        continue;
      }
      // Twin dry-run for payment step
      if (s.t === "pay" && get().twin) {
        push(s, { twin: true, msg: "[Twin] Simulated the 402 and signature. No funds moved." });
        continue;
      }

      if (s.t === "done") {
        const h = missionHash(get().events);
        set({ lastReceipt: h });
        push(s, { msg: s.msg + h + "." });
      } else {
        push(s);
      }
    }

    set({ running: false });
  },
}));

// Convenience selectors used by the panels.
export const missionSlice = (s: MissionState) => ({
  running: s.running,
  events: s.events,
  view: s.view,
  gate: s.gate,
  gateKind: s.gateKind,
  twin: s.twin,
  missions: s.missions,
  lastReceipt: s.lastReceipt,
});

export { AGENTS };
export type { AgentId, MissionPage };
