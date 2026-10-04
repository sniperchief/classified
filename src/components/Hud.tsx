import { useState, type CSSProperties } from "react";
import { config } from "../config";
import { MISSIONS, RANKS, clearance, useGame, useSnapshot } from "../game/state";
import { formatZats } from "../lib/format";
import { isMuted, setMuted } from "../lib/sound";

const ORDER = ["safehouse", "acquire", "shield", "infiltrate", "handoff", "complete", "bonus"];

export function TopBar() {
  const { progress } = useGame();
  const [muted, setM] = useState(isMuted());
  const inGame = progress.step !== "briefing";
  const demo = progress.mode === "demo" && inGame;
  const lvl = clearance(progress);
  return (
    <div className="sticky top-0 z-50 bg-black">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl font-black tracking-[-0.01em] sm:text-2xl">CLASSIFIED</span>
          <span className="label hidden text-[10px] text-dim sm:inline">CIA // Top secret</span>
        </div>
        <div className="flex items-center gap-2">
          {inGame && (
            <span className="label ring-in-white hidden items-center gap-2 rounded-[38px] px-3.5 py-1.5 text-[10px] md:flex">
              <span className="text-muted">Clearance {lvl}</span>
              <span>{RANKS[lvl]}</span>
            </span>
          )}
          {demo ? (
            <span className="label ring-in-gold rounded-[38px] px-3.5 py-1.5 text-[10px] text-gold">Demo mode</span>
          ) : (
            <span className="label ring-in-violet flex items-center gap-2 rounded-[38px] px-3.5 py-1.5 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-violet" />
              {config.isTestnet ? "Zcash testnet" : "Zcash mainnet"}
            </span>
          )}
          <button
            className="label ring-in-ash grid h-8 w-8 place-items-center rounded-full text-[11px] text-muted hover:text-white"
            onClick={() => {
              setMuted(!muted);
              setM(!muted);
            }}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            title={muted ? "Sound off" : "Sound on"}
          >
            {muted ? "✕" : "♪"}
          </button>
        </div>
      </div>
      {inGame && <Hand />}
    </div>
  );
}

/** Mission progress as a hand of cards: face-down until reached, flipped face-up when cleared. */
function Hand() {
  const { progress } = useGame();
  const cur = ORDER.indexOf(progress.step);
  return (
    <div className="border-y border-ash">
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-3 sm:px-6">
        <span className="label hidden shrink-0 text-[10px] text-dim md:inline">Mission progress</span>
        <ol className="flex flex-1 items-end justify-between gap-2 sm:justify-start sm:gap-3">
          {MISSIONS.map((m, i) => {
            const idx = ORDER.indexOf(m.step);
            const done = cur > idx;
            const active = cur === idx;
            const tilt = (i - 2) * 2.5;
            return (
              <li key={m.step} className="flex items-center gap-2.5">
                <div
                  key={done ? "done" : active ? "active" : "locked"}
                  className={`relative grid h-12 w-9 shrink-0 place-items-center rounded-[7px] font-mono text-[11px] font-bold transition-transform ${
                    done ? "animate-flip bg-white text-black" : active ? "ring-in-pink -translate-y-1 bg-black text-white" : "card-back ring-in-ash text-dim"
                  }`}
                  style={{ "--tilt": `${tilt}deg`, transform: !done ? `rotate(${tilt}deg)${active ? " translateY(-4px)" : ""}` : undefined } as CSSProperties}
                >
                  {done ? "✓" : m.code}
                </div>
                <span className={`label hidden text-[10px] lg:inline ${active ? "text-white" : done ? "text-muted" : "text-dim"}`}>{m.name}</span>
                {i < MISSIONS.length - 1 && <span className="hidden h-px w-4 bg-ash xl:block" />}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export function StatusBar() {
  const { progress } = useGame();
  const s = useSnapshot();
  if (progress.step === "briefing" || !s.hasWallet) return null;
  const b = s.agentBalance;
  const live = s.mode === "live";
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ash bg-black">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] sm:px-6">
        <div className="flex items-center gap-3 text-muted">
          <span className={`h-2 w-2 rounded-full ${s.syncing ? "animate-pulse bg-gold" : "bg-white"}`} />
          <span>{live ? (s.syncing ? "Syncing" : "Link secure") : "Simulation"}</span>
          {live && s.chainTip > 0 && <span className="hidden text-dim sm:inline">Block {s.chainTip.toLocaleString()}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="ring-in-red rounded-[38px] px-3 py-1 text-white">
            <span className="text-red">Public</span> {formatZats(b.transparent)}
          </span>
          <span className="ring-in-violet rounded-[38px] px-3 py-1 text-white">
            <span className="text-lavender">Shielded</span> {formatZats(b.shielded)}
            {b.shieldedPending > 0n && <span className="text-gold"> +{formatZats(b.shieldedPending)}</span>}
          </span>
          <span className="text-dim">{config.ticker}</span>
        </div>
      </div>
    </div>
  );
}
