import { useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { sfx } from "../lib/sound";

/* ───────────────────────── Buttons ─────────────────────────
 * Chunky pills (CAH geometry) with mono uppercase labels (Kippo voice).
 * Only `primary` is filled — pink is the single action color.          */

type Variant = "primary" | "outline" | "danger" | "ink";
type Size = "md" | "lg" | "xl";

export function Button({
  variant = "primary",
  size = "lg",
  loading,
  children,
  className = "",
  onClick,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  const sizes: Record<Size, string> = {
    md: "px-5 py-3 text-xs sm:px-6",
    lg: "px-7 py-4 text-sm sm:px-9",
    xl: "px-7 py-5 text-base sm:px-12 sm:py-6 sm:text-lg",
  };
  const styles: Record<Variant, string> = {
    primary: "bg-pink text-white hover:-translate-y-0.5 active:translate-y-0.5",
    outline: "ring-in-white text-white hover:bg-white hover:text-black",
    danger: "ring-in-red text-red hover:bg-red hover:text-black",
    ink: "ring-in-black text-black hover:bg-black hover:text-white",
  };
  return (
    <button
      {...rest}
      className={`inline-flex max-w-full items-center justify-center gap-3 rounded-[38px] text-center font-mono font-bold uppercase tracking-[0.12em] transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-35 ${sizes[size]} ${styles[variant]} ${className}`}
      onClick={(e) => {
        sfx.click();
        onClick?.(e);
      }}
      disabled={loading || rest.disabled}
    >
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

/* ───────────────────────── Playing card ─────────────────────────
 * The core content unit: a physical card dealt onto the table.      */

export type Face = "white" | "lemon" | "lavender" | "mint" | "sky" | "bubblegum" | "tangerine" | "black";
export type Accent = "red" | "violet" | "gold" | "pink" | "black" | "white" | "none";

const FACE: Record<Face, string> = {
  white: "bg-white text-black",
  lemon: "bg-lemon text-black",
  lavender: "bg-lavender text-black",
  mint: "bg-mint text-black",
  sky: "bg-sky text-black",
  bubblegum: "bg-bubblegum text-black",
  tangerine: "bg-tangerine text-black",
  black: "bg-black text-white",
};
const RING: Record<Accent, string> = {
  red: "ring-in-red",
  violet: "ring-in-violet",
  gold: "ring-in-gold",
  pink: "ring-in-pink",
  black: "ring-in-black",
  white: "ring-in-white",
  none: "",
};

export function PlayingCard({
  face = "white",
  accent = "black",
  tilt = 0,
  deal = false,
  delay = 0,
  className = "",
  style,
  children,
}: {
  face?: Face;
  accent?: Accent;
  tilt?: number;
  deal?: boolean;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[14px] p-5 sm:p-6 ${FACE[face]} ${RING[accent]} ${deal ? "animate-deal" : "tilt"} ${className}`}
      style={{ "--tilt": `${tilt}deg`, animationDelay: `${delay}ms`, ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── Terminal panel ─────────────────────────
 * Kippo's outlined panel: the 1px border IS the card.                 */

export function Panel({
  children,
  className = "",
  tone = "white",
  fill = "black",
}: {
  children: ReactNode;
  className?: string;
  tone?: "white" | "ash" | "red" | "violet" | "gold" | "pink";
  fill?: "black" | "carbon";
}) {
  const border = {
    white: "border-white",
    ash: "border-ash",
    red: "border-red",
    violet: "border-violet",
    gold: "border-gold",
    pink: "border-pink",
  }[tone];
  return <div className={`rounded-[14px] border ${border} ${fill === "carbon" ? "bg-carbon" : "bg-black"} ${className}`}>{children}</div>;
}

/* ───────────────────────── Headings ───────────────────────── */

export type Info = { term: string; body: ReactNode; more?: ReactNode };

export function MissionTitle({
  code,
  title,
  accent,
  status = "ACTIVE",
  info,
}: {
  code: string;
  title: string;
  accent?: string;
  status?: string;
  /** Field-manual explainer, opened from a "?" next to the title instead of filling the page. */
  info?: Info;
}) {
  const [open, setOpen] = useState(false);
  const parts = accent ? title.split(accent) : [title];
  return (
    <header className="animate-fade-up">
      <div className="label flex items-center gap-3 text-muted">
        <span className="flex items-center gap-2 text-white">
          <span className="h-2 w-2 rounded-full bg-pink" />
          MISSION {code}
        </span>
        <span>// {status}</span>
        {info && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Field manual: ${info.term}`}
            className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-sm font-bold text-white ring-in-white transition-colors hover:bg-white hover:text-black"
          >
            ?
          </button>
        )}
      </div>
      <h1 className="mt-4 break-words font-display text-[clamp(2.1rem,9.5vw,5rem)] font-black leading-[0.98] tracking-[-0.02em]">
        {accent ? (
          <>
            {parts[0]}
            <span className="text-pink">{accent}</span>
            {parts.slice(1).join(accent)}
          </>
        ) : (
          title
        )}
      </h1>
      {info && open && <InfoSheet info={info} onClose={() => setOpen(false)} />}
    </header>
  );
}

/** The field manual, as a bottom sheet on phones and a centred card on desktop. */
function InfoSheet({ info, onClose }: { info: Info; onClose: () => void }) {
  const [more, setMore] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex animate-fade-in items-end justify-center bg-black/80 p-3 sm:items-center sm:p-6" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ring-in-gold w-full max-w-lg animate-fade-up rounded-[14px] bg-white p-6 text-black sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <span className="label text-black/60">Field manual</span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full font-mono text-sm font-bold ring-in-black hover:bg-black hover:text-white">
            ✕
          </button>
        </div>
        <div className="mt-3 font-display text-2xl font-extrabold leading-tight">{info.term}</div>
        <p className="mt-2 text-[15px] leading-[1.7] text-black/80 sm:text-base">{info.body}</p>
        {info.more && (
          <>
            <button type="button" className="label mt-4 text-black/50 hover:text-black" onClick={() => setMore(!more)}>
              {more ? "− Less" : "+ Technical detail"}
            </button>
            {more && <div className="mt-2 text-sm leading-[1.7] text-black/70">{info.more}</div>}
          </>
        )}
      </div>
    </div>
  );
}

