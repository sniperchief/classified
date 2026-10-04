import { useRef, useState } from "react";
import { sfx } from "../lib/sound";

/**
 * Drag the intel along the track into the contact's hands to deliver. Release past the end
 * zone to confirm; release early and it snaps back. Pointer events cover mouse and touch;
 * keyboard users press Enter/Space on the handle, and a plain "tap to deliver" link is
 * offered as a fallback.
 */
export function SlideToDeliver({
  onConfirm,
  disabled = false,
  target = "NIGHTJAR",
}: {
  onConfirm: () => void;
  disabled?: boolean;
  target?: string;
}) {
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
        className={`relative h-[72px] select-none overflow-hidden rounded-[38px] bg-black ring-in-white [touch-action:none] ${disabled ? "opacity-35" : ""}`}
      >
        {/* progress fill */}
        <div className="absolute inset-y-0 left-0 bg-pink/25" style={{ width: `calc(${x * 100}% + ${HANDLE / 2}px)` }} />
        {/* label */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pl-16 pr-20 text-center font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-white/70 sm:text-sm">
          {done ? "Delivering…" : dragging ? "Release at the contact" : `Slide intel to ${target}`}
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
          className={`absolute left-1 top-1 grid h-16 w-16 place-items-center rounded-full bg-white text-2xl text-black ${dragging ? "" : "transition-transform duration-300"}`}
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
          <button
            type="button"
            disabled={disabled}
            onClick={confirm}
            className="label text-[10px] text-dim underline decoration-dim underline-offset-4 hover:text-white disabled:opacity-40"
          >
            Or tap to deliver
          </button>
        </div>
      )}
    </div>
  );
}
