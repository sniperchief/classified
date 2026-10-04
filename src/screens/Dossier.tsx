import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AgentIcon, EyeIcon, HouseIcon, LockIcon, ShieldIcon } from "../components/icons";
import { Button } from "../components/ui";
import { config } from "../config";

/* The case file: five chapters below the briefing hero that tell the whole story
 * (incident → threat → Zcash → the operation → why it matters) before the agent
 * accepts the mission. Purely presentational — the CTA reuses the briefing's start(). */

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

/** Flips to true `ms` after `on` does — for STANDBY → ACTIVE style beats. */
function useDelayed(on: boolean, ms: number) {
  const [v, setV] = useState(false);
  useEffect(() => {
    if (!on) return;
    const t = setTimeout(() => setV(true), ms);
    return () => clearTimeout(t);
  }, [on, ms]);
  return v;
}

/** Fades/slides its children in when scrolled into view. Also un-redacts any `.xr` inside. */
function Reveal({ children, delay = 0, className = "", style }: { children: ReactNode; delay?: number; className?: string; style?: CSSProperties }) {
  const [ref, on] = useInView<HTMLDivElement>(0.2);
  return (
    <div ref={ref} className={`reveal ${on ? "is-in" : ""} ${className}`} style={{ "--d": `${delay}ms`, ...style } as CSSProperties}>
      {children}
    </div>
  );
}

/** Redacted until revealed. */
const X = ({ children, d = 0 }: { children: ReactNode; d?: number }) => (
  <span className="xr" style={{ "--xd": `${d}ms` } as CSSProperties}>
    {children}
  </span>
);

/* ─────────────── Chapter chrome ─────────────── */

function Chapter({ id, file, title, page, children }: { id: string; file: string; title: string; page: number; children: ReactNode }) {
  return (
    <section id={id} className="relative scroll-mt-20 overflow-hidden border-y border-ash">
      <div aria-hidden className="grid-bg pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28">
        <Reveal>
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ash pb-4">
            <span className="label flex items-center gap-3 text-[11px] text-white">
              <span className="h-2 w-2 rounded-full bg-pink" />
              {title} // {file}
            </span>
            <span className="label text-[10px] text-dim">
              Case file · page {page} of 5 · Top secret
            </span>
          </header>
        </Reveal>
        {children}
      </div>
    </section>
  );
}

const TRANSMISSION_TONE = {
  white: { ring: "ring-in-white", dot: "bg-white" },
  red: { ring: "ring-in-red", dot: "bg-red" },
  violet: { ring: "ring-in-violet", dot: "bg-violet" },
  gold: { ring: "ring-in-gold", dot: "bg-gold" },
  pink: { ring: "ring-in-pink", dot: "bg-pink" },
};

/** The beat between chapters: an intercepted status line. */
function Transmission({ children, tone }: { children: ReactNode; tone: keyof typeof TRANSMISSION_TONE }) {
  const t = TRANSMISSION_TONE[tone];
  return (
    <div className="flex flex-col items-center px-4 py-10 sm:py-14">
      <span className="h-10 w-px bg-ash" />
      <Reveal>
        <div className={`label flex items-center gap-3 rounded-[38px] bg-black px-5 py-2.5 text-center text-[11px] ${t.ring}`}>
          <span className={`h-1.5 w-1.5 shrink-0 animate-blink rounded-full ${t.dot}`} />
          {children}
        </div>
      </Reveal>
      <span className="h-10 w-px bg-ash" />
      <span className="font-mono text-xs text-dim">▼</span>
    </div>
  );
}

/* ═══════════════ 1 — THE INCIDENT ═══════════════ */