/** Compact in-panel step tracker: dots + "Step 2 of 3 · label". `current` = index of the step in progress. */
export function Steps({ labels, current }: { labels: string[]; current: number }) {
  const complete = current >= labels.length;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <div className="flex items-center gap-1.5" aria-hidden>
        {labels.map((l, i) => (
          <span key={l} className={`h-1.5 rounded-full transition-all duration-300 ${i < current ? "w-5 bg-white" : i === current ? "w-8 bg-pink" : "w-5 bg-ash"}`} />
        ))}
      </div>
      <span className="label text-[10px] text-muted">
        {complete ? "Objective complete" : <>Step {current + 1} of {labels.length} · <span className="text-white">{labels[current]}</span></>}
      </span>
    </div>
  );
}

/** Types out briefing lines like a secure terminal. Click to skip. */
export function Typewriter({
  lines,
  speed = 20,
  className = "font-mono text-[15px] leading-[1.88] text-white/90 sm:text-base",
  prompt = true,
  onDone,
}: {
  lines: string[];
  speed?: number;
  className?: string;
  prompt?: boolean;
  onDone?: () => void;
}) {
  const [shown, setShown] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const skip = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const key = lines.join("\n");

  useEffect(() => {
    let alive = true;
    skip.current = false;
    setShown([]);
    setDone(false);
    (async () => {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let c = 1; c <= line.length; c++) {
          if (!alive) return;
          if (skip.current) break;
          setShown((s) => [...s.slice(0, i), line.slice(0, c)]);
          if (c % 3 === 0) sfx.tick();
          await new Promise((r) => setTimeout(r, line[c - 1] === "." ? speed * 7 : speed));
        }
        if (skip.current) break;
        setShown((s) => [...s.slice(0, i), line]);
        await new Promise((r) => setTimeout(r, 260));
      }
      if (!alive) return;
      setShown(lines);
      setDone(true);
      doneRef.current?.();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div className={`cursor-pointer ${className}`} onClick={() => (skip.current = true)}>
      {shown.map((l, i) => (
        <p key={i}>
          {prompt && <span className="mr-3 text-pink">&gt;</span>}
          {l}
          {!done && i === shown.length - 1 && <span className="ml-1 inline-block h-[1.1em] w-[0.6em] translate-y-[3px] animate-blink bg-white" />}
        </p>
      ))}
    </div>
  );
}

/** A tilted verdict badge, slapped down like a card. */
export function Stamp({ children, tone = "pink", className = "" }: { children: ReactNode; tone?: "red" | "violet" | "gold" | "pink"; className?: string }) {
  const c = { red: "ring-in-red text-red", violet: "ring-in-violet text-white bg-violet/20", gold: "ring-in-gold text-gold", pink: "ring-in-pink text-pink" }[tone];
  return (
    <div
      className={`inline-block animate-deal rounded-[38px] px-5 py-2 font-mono text-sm font-bold uppercase tracking-[0.18em] sm:text-base ${c} ${className}`}
      style={{ "--tilt": "-3deg" } as CSSProperties}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── Data & copy ───────────────────────── */

export function CopyField({ label, value, tone = "white", onCopy }: { label: string; value: string; tone?: "white" | "red" | "violet"; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);
  const ring = { white: "ring-in-white", red: "ring-in-red", violet: "ring-in-violet" }[tone];
  return (
    <div>
      <div className="label mb-2 text-muted">{label}</div>
      <div className={`flex items-center gap-2 rounded-[38px] bg-black py-1.5 pl-5 pr-1.5 ${ring}`}>
        <code className="min-w-0 flex-1 break-all py-1.5 font-mono text-xs leading-relaxed text-white sm:text-[13px]">{value}</code>
        <button
          className="shrink-0 rounded-[38px] bg-white px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:bg-pink hover:text-white"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
            } catch {
              /* clipboard blocked; user can select manually */
            }
            sfx.confirm();
            onCopy?.();
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function ExternalLink({ href, children, dark = false }: { href: string; children: ReactNode; dark?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`label underline decoration-2 underline-offset-4 ${dark ? "text-black decoration-black/30 hover:decoration-black" : "text-white decoration-white/30 hover:decoration-pink"}`}
    >
      {children} ↗
    </a>
  );
}

export function DemoBadge() {
  return <span className="ring-in-gold inline-block rounded-[38px] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-gold">Demo transaction</span>;
}

export function Screen({ children }: { children: ReactNode }) {
  return <section className="relative mx-auto w-full max-w-5xl animate-fade-in px-4 pb-36 pt-8 sm:px-6 sm:pb-32 sm:pt-16">{children}</section>;
}
