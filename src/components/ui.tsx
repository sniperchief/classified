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
    md: "px-6 py-3 text-xs",
    lg: "px-9 py-4 text-sm",
    xl: "px-12 py-6 text-lg",
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
      className={`inline-flex items-center justify-center gap-3 rounded-[38px] font-mono font-bold uppercase tracking-[0.12em] transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-35 ${sizes[size]} ${styles[variant]} ${className}`}
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

export function MissionTitle({ code, title, accent, status = "ACTIVE" }: { code: string; title: string; accent?: string; status?: string }) {
  const parts = accent ? title.split(accent) : [title];
  return (
    <header className="animate-fade-up">
      <div className="label flex items-center gap-3 text-muted">
        <span className="flex items-center gap-2 text-white">
          <span className="h-2 w-2 rounded-full bg-pink" />
          MISSION {code}
        </span>
        <span>// {status}</span>
      </div>
      <h1 className="mt-4 font-display text-[44px] font-black leading-[0.98] tracking-[-0.02em] sm:text-[65px] lg:text-[80px]">
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
    </header>
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

export function CopyField({ label, value, tone = "white" }: { label: string; value: string; tone?: "white" | "red" | "violet" }) {
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

/** "Field manual" card: a one-or-two sentence explainer with optional deeper detail. */
export function Explain({ term, children, more, tilt = -1 }: { term: string; children: ReactNode; more?: ReactNode; tilt?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <PlayingCard face="white" accent="gold" tilt={tilt} deal delay={150} className="max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <span className="label text-black/60">Field manual</span>
        <span className="font-mono text-xs font-bold text-black/40">★</span>
      </div>
      <div className="mt-2 font-display text-xl font-extrabold leading-tight sm:text-2xl">{term}</div>
      <p className="mt-2 text-[15px] leading-[1.7] text-black/80 sm:text-base">{children}</p>
      {more && (
        <>
          <button className="label mt-3 text-black/50 hover:text-black" onClick={() => setOpen(!open)}>
            {open ? "− Less" : "+ Technical detail"}
          </button>
          {open && <div className="mt-2 text-sm leading-[1.7] text-black/70">{more}</div>}
        </>
      )}
    </PlayingCard>
  );
}

export function Check({ children, done = true, dark = false }: { children: ReactNode; done?: boolean; dark?: boolean }) {
  const on = dark ? "bg-black text-white" : "bg-white text-black";
  const off = dark ? "ring-in-black text-transparent" : "ring-in-white text-transparent opacity-40";
  return (
    <div className="flex items-center gap-3 font-mono text-sm font-semibold uppercase tracking-[0.06em]">
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-[4px] text-xs font-bold ${done ? on : off}`}>✓</span>
      <span className={done ? "" : "opacity-40"}>{children}</span>
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
  return <section className="relative mx-auto w-full max-w-5xl animate-fade-in px-4 pb-32 pt-10 sm:px-6 sm:pt-16">{children}</section>;
}
