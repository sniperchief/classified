import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "../components/ui";
import { config } from "../config";

/* Below the briefing hero: the protocol the agent will perform (game term → Zcash step),
 * then the mission objective and the call to accept. Purely presentational — the CTA
 * reuses the briefing's start(). */

const NETWORK = config.isTestnet ? "Zcash testnet" : "Zcash mainnet";

/* ─────────────── Scroll helpers ─────────────── */

/** One-shot: true once the element has scrolled into view. */
function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/** Fades/slides its children in when scrolled into view. */
function Reveal({ children, delay = 0, className = "", style }: { children: ReactNode; delay?: number; className?: string; style?: CSSProperties }) {
  const [ref, on] = useInView<HTMLDivElement>(0.2);
  return (
    <div ref={ref} className={`reveal ${on ? "is-in" : ""} ${className}`} style={{ "--d": `${delay}ms`, ...style } as CSSProperties}>
      {children}
    </div>
  );
}

/* ─────────────── The protocol ─────────────── */

const PROTOCOL = [
  { k: "Wallet", alias: "Safehouse", line: "Establish your secure digital safehouse.", face: "bg-white", ring: "ring-in-black" },
  { k: "Get ZEC", alias: "Mission funds", line: "Acquire the funds required for the operation.", face: "bg-lemon", ring: "ring-in-gold" },
  { k: "Shield", alias: "Secure the intel", line: "Move the funds into the shielded pool.", face: "bg-lavender", ring: "ring-in-violet" },
  { k: "Send", alias: "Delivery", line: "Deliver the intelligence through a protected transaction.", face: "bg-lavender", ring: "ring-in-violet" },
  { k: "Receive", alias: "Handoff", line: "Complete the secure handoff.", face: "bg-mint", ring: "ring-in-black" },
];

/* ═══════════════ The case file ═══════════════ */

export function Dossier({ onAccept, accepted }: { onAccept: (mode: "live" | "demo") => void; accepted: boolean }) {
  return (
    <section id="incident" className="relative scroll-mt-20 overflow-hidden border-t border-ash">
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28">
        {/* The progression the player performs */}
        <Reveal>
          <div className="label mb-6 text-[11px] text-muted">The protocol, as the agent performs it</div>
        </Reveal>
        <ol className="grid gap-3 md:grid-cols-5 md:gap-4">
          {PROTOCOL.map((p, i) => (
            <li key={p.k} className="flex flex-col items-center md:flex-row md:items-stretch">
              <Reveal delay={i * 140} className="w-full">
                <div
                  className={`tilt flex h-full flex-col rounded-[14px] p-5 text-black ${p.face} ${p.ring}`}
                  style={{ "--tilt": `${[-2, 1.5, -1, 2, -1.5][i]}deg` } as CSSProperties}
                >
                  <span className="font-mono text-[11px] font-bold text-black/50">0{i + 1}</span>
                  <span className="mt-2 font-display text-2xl font-black uppercase leading-none">{p.k}</span>
                  <span className="mt-3 text-[14px] leading-[1.5] text-black/75">{p.line}</span>
                  <span className="label mt-auto pt-4 text-[9px] text-black/50">Codename: {p.alias}</span>
                </div>
              </Reveal>
              {i < PROTOCOL.length - 1 && <span className="py-1 font-mono text-sm text-dim md:hidden">↓</span>}
            </li>
          ))}
        </ol>

        {/* The objective + the call */}
        <Reveal className="mt-20">
          <div className="ring-in-gold tilt mx-auto max-w-3xl rounded-[14px] bg-white p-7 text-center text-black sm:p-10" style={{ "--tilt": "-1deg" } as CSSProperties}>
            <div className="label text-[11px] text-black/55">Mission objective</div>
            <p className="mt-3 font-display text-[26px] font-black leading-[1.15] sm:text-[38px]">Take a complete beginner from zero to their first shielded Zcash transaction.</p>
            <p className="label mt-5 text-[11px] text-black/60">A game first. A Zcash onboarding experience underneath.</p>
          </div>
        </Reveal>

        <Reveal className="mt-16 flex flex-col items-center gap-5 text-center">
          <span className="label text-[11px] text-muted">Agent, your decision</span>
          <Button size="xl" onClick={() => onAccept("live")} disabled={accepted} className="w-full px-14 py-7 text-xl sm:w-auto sm:text-2xl">
            Accept mission →
          </Button>
          <div className="font-mono text-[11px] font-semibold uppercase leading-[1.8] tracking-[0.12em] text-dim">
            <div>{NETWORK} // Training operation // ~5 minutes</div>
            <button className="text-muted underline decoration-dim underline-offset-4 hover:text-white" onClick={() => onAccept("demo")} disabled={accepted}>
              No network? Run demo mode
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
