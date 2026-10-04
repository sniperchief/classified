import { useEffect, useState, type CSSProperties } from "react";
import { describeError } from "../zcash/errors";
import { sfx } from "../lib/sound";
import { Button } from "./ui";

/** A red "bad card" dealt onto the table, in mission language, with technical details on demand. */
export function ErrorPanel({
  error,
  context,
  onRetry,
  extra,
}: {
  error: unknown;
  context?: string;
  onRetry?: () => void;
  extra?: React.ReactNode;
}) {
  const e = describeError(error, context);
  const [open, setOpen] = useState(false);
  useEffect(() => sfx.alert(), [error]);
  return (
    <div className="ring-in-red animate-shake max-w-2xl rounded-[14px] bg-white p-6 text-black" style={{ "--tilt": "-1deg" } as CSSProperties}>
      <div className="label text-red">⚠ Transmission alert</div>
      <h3 className="mt-2 font-display text-3xl font-black leading-[1.05]">{e.title.charAt(0) + e.title.slice(1).toLowerCase()}.</h3>
      <p className="mt-3 text-[15px] leading-[1.7] text-black/80">{e.message}</p>
      {e.hint && <p className="mt-1 text-sm leading-[1.7] text-black/60">{e.hint}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {onRetry && (
          <Button variant="ink" size="md" onClick={onRetry}>
            Try again
          </Button>
        )}
        {extra}
      </div>
      <button className="label mt-5 block text-[10px] text-black/40 hover:text-black" onClick={() => setOpen(!open)}>
        {open ? "− Hide" : "+ Show"} technical details
      </button>
      {open && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-[8px] bg-black p-3 font-mono text-[11px] text-white/70">{e.technical}</pre>}
    </div>
  );
}
