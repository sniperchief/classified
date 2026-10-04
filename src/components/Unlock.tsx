import { useEffect, useRef, useState, type CSSProperties } from "react";
import { RANKS, UNLOCKS, clearance, useGame, type Step } from "../game/state";
import { sfx } from "../lib/sound";

/** "Card unlocked" toast dealt in from the right when a mission is cleared. */
export function UnlockToast() {
  const { progress } = useGame();
  const prev = useRef<Step>(progress.step);
  const [shown, setShown] = useState<{ key: number; title: string; skill: string; rank: string } | null>(null);

  useEffect(() => {
    const from = prev.current;
    prev.current = progress.step;
    const u = UNLOCKS[progress.step];
    // Only on forward progress between missions (not on load or replay).
    if (!u || from === progress.step || from === "briefing") return;
    sfx.success();
    setShown({ key: Date.now(), ...u, rank: RANKS[clearance(progress)] });
    const t = setTimeout(() => setShown(null), 4300);
    return () => clearTimeout(t);
  }, [progress.step]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null;
  return (
    <div key={shown.key} className="pointer-events-none fixed right-4 top-28 z-[60] w-64 animate-toast sm:right-8" style={{ "--tilt": "-3deg" } as CSSProperties}>
      <div className="ring-in-pink rounded-[14px] bg-white p-5 text-black">
        <div className="label text-pink">Card unlocked</div>
        <div className="mt-2 font-display text-2xl font-black leading-[1.05]">{shown.title}.</div>
        <div className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-black/60">+ Skill: {shown.skill}</div>
        <div className="mt-3 border-t-2 border-black pt-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">Clearance → {shown.rank}</div>
      </div>
    </div>
  );
}
