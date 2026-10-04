import { useEffect, useState, type CSSProperties } from "react";
import { CardScatter } from "../components/CardScatter";
import { Button, Typewriter } from "../components/ui";
import { config } from "../config";
import { MISSIONS, useGame } from "../game/state";
import { sfx } from "../lib/sound";
import { Dossier } from "./Dossier";

const BOOT_KEY = "classified.booted";

/** What each mission actually teaches — shown small, never as a lecture. */
const SKILL: Record<string, string> = {
  safehouse: "Wallet",
  acquire: "Get ZEC",
  shield: "Shield",
  infiltrate: "Send privately",
  handoff: "Receive",
};

export function Briefing() {
  const { go, setMode } = useGame();
  const [booting, setBooting] = useState(() => {
    try {
      return sessionStorage.getItem(BOOT_KEY) !== "1";
    } catch {
      return false;
    }
  });
  const [accepted, setAccepted] = useState(false);

  const start = (mode: "live" | "demo") => {
    if (accepted) return;
    sfx.confirm();
    setAccepted(true);
    // Brief "mission accepted" beat, then straight into Mission 01.
    setTimeout(() => {
      setMode(mode);
      go("safehouse");
    }, 750);
  };

  return (
    <section className="relative min-h-[calc(100dvh-64px)]">
      {booting && <BootSequence onDone={() => setBooting(false)} />}
      {accepted && <AcceptedFlash />}

      {!booting && (
        <>
          <div className="relative overflow-hidden">
            <div className="opacity-60">
              <CardScatter variant="hero" />
            </div>

            <div className="relative mx-auto max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
              <MetaStrip />

              <div className="mt-8 grid items-center gap-10 lg:mt-12 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
                {/* ── Briefing ── */}
                <div className="order-1">
                  <h1 className="animate-fade-up font-display text-[20vw] font-black leading-[0.86] tracking-[-0.045em] sm:text-[124px] lg:text-[132px]">
                    Classified.
                  </h1>

                  <div className="mt-6 min-h-[2.2em]">
                    <Typewriter
                      lines={["AGENT, WE HAVE A SITUATION."]}
                      speed={34}
                      prompt={false}
                      className="font-display text-[26px] font-black leading-[1.07] text-white sm:text-[40px]"
                    />
                  </div>

                  <p className="mt-5 max-w-xl animate-fade-up text-[17px] leading-[1.7] text-white/85 [animation-delay:900ms] sm:text-lg">
                    A classified USB drive containing sensitive state intelligence has fallen into your possession. Enemy surveillance is already
                    looking for it.
                  </p>

                  <p className="mt-6 animate-fade-up font-mono text-base font-bold uppercase tracking-[0.14em] [animation-delay:1200ms] sm:text-lg">
                    Secure it. <span className="text-pink">Shield it.</span> Deliver it.
                  </p>

                  <div className="mt-8 flex animate-fade-up flex-col gap-4 [animation-delay:1400ms] sm:flex-row sm:items-center">
                    <Button size="xl" onClick={() => start("live")} disabled={accepted} className="w-full sm:w-auto">
                      Accept mission →
                    </Button>
                    <div className="font-mono text-[11px] font-semibold uppercase leading-[1.8] tracking-[0.12em] text-dim">
                      <div>{config.isTestnet ? "Zcash testnet" : "Zcash"} // Training operation</div>
                      <button className="text-muted underline decoration-dim underline-offset-4 hover:text-white" onClick={() => start("demo")}>
                        No network? Run demo mode
                      </button>
                    </div>
                  </div>

                  <p className="mt-8 max-w-md animate-fade-up border-l-2 border-pink pl-4 text-[15px] leading-[1.6] text-muted [animation-delay:1600ms]">
                    You won't read a manual. You'll learn Zcash the way an agent learns a secure system — <span className="text-white">by using it</span>.
                  </p>
                </div>

                {/* ── Central prop: the USB in an evidence case ── */}
                <div className="order-2 flex justify-center">
                  <EvidenceCase />
                </div>
              </div>

              <ObjectiveTracker />
              <CaseFileCue />
            </div>
          </div>

          <Dossier onAccept={start} accepted={accepted} />
        </>
      )}
    </section>
  );
}

/* ─────────────── Boot: CIA secure terminal ─────────────── */

