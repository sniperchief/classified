import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { getEngine, type EngineMode, type EngineSnapshot, type MissionEngine } from "../zcash";

export type Step = "briefing" | "safehouse" | "acquire" | "shield" | "infiltrate" | "handoff" | "complete" | "bonus";

export const MISSIONS: { step: Step; code: string; name: string }[] = [
  { step: "safehouse", code: "01", name: "SAFEHOUSE" },
  { step: "acquire", code: "02", name: "INTELLIGENCE" },
  { step: "shield", code: "03", name: "SHIELD" },
  { step: "infiltrate", code: "04", name: "INFILTRATION" },
  { step: "handoff", code: "05", name: "HANDOFF" },
];

/** Clearance rank: the game's only "score" — one level per completed mission. */
export const RANKS = ["Recruit", "Operative", "Field agent", "Specialist", "Case officer", "Station chief", "Director"];
const STEP_ORDER: Step[] = ["briefing", "safehouse", "acquire", "shield", "infiltrate", "handoff", "complete", "bonus"];

export function clearance(p: Progress): number {
  const i = STEP_ORDER.indexOf(p.step);
  const base = p.step === "bonus" ? 5 : Math.max(0, i - 1);
  return Math.min(6, base + (p.unshieldTxid && !p.unshieldTxid.startsWith("pending:") ? 1 : 0));
}

/** Achievement card shown when a mission is cleared (keyed by the step you advance INTO). */
export const UNLOCKS: Partial<Record<Step, { title: string; skill: string }>> = {
  acquire: { title: "Safehouse established", skill: "Set up a Zcash wallet" },
  shield: { title: "Intelligence acquired", skill: "Get ZEC" },
  infiltrate: { title: "Intelligence secured", skill: "Shield ZEC" },
  handoff: { title: "Route locked", skill: "Choose a shielded channel" },
  complete: { title: "Delivery confirmed", skill: "Send & receive privately" },
};

export interface Progress {
  step: Step;
  mode: EngineMode;
  shieldTxid?: string;
  /** Funds arrived already shielded, so there was nothing to shield. */
  arrivedShielded?: boolean;
  sendTxid?: string;
  sendTo?: string;
  sendZats?: string; // bigint as string for JSON
  unshieldTxid?: string;
  unshieldZats?: string;
}

const KEY = "classified.progress.v1";
const initial: Progress = { step: "briefing", mode: "live" };

function loadProgress(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "null") as Progress | null;
    return p && p.step ? p : initial;
  } catch {
    return initial;
  }
}

interface GameCtx {
  progress: Progress;
  update: (patch: Partial<Progress>) => void;
  go: (step: Step) => void;
  /** Replay the story; keeps the wallet (and remaining funds). */
  replay: () => void;
  /** Delete the wallet and all progress. */
  burn: () => Promise<void>;
  engine: MissionEngine | null;
  setMode: (m: EngineMode) => void;
}

const Ctx = createContext<GameCtx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [engine, setEngine] = useState<MissionEngine | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(progress));
    } catch {
      /* storage unavailable: progress just won't survive a reload */
    }
  }, [progress]);

  // Load the engine for the selected mode once the player is past the briefing.
  useEffect(() => {
    if (progress.step === "briefing") return;
    let alive = true;
    getEngine(progress.mode).then((e) => {
      if (!alive) return;
      setEngine(e);
      e.boot()
        .then(() => e.getSnapshot().hasWallet && e.startAutoSync())
        .catch((err) => console.error("[classified] boot failed", err));
    });
    return () => {
      alive = false;
    };
  }, [progress.mode, progress.step === "briefing"]);

  const update = useCallback((patch: Partial<Progress>) => setProgress((p) => ({ ...p, ...patch })), []);
  const go = useCallback((step: Step) => {
    setProgress((p) => ({ ...p, step }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const setMode = useCallback((mode: EngineMode) => setProgress((p) => ({ ...p, mode })), []);
  const replay = useCallback(() => {
    setProgress((p) => ({ step: "briefing", mode: p.mode }));
  }, []);
  const burn = useCallback(async () => {
    await engine?.burnWallet();
    setProgress({ step: "briefing", mode: "live" });
  }, [engine]);

  const value = useMemo(() => ({ progress, update, go, replay, burn, engine, setMode }), [progress, update, go, replay, burn, engine, setMode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGame outside GameProvider");
  return c;
}

const EMPTY: EngineSnapshot = {
  mode: "live",
  status: "idle",
  hasWallet: false,
  agent: null,
  contactAddress: null,
  contactIsLocal: true,
  agentBalance: { transparent: 0n, shielded: 0n, shieldedPending: 0n },
  contactBalance: { transparent: 0n, shielded: 0n, shieldedPending: 0n },
  chainTip: 0,
  scannedHeight: 0,
  syncing: false,
  lastSyncAt: null,
  bootError: null,
};
const noop = () => () => {};

export function useSnapshot(): EngineSnapshot {
  const { engine } = useGame();
  return useSyncExternalStore(engine ? engine.subscribe : noop, engine ? engine.getSnapshot : () => EMPTY);
}