function Incident() {
  const [ref, on] = useInView<HTMLDivElement>(0.5);
  const active = useDelayed(on, 900);
  return (
    <Chapter id="incident" file="001" title="Incident report" page={1}>
      <Reveal className="mt-12">
        <h2 className="font-display text-[13vw] font-black leading-[0.9] tracking-[-0.035em] sm:text-[84px] lg:text-[104px]">
          The intelligence
          <br />
          is <span className="text-red">compromised.</span>
        </h2>
      </Reveal>

      <div className="mt-14 grid items-start gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        {/* The report itself */}
        <Reveal delay={100}>
          <article className="ring-in-red tilt rounded-[14px] bg-white p-6 text-black sm:p-9" style={{ "--tilt": "-1deg" } as CSSProperties}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-black pb-4">
              <div>
                <div className="label text-[10px] text-black/50">Central intelligence // field office</div>
                <div className="mt-1 font-mono text-lg font-bold uppercase tracking-[0.08em]">Incident report // 001</div>
              </div>
              <span className="ring-in-red rotate-[-4deg] rounded-[8px] px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-red">Top secret</span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.1em] sm:grid-cols-4">
              {[
                ["Case", "ZC-001"],
                ["Clearance", "Top secret"],
                ["Status", "Active"],
                ["Threat level", "Elevated"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-black/50">{k}</dt>
                  <dd className={`font-bold ${k === "Threat level" ? "text-red" : ""}`}>{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 space-y-4 text-[16px] leading-[1.75] sm:text-[17px]">
              <p>
                A classified USB containing <X d={200}>sensitive state intelligence</X> has fallen into your possession.
              </p>
              <p>
                The information <X d={600}>cannot fall into enemy hands</X>.
              </p>
              <p>
                But there is another problem. <strong className="font-extrabold">The transfer itself could expose you.</strong>
              </p>
              <p>
                Surveillance networks are monitoring the movement of <X d={1000}>funds and information</X>.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-black/15 pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-black/45">
              <span>Ref: USB-07 // ████-██</span>
              <span>Distribution: eyes only</span>
            </div>
          </article>
        </Reveal>

        {/* Surveillance still + handler's orders */}
        <div className="space-y-10">
          <Reveal delay={250}>
            <SurveillanceFeed />
          </Reveal>
          <Reveal delay={400}>
            <div className="ring-in-black tilt rounded-[14px] bg-lemon p-6 text-black" style={{ "--tilt": "2deg" } as CSSProperties}>
              <div className="label text-[10px] text-black/55">Secure message // from your handler</div>
              <p className="mt-3 font-display text-2xl font-black leading-[1.15] sm:text-[28px]">
                “Get the intelligence to the contact. Leave no unnecessary trail.”
              </p>
              <div className="label mt-4 text-[10px] text-black/55">Message will self-destruct</div>
            </div>
          </Reveal>
        </div>
      </div>

      <div ref={ref} className="mt-20 flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className={`reveal ${on ? "is-in" : ""} font-display text-[11vw] font-black leading-[0.95] tracking-[-0.03em] sm:text-6xl lg:text-7xl`}>
          Your mission <span className="text-pink">begins now.</span>
        </div>
        <span className={`label flex shrink-0 items-center gap-2 rounded-[38px] px-4 py-2 text-[11px] transition-colors duration-500 ${active ? "ring-in-pink text-white" : "ring-in-gold text-gold"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-pink" : "animate-blink bg-gold"}`} />
          Operation status: {active ? "Active" : "Standby"}
        </span>
      </div>
    </Chapter>
  );
}

function SurveillanceFeed() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const corner = "absolute h-5 w-5 border-white/70";
  return (
    <figure className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-carbon ring-in-ash">
      <div aria-hidden className="grid-bg absolute inset-0 opacity-70" />
      {/* viewfinder corners */}
      <span className={`${corner} left-3 top-3 border-l-2 border-t-2`} />
      <span className={`${corner} right-3 top-3 border-r-2 border-t-2`} />
      <span className={`${corner} bottom-3 left-3 border-b-2 border-l-2`} />
      <span className={`${corner} bottom-3 right-3 border-b-2 border-r-2`} />

      <div className="absolute left-6 top-6 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-red">
        <span className="h-2 w-2 animate-blink rounded-full bg-red" />
        Rec // Cam 04
      </div>
      <div className="absolute right-6 top-6 font-mono text-[10px] font-bold tracking-[0.12em] text-white/70">{time.toLocaleTimeString("en-GB")}</div>

      {/* the subject: you */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative">
          <AgentIcon className="h-24 w-24 text-white/85 sm:h-28 sm:w-28" />
          <span className="absolute -inset-4 rounded-[6px] border border-red" />
          <span className="label absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red px-2 py-0.5 text-[9px] text-black">Subject: you</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan bg-red" />
      <figcaption className="absolute bottom-6 left-6 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-dim">Evidence B // tracking active</figcaption>
    </figure>
  );
}

/* ═══════════════ 2 — THE THREAT ═══════════════ */

function Threat() {
  const [ref, on] = useInView<HTMLDivElement>(0.2);
  const switched = useDelayed(on, 1800);
  return (
    <Chapter id="threat" file="002" title="Threat assessment" page={2}>
      <Reveal className="mt-12 max-w-4xl">
        <h2 className="font-display text-[11vw] font-black leading-[0.95] tracking-[-0.03em] sm:text-7xl lg:text-[84px]">
          Moving it in the open <span className="text-red">leaves a trail.</span>
        </h2>
        <p className="mt-6 max-w-2xl text-[17px] leading-[1.7] text-white/80">
          On a public ledger, anyone watching can read who sent what, to whom, and when. Forever. For this mission, that trail leads straight back to you.
        </p>
      </Reveal>

      <div ref={ref} className="mt-14">
        {/* Route analysis readout */}
        <div className="mb-5 flex flex-wrap items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          <span className="text-dim">Route analysis:</span>
          <span className={`rounded-[38px] px-3 py-1 transition-all duration-500 ${switched ? "ring-in-ash text-dim line-through" : "ring-in-red text-red"}`}>Public channel</span>
          <span className="text-dim">→</span>
          <span className={`rounded-[38px] px-3 py-1 transition-all duration-500 ${switched ? "ring-in-violet bg-violet/20 text-white" : "ring-in-ash text-dim"}`}>
            {switched ? "Shielded channel // selected" : "Shielded channel"}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ChannelPanel
            on={on}
            dim={switched}
            tone="red"
            name="Public channel"
            verdict="Visible"
            steps={[
              { label: "Agent", icon: <AgentIcon className="h-5 w-5" /> },
              { label: "Transaction", icon: <span className="font-mono text-sm font-bold">⇄</span> },
              { label: "Surveillance", icon: <EyeIcon className="h-5 w-5" /> },
              { label: "Trace", icon: <span className="font-mono text-sm font-bold">!</span> },
            ]}
            rows={[
              ["Sender", "t1Rk7…9fQx"],
              ["Receiver", "t1Mz2…a2Cw"],
              ["Amount", `0.05 ${config.ticker}`],
              ["Record", "Permanent"],
            ]}
            caption="Everything on a transparent transaction trail can be read and linked back to you."
          />
          <ChannelPanel
            on={on}
            dim={false}
            tone="violet"
            name="Shielded channel"
            verdict="Protected"
            steps={[
              { label: "Agent", icon: <AgentIcon className="h-5 w-5" /> },
              { label: "Shielded", icon: <LockIcon className="h-5 w-5" /> },
              { label: "Private transfer", icon: <ShieldIcon className="h-5 w-5" /> },
              { label: "Contact", icon: <span className="font-mono text-sm font-bold">✓</span> },
            ]}
            rows={[
              ["Sender", null],
              ["Receiver", null],
              ["Amount", null],
              ["Readable by", "You + your contact"],
            ]}
            caption="The transaction is still verified on the network, but its details are encrypted."
          />
        </div>
      </div>

      <Reveal className="mt-16 max-w-3xl border-l-2 border-pink pl-6">
        <p className="text-[17px] leading-[1.7] text-white/80 sm:text-lg">In this mission, you are not just moving value.</p>
        <p className="mt-2 font-display text-2xl font-black leading-[1.2] sm:text-[32px]">
          You are learning how Zcash can protect the details of a transaction using its <span className="text-lavender">shielded</span> system.
        </p>
      </Reveal>
    </Chapter>
  );
}

function ChannelPanel({
  on,
  dim,
  tone,
  name,
  verdict,
  steps,
  rows,
  caption,
}: {
  on: boolean;
  dim: boolean;
  tone: "red" | "violet";
  name: string;
  verdict: string;
  steps: { label: string; icon: ReactNode }[];
  rows: [string, string | null][];
  caption: string;
}) {
  const red = tone === "red";
  const accent = red ? "text-red" : "text-lavender";
  const ring = red ? "ring-in-red" : "ring-in-violet";
  const base = red ? 0 : 900; // the shielded route lights up after the public one is traced
  return (
    <div className={`relative overflow-hidden rounded-[14px] bg-black p-6 transition-opacity duration-700 sm:p-7 ${ring} ${dim ? "opacity-60" : ""} ${on ? "is-in" : ""}`}>
      {red && <div className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan bg-red" />}
      <div className="flex items-center justify-between">
        <span className={`label text-[11px] ${accent}`}>{name}</span>
        <span className={`label rotate-[-3deg] rounded-[38px] px-3 py-1 text-[11px] ${ring} ${red ? "text-red" : "bg-violet/20 text-white"}`}>{verdict}</span>
      </div>

      <ol className="mt-6 space-y-1">
        {steps.map((s, i) => (
          <li key={s.label} className="seq" style={{ "--d": `${base + i * 220}ms` } as CSSProperties}>
            <div className="flex items-center gap-4">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[8px] ${i === steps.length - 1 ? (red ? "bg-red text-black" : "bg-violet text-white") : `${ring} text-white`}`}>
                {s.icon}
              </span>
              <span className={`font-mono text-sm font-bold uppercase tracking-[0.12em] ${i === steps.length - 1 ? accent : "text-white"}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`ml-5 h-4 w-px ${red ? "bg-red/60" : "bg-violet"}`} />}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-[10px] bg-carbon p-4">
        <div className="label mb-2 text-[10px] text-dim">What surveillance can read</div>
        <dl className="space-y-1.5 font-mono text-[12px] uppercase tracking-[0.08em]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-muted">{k}</dt>
              <dd className={`font-bold ${v === null ? "text-lavender" : red ? "text-red" : "text-white"}`}>
                {v === null ? (
                  <span>
                    <span className="redact mr-2 text-lavender/70">██████</span>Encrypted
                  </span>
                ) : (
                  v
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-4 text-sm leading-[1.6] text-muted">{caption}</p>
    </div>
  );
}

/* ═══════════════ 3 — WHY ZCASH ═══════════════ */

const PROTOCOL = [
  { k: "Wallet", alias: "Safehouse", line: "Establish your secure digital safehouse.", face: "bg-white", ring: "ring-in-black" },
  { k: "Get ZEC", alias: "Mission funds", line: "Acquire the funds required for the operation.", face: "bg-lemon", ring: "ring-in-gold" },
  { k: "Shield", alias: "Secure the intel", line: "Move the funds into the shielded pool.", face: "bg-lavender", ring: "ring-in-violet" },
  { k: "Send", alias: "Delivery", line: "Deliver the intelligence through a protected transaction.", face: "bg-lavender", ring: "ring-in-violet" },
  { k: "Receive", alias: "Handoff", line: "Complete the secure handoff.", face: "bg-mint", ring: "ring-in-black" },
];

const CODEBOOK: [string, string][] = [
  ["Safehouse", "Wallet"],
  ["Mission funds", "ZEC"],
  ["Securing the intelligence", "Shielding"],
  ["Delivery", "Transaction"],
  ["Contact", "Recipient"],
  ["Successful handoff", "Confirmation"],
];

function WhyZcash() {
  return (
    <Chapter id="zcash" file="003" title="Protocol identified" page={3}>
      <div className="mt-12 grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <Reveal>
          <div className="label text-[11px] text-lavender">Zcash // shielded transactions</div>
          <h2 className="mt-4 font-display text-[11vw] font-black leading-[0.95] tracking-[-0.03em] sm:text-7xl lg:text-[76px]">The technology behind the mission.</h2>
          <p className="mt-6 max-w-xl text-[17px] leading-[1.7] text-white/85 sm:text-lg">
            Zcash gives users the ability to make <span className="font-extrabold text-white">shielded transactions</span> that protect sensitive transaction
            information — who sent it, who received it, and how much.
          </p>

          {/* Codebook: game term ↔ real Zcash concept */}
          <div className="mt-8 max-w-xl rounded-[14px] border border-ash bg-black p-5">
            <div className="label mb-3 flex justify-between text-[10px] text-dim">
              <span>Field codebook</span>
              <span>Mission term → Zcash</span>
            </div>
            <dl className="grid gap-x-6 gap-y-2 font-mono text-[12px] uppercase tracking-[0.08em] sm:grid-cols-2">
              {CODEBOOK.map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 border-b border-ash/70 pb-1.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-bold text-white">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <ShieldTransform />
        </Reveal>
      </div>

      {/* The progression the player performs */}
      <div className="mt-20">
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
      </div>

      <Reveal className="mt-20">
        <blockquote className="mx-auto max-w-4xl text-center font-display text-[28px] font-black leading-[1.15] tracking-[-0.01em] sm:text-[42px]">
          Instead of explaining privacy first and asking the user to understand it later,{" "}
          <span className="text-pink">CLASSIFIED makes the user experience it.</span>
        </blockquote>
      </Reveal>
    </Chapter>
  );
}

/** The USB goes from exposed to shielded as it scrolls into view. */
function ShieldTransform() {
  const [ref, on] = useInView<HTMLDivElement>(0.6);
  const shielded = useDelayed(on, 700);
  return (
    <div ref={ref} className={`relative overflow-hidden rounded-[14px] bg-carbon p-6 transition-shadow duration-700 sm:p-7 ${shielded ? "ring-in-violet" : "ring-in-red"}`}>
      <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
        <span className="text-muted">Evidence // USB-07</span>
        <span className={`flex items-center gap-2 transition-colors duration-500 ${shielded ? "text-lavender" : "text-red"}`}>
          <span className={`h-2 w-2 rounded-full ${shielded ? "bg-violet" : "animate-blink bg-red"}`} />
          {shielded ? "Shielded" : "Exposed"}
        </span>
      </div>

      <div className="relative mt-5 grid h-60 place-items-center rounded-[10px] bg-black ring-in-ash sm:h-72">
        <svg viewBox="0 0 240 120" className={`w-[72%] transition-all duration-700 ${shielded ? "scale-90 opacity-40" : ""}`} aria-label="Classified USB drive">
          <rect x="10" y="38" width="44" height="44" rx="3" fill="none" stroke="#fff" strokeWidth="3" />
          <rect x="52" y="26" width="168" height="68" rx="12" fill="#fff" />
          <rect x="72" y="40" width="102" height="40" rx="4" fill="#000" />
          <text x="123" y="65" textAnchor="middle" fontFamily="Source Code Pro, monospace" fontWeight="700" fontSize="12" fill={shielded ? "#ede5ff" : "#fe2f2f"} letterSpacing="2">
            {shielded ? "████████" : "TS/SCI"}
          </text>
          <circle cx="198" cy="60" r="5" fill={shielded ? "#7333f1" : "#fe2f2f"} />
        </svg>

        {/* shield closing over it */}
        <div className={`absolute inset-0 grid place-items-center transition-all duration-700 ${shielded ? "scale-100 opacity-100" : "scale-150 opacity-0"}`}>
          <div className="relative">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-violet/30" />
            <ShieldIcon className="relative h-32 w-32 text-lavender sm:h-36 sm:w-36" />
          </div>
        </div>
        {!shielded && <div className="pointer-events-none absolute inset-x-3 top-0 h-px animate-scan bg-red" />}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.1em]">
        <TransformRow k="Sender" shielded={shielded} />
        <TransformRow k="Receiver" shielded={shielded} />
        <TransformRow k="Amount" shielded={shielded} />
        <div>
          <dt className="text-dim">Pool</dt>
          <dd className={`mt-0.5 font-bold ${shielded ? "text-lavender" : "text-red"}`}>{shielded ? "Shielded" : "Transparent"}</dd>
        </div>
      </dl>
    </div>
  );
}

function TransformRow({ k, shielded }: { k: string; shielded: boolean }) {
  return (
    <div>
      <dt className="text-dim">{k}</dt>
      <dd className={`mt-0.5 font-bold ${shielded ? "text-lavender" : "text-red"}`}>{shielded ? "Encrypted" : "Visible"}</dd>
    </div>
  );
}

/* ═══════════════ 4 — THE OPERATION ═══════════════ */

const STAGES = [
  {
    code: "01",
    name: "Safehouse",
    objective: "Establish your secure wallet.",
    field: "Generate a Zcash wallet right in your browser and guard its 24-word recovery codes.",
    skill: "Set up a wallet",
    icon: <HouseIcon className="h-6 w-6" />,
  },
  {
    code: "02",
    name: "Acquire",
    objective: "Get the ZEC required for the operation.",
    field: "Give your handler your public drop point and receive mission funds from a faucet.",
    skill: "Get ZEC",
    icon: <span className="font-display text-lg font-black">Z</span>,
  },
  {
    code: "03",
    name: "Shield",
    objective: "Protect the funds using Zcash's shielded system.",
    field: "Sign a real shielding transaction that moves your funds into the shielded pool.",
    skill: "Shield ZEC",
    icon: <LockIcon className="h-6 w-6" />,
  },
  {
    code: "04",
    name: "Infiltrate",
    objective: "Move the funds through the protected channel.",
    field: "Two channels, one card to play. Pick public and surveillance sees everything.",
    skill: "Choose a private route",
    icon: <ShieldIcon className="h-6 w-6" />,
  },
  {
    code: "05",
    name: "Handoff",
    objective: "Send the transaction and confirm the recipient receives it.",
    field: "Send a shielded transaction to your contact and watch the delivery confirm.",
    skill: "Send & receive privately",
    icon: <span className="font-mono text-lg font-bold">✓</span>,
  },
];

function Operation() {
  return (
    <Chapter id="operation" file="004" title="Mission control" page={4}>
      <div className="mt-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <Reveal>
          <div className="label text-[11px] text-muted">Operation plan // what the agent does</div>
          <h2 className="mt-4 font-display text-[13vw] font-black leading-[0.9] tracking-[-0.035em] sm:text-[84px] lg:text-[100px]">
            Operation
            <br />
            <span className="text-pink">Classified.</span>
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <dl className="grid grid-cols-3 overflow-hidden rounded-[14px] border border-ash font-mono text-[11px] uppercase tracking-[0.1em]">
            {[
              ["Stages", "5"],
              ["Duration", "~5 min"],
              ["Network", config.isTestnet ? "Testnet" : "Mainnet"],
            ].map(([k, v], i) => (
              <div key={k} className={`px-4 py-3 ${i < 2 ? "border-r border-ash" : ""}`}>
                <dt className="text-[9px] text-dim">{k}</dt>
                <dd className="mt-1 font-bold text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <ol className="mt-14">
        {STAGES.map((s, i) => (
          <Stage key={s.code} stage={s} last={i === STAGES.length - 1} />
        ))}
      </ol>

      <Reveal className="mt-10">
        <p className="max-w-3xl font-mono text-[12px] uppercase leading-[1.9] tracking-[0.1em] text-muted">
          Every stage is a real step on {NETWORK}: a real wallet, real transactions you can check on a block explorer.{" "}
          <span className="text-dim">No network? A demo mode simulates it.</span>
        </p>
      </Reveal>
    </Chapter>
  );
}

function Stage({ stage, last }: { stage: (typeof STAGES)[number]; last: boolean }) {
  const [ref, on] = useInView<HTMLLIElement>(0.55);
  const online = useDelayed(on, 350);
  return (
    <li ref={ref} className="grid grid-cols-[48px_1fr] gap-4 sm:grid-cols-[64px_1fr] sm:gap-8">
      {/* timeline rail */}
      <div className="flex flex-col items-center">
        <span
          className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-[10px] transition-all duration-500 sm:h-14 sm:w-14 ${
            online ? "bg-pink text-white" : "card-back ring-in-ash text-dim"
          }`}
        >
          {online && <span className="absolute inset-0 animate-pulse-ring rounded-[10px] ring-in-pink" />}
          {stage.icon}
        </span>
        {!last && (
          <span className="relative w-px flex-1 bg-ash">
            <span className={`absolute inset-x-0 top-0 bg-pink transition-all duration-1000 ${online ? "h-full" : "h-0"}`} />
          </span>
        )}
      </div>

      {/* stage card */}
      <div className={`pb-10 transition-all duration-700 sm:pb-14 ${on ? "translate-x-0 opacity-100" : "translate-x-6 opacity-30"}`}>
        <div className={`rounded-[14px] bg-black p-5 transition-shadow duration-500 sm:p-7 ${online ? "ring-in-white" : "ring-in-ash"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono text-2xl font-bold uppercase tracking-[0.06em] sm:text-3xl">
              <span className="text-pink">{stage.code}</span> <span className="text-dim">//</span> {stage.name}
            </div>
            <span className={`label rounded-[38px] px-3 py-1 text-[10px] transition-colors duration-500 ${online ? "ring-in-pink text-pink" : "ring-in-ash text-dim"}`}>
              {online ? "● Online" : "Standby"}
            </span>
          </div>
          <p className="mt-3 font-display text-xl font-extrabold leading-snug sm:text-2xl">{stage.objective}</p>
          <div className="mt-4 grid gap-4 border-t border-ash pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <p className="text-[15px] leading-[1.65] text-muted">
              <span className="label mr-2 text-[10px] text-white">In the field:</span>
              {stage.field}
            </p>
            <span className="label ring-in-gold w-fit rounded-[38px] px-3 py-1 text-[10px] text-gold">Skill: {stage.skill}</span>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ═══════════════ 5 — FINAL BRIEFING ═══════════════ */

const JOURNEY = ["From zero", "Wallet", "ZEC", "Shield", "Private transfer", "First shielded transaction"];

function FinalBriefing({ onAccept, accepted }: { onAccept: (mode: "live" | "demo") => void; accepted: boolean }) {
  return (
    <Chapter id="final-briefing" file="005" title="Final briefing" page={5}>
      <Reveal className="mt-12">
        <h2 className="font-display text-[12vw] font-black leading-[0.92] tracking-[-0.035em] sm:text-[80px] lg:text-[108px]">
          You don't learn Zcash.
          <br />
          <span className="text-pink">You complete a mission.</span>
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal delay={100}>
          <p className="text-[17px] leading-[1.75] text-white/85 sm:text-lg">CLASSIFIED turns the fundamentals of Zcash into a short interactive spy mission.</p>
          <p className="mt-4 text-[17px] leading-[1.75] text-muted sm:text-lg">
            Instead of asking newcomers to read documentation, understand cryptography, or navigate a complicated crypto interface, the player learns by{" "}
            <span className="text-white">completing a mission</span>.
          </p>
        </Reveal>

        <Reveal delay={200}>
          <ol className="flex flex-col items-start gap-1">
            {JOURNEY.map((j, i) => {
              const final = i === JOURNEY.length - 1;
              return (
                <li key={j} className="seq flex flex-col items-start" style={{ "--d": `${i * 180}ms` } as CSSProperties}>
                  <span
                    className={`label rounded-[38px] px-4 py-1.5 text-[11px] ${
                      final ? "ring-in-violet bg-violet text-white" : i === 0 ? "ring-in-ash text-dim" : "ring-in-white text-white"
                    }`}
                  >
                    {final && "🔒 "}
                    {j}
                  </span>
                  {!final && <span className="ml-5 font-mono text-xs leading-5 text-dim">↓</span>}
                </li>
              );
            })}
          </ol>
        </Reveal>
      </div>

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
    </Chapter>
  );
}

/* ═══════════════ The full case file ═══════════════ */

export function Dossier({ onAccept, accepted }: { onAccept: (mode: "live" | "demo") => void; accepted: boolean }) {
  return (
    <div className="relative">
      <Transmission tone="white">Incoming // incident report</Transmission>
      <Incident />
      <Transmission tone="red">Alert // surveillance detected</Transmission>
      <Threat />
      <Transmission tone="violet">Secure channel required // Zcash protocol identified</Transmission>
      <WhyZcash />
      <Transmission tone="gold">Mission plan loaded</Transmission>
      <Operation />
      <Transmission tone="pink">Awaiting agent confirmation</Transmission>
      <FinalBriefing onAccept={onAccept} accepted={accepted} />
      <div className="h-16" />
    </div>
  );
}