function BootSequence({ onDone }: { onDone: () => void }) {
  const LINES = ["CIA SECURE TERMINAL v7.3", "INITIALIZING SECURE CHANNEL...", "VERIFYING CLEARANCE...  OK", "ACCESS GRANTED"];
  const [n, setN] = useState(0);
  const [title, setTitle] = useState(false);

  useEffect(() => {
    const finish = () => {
      try {
        sessionStorage.setItem(BOOT_KEY, "1");
      } catch {
        /* ignore */
      }
      onDone();
    };
    const timers = [
      ...LINES.map((_, i) => setTimeout(() => (setN(i + 1), sfx.tick()), 120 + i * 300)),
      setTimeout(() => setTitle(true), 1450),
      setTimeout(finish, 2300),
    ];
    const skip = () => {
      timers.forEach(clearTimeout);
      finish();
    };
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-[80] flex cursor-pointer flex-col items-center justify-center bg-black px-6">
      {!title ? (
        <div className="w-full max-w-md font-mono text-sm leading-[2] text-white/85">
          {LINES.slice(0, n).map((l, i) => (
            <div key={i} className={i === LINES.length - 1 ? "font-bold text-pink" : ""}>
              <span className="mr-3 text-dim">{String(i).padStart(2, "0")}</span>
              {l}
            </div>
          ))}
          <span className="inline-block h-[1.1em] w-[0.6em] animate-blink bg-white align-middle" />
        </div>
      ) : (
        <div className="animate-fade-in text-center">
          <div className="label text-muted">Operation</div>
          <div className="mt-3 font-display text-6xl font-black tracking-[-0.03em] sm:text-8xl">CLASSIFIED</div>
        </div>
      )}
      <div className="label absolute bottom-8 text-[10px] text-dim">Click or press any key to skip</div>
    </div>
  );
}

function AcceptedFlash() {
  return (
    <div className="fixed inset-0 z-[80] grid animate-fade-in place-items-center bg-black/85">
      <div className="ring-in-pink animate-deal rounded-[14px] bg-white px-10 py-8 text-center text-black" style={{ "--tilt": "-4deg" } as CSSProperties}>
        <div className="label text-pink">Operation active</div>
        <div className="mt-2 font-display text-5xl font-black leading-none sm:text-6xl">Mission accepted.</div>
        <div className="label mt-4 text-[11px] text-black/60">Proceeding to 01 // Safehouse</div>
      </div>
    </div>
  );
}

/** Points first-time visitors (and judges) down into the case file. */
function CaseFileCue() {
  return (
    <a
      href="#incident"
      className="group mt-12 flex animate-fade-up flex-col items-center gap-2 text-center [animation-delay:2000ms]"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById("incident")?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      <span className="label text-[11px] text-muted group-hover:text-white">Read the case file</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-dim">What this operation is, in 60 seconds</span>
      <span className="mt-1 animate-float font-mono text-lg text-pink">▼</span>
    </a>
  );
}

/* ─────────────── HUD pieces ─────────────── */

function MetaStrip() {
  const items: { k: string; v: React.ReactNode }[] = [
    { k: "Operation", v: "Classified" },
    {
      k: "Status",
      v: (
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-gold" />
          Awaiting agent
        </span>
      ),
    },
    { k: "Threat level", v: <span className="text-red">Elevated</span> },
    { k: "Location", v: <span className="redact text-white/70">██████</span> },
    { k: "Intelligence", v: "Highly sensitive" },
  ];
  return (
    <div className="grid animate-fade-in grid-cols-2 overflow-hidden rounded-[14px] border border-ash sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it, i) => (
        <div key={it.k} className={`border-ash px-4 py-3 ${i < items.length - 1 ? "border-b lg:border-b-0 lg:border-r" : ""} ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}>
          <div className="label text-[9px] text-dim">{it.k}</div>
          <div className="mt-1 font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-white">{it.v}</div>
        </div>
      ))}
    </div>
  );
}

function ObjectiveTracker() {
  return (
    <div className="mt-14 animate-fade-up [animation-delay:1800ms]">
      <div className="mb-3 flex items-center justify-between">
        <span className="label text-[10px] text-muted">Operation objectives</span>
        <span className="label text-[10px] text-dim">
          Operation status: <span className="text-gold">Standby</span>
        </span>
      </div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {MISSIONS.map((m, i) => {
          const next = i === 0;
          return (
            <li
              key={m.step}
              className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 ${next ? "ring-in-pink bg-black" : "ring-in-ash bg-black"} ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-[4px] font-mono text-[10px] font-bold ${next ? "bg-pink text-white" : "ring-in-ash text-dim"}`}>
                {m.code}
              </span>
              <div className="min-w-0">
                <div className={`font-mono text-[11px] font-bold uppercase tracking-[0.08em] ${next ? "text-white" : "text-white/70"}`}>
                  {m.step === "acquire" ? "Acquire ZEC" : m.name}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-dim">
                  {next ? <span className="text-pink">◀ Next · </span> : null}
                  {SKILL[m.step]}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ─────────────── The prop: classified USB in an evidence case ─────────────── */

function EvidenceCase() {
  return (
    <div className="relative w-full max-w-[440px] animate-deal [animation-delay:500ms]" style={{ "--tilt": "2deg" } as CSSProperties}>
      {/* Case */}
      <div className="ring-in-white relative overflow-hidden rounded-[14px] bg-carbon p-5 sm:p-6">
        <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
          <span className="text-muted">Evidence // CL-0x5EC-07</span>
          <span className="flex items-center gap-2 text-red">
            <span className="h-2 w-2 animate-blink rounded-full bg-red" />
            Unsecured
          </span>
        </div>

        {/* USB on foam */}
        <div className="relative mt-4 grid h-56 place-items-center rounded-[10px] bg-black ring-in-ash sm:h-64">
          <UsbDrive />
          {/* document scan sweep */}
          <div className="pointer-events-none absolute inset-x-3 top-0 h-px animate-scan bg-pink" />
          <div
            className="ring-in-red absolute right-4 top-4 animate-deal rounded-[8px] bg-black px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-red [animation-delay:1100ms]"
            style={{ "--tilt": "-9deg" } as CSSProperties}
          >
            Top secret
          </div>
        </div>

        {/* Readouts */}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.1em]">
          <Readout k="Contents" v={<span className="redact">████████</span>} />
          <Readout k="Classification" v="TS/SCI" />
          <Readout k="Encryption" v={<span className="text-red">None</span>} />
          <Readout k="Transfer status" v={<span className="text-red">Exposed</span>} />
        </dl>
      </div>

      {/* Evidence tag, clipped to the case like a card */}
      <div
        className="ring-in-black absolute -bottom-6 -left-4 w-44 animate-deal rounded-[10px] bg-lemon p-3 text-black [animation-delay:800ms] sm:-left-8"
        style={{ "--tilt": "-7deg" } as CSSProperties}
      >
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-black/60">Intelligence file</div>
        <div className="mt-1 font-display text-lg font-black leading-tight">Handle with care.</div>
        <div className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em]">Deliver unseen</div>
      </div>
    </div>
  );
}

function Readout({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-dim">{k}</dt>
      <dd className="mt-0.5 font-bold text-white">{v}</dd>
    </div>
  );
}

function UsbDrive() {
  return (
    <svg viewBox="0 0 240 120" className="w-[78%] animate-float" style={{ "--tilt": "-8deg" } as CSSProperties} aria-label="Classified USB drive">
      {/* connector */}
      <rect x="10" y="38" width="44" height="44" rx="3" fill="none" stroke="#fff" strokeWidth="3" />
      <rect x="20" y="50" width="9" height="7" fill="#fff" />
      <rect x="20" y="63" width="9" height="7" fill="#fff" />
      {/* body */}
      <rect x="52" y="26" width="168" height="68" rx="12" fill="#fff" />
      {/* label */}
      <rect x="72" y="40" width="102" height="40" rx="4" fill="#000" />
      <text x="123" y="58" textAnchor="middle" fontFamily="Source Code Pro, monospace" fontWeight="700" fontSize="12" fill="#fe2f2f" letterSpacing="2">
        TS/SCI
      </text>
      <text x="123" y="73" textAnchor="middle" fontFamily="Source Code Pro, monospace" fontWeight="700" fontSize="8" fill="#fff" letterSpacing="1.5">
        USB-07 // ████
      </text>
      {/* activity LED */}
      <circle cx="198" cy="60" r="5" fill="#fe2f2f">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
      </circle>
      {/* lanyard hole */}
      <circle cx="198" cy="40" r="4" fill="none" stroke="#000" strokeWidth="2" />
    </svg>
  );
}
