import { useRef, useState } from "react";
import { useUnlockChime } from "../game/useUnlockChime";
import { sfx } from "../lib/sound";

/** Why the slider is locked, shown on the track itself. `wait` clears by itself; `fix` needs the player. */
export type Lock = { text: string; kind: "wait" | "fix"; action?: { label: string; onClick: () => void } };

/**
 * Drag the intel along the track into the contact's hands to deliver. Release past the end
 * zone to confirm; release early and it snaps back. Pointer events cover mouse and touch;
 * keyboard users press Enter/Space on the handle, and a plain "tap to deliver" link is
 * offered as a fallback.
 */
export function SlideToDeliver({
  onConfirm,
  lock = null,
  target = "NIGHTJAR",
}: {
  onConfirm: () => void;
  lock?: Lock | null;
  target?: string;
}) {
  const disabled = !!lock;
  useUnlockChime(disabled);
  const track = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const [x, setX] = useState(0); // 0..1
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);

  const HANDLE = 64; // px
  const maxTravel = () => Math.max(1, (track.current?.clientWidth ?? 300) - HANDLE - 8);

  const confirm = () => {
    if (disabled || done) return;
    setDone(true);
    setX(1);
    sfx.lock();
    navigator.vibrate?.(30);
    onConfirm();
  };

  return (
    <div>
      <div
        ref={track}
        className={`relative h-[72px] select-none overflow-hidden rounded-[38px] bg-black [touch-action:none] ${
          lock ? (lock.kind === "wait" ? "animate-pulse ring-in-ash" : "ring-in-red") : "ring-in-white"
        }`}
      >
        {/* progress fill */}
        <div className="absolute inset-y-0 left-0 bg-pink/25" style={{ width: `calc(${x * 100}% + ${HANDLE / 2}px)` }} />
        {/* label */}
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center pl-16 pr-20 text-center font-mono text-[11px] font-bold uppercase leading-snug tracking-[0.1em] sm:text-sm ${
            lock ? (lock.kind === "wait" ? "text-gold" : "text-red") : "text-white/70"
          }`}
        >
          {done ? "Delivering…" : lock ? lock.text : dragging ? "Release at the contact" : `Slide intel to ${target}`}
        </div>
        {/* drop zone: the contact */}
        <div
          className={`absolute right-1 top-1 grid h-16 w-16 place-items-center rounded-full font-mono text-[10px] font-bold uppercase transition-colors ${
            x > 0.85 ? "bg-pink text-white" : "ring-in-ash text-muted"
          }`}
        >
          {target.slice(0, 3)}
        </div>
        {/* handle: the intel */}
        <button
          type="button"
          disabled={disabled || done}
          aria-label={`Deliver to ${target}`}
          className={`absolute left-1 top-1 grid h-16 w-16 place-items-center rounded-full bg-white text-2xl text-black disabled:opacity-40 ${dragging ? "cursor-grabbing" : "cursor-grab transition-transform duration-300"}`}
          style={{ transform: `translateX(${x * maxTravel()}px)` }}
          onPointerDown={(e) => {
            if (disabled || done) return;
            e.preventDefault();
            (e.currentTarget as Element).setPointerCapture(e.pointerId);
            startX.current = e.clientX - x * maxTravel();
            setDragging(true);
          }}
          onPointerMove={(e) => {
            if (!dragging) return;
            const v = Math.min(1, Math.max(0, (e.clientX - startX.current) / maxTravel()));
            setX(v);
          }}
          onPointerUp={() => {
            if (!dragging) return;
            setDragging(false);
            if (x > 0.85) confirm();
            else setX(0);
          }}
          onPointerCancel={() => {
            setDragging(false);
            setX(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              confirm();
            }
          }}
        >
          💾
        </button>
      </div>
      {!done && (
        <div className="mt-2.5 text-center">
          {lock?.action ? (
            <button type="button" onClick={lock.action.onClick} className="label text-[11px] text-white underline decoration-pink decoration-2 underline-offset-4">
              {lock.action.label}
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={confirm}
              className="label text-[10px] text-dim underline decoration-dim underline-offset-4 hover:text-white disabled:opacity-40"
            >
              {lock?.kind === "wait" ? "Unlocks automatically" : "Or tap to deliver"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
