import { useEffect, useState, type CSSProperties } from "react";
import { Button, Typewriter } from "../components/ui";
import { config } from "../config";
import { useGame } from "../game/state";
import { sfx } from "../lib/sound";
import { Dossier } from "./Dossier";

const BOOT_KEY = "classified.booted";

export function Briefing() {
  const { go, setMode, progress, update } = useGame();
  const resume = progress.resume;
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
      if (resume) {
        // Resuming keeps the run's mode (live or demo) — only a fresh start can switch it.
        update({ resume: undefined });
        go(resume);
      } else {
        setMode(mode);
        go("safehouse");
      }
    }, 750);
  };

  return (
    <section className="relative">
      {booting && <BootSequence onDone={() => setBooting(false)} />}
      {accepted && <AcceptedFlash resuming={!!resume} />}

      {!booting && (
        <>
          <div className="mx-auto max-w-[1100px] px-4 pb-14 pt-8 sm:px-6 sm:pt-14">
            <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
              <div>
                <h1 className="animate-fade-up font-display text-[19vw] font-black leading-[0.88] tracking-[-0.045em] sm:text-[112px] lg:text-[124px]">
                  Classified.
                </h1>

                <div className="mt-5 min-h-[2.3em] sm:mt-6">
                  <Typewriter
                    lines={["AGENT, WE HAVE A SITUATION."]}
                    speed={34}
                    prompt={false}
                    className="font-display text-[24px] font-black leading-[1.1] text-white sm:text-[36px]"
                  />
                </div>

                <p className="mt-4 max-w-lg animate-fade-up text-[16px] leading-[1.7] text-white/80 [animation-delay:900ms] sm:text-lg">
                  A classified USB drive with sensitive state intelligence is in your hands. Enemy surveillance is already looking for it.
                </p>

                <p className="mt-6 animate-fade-up font-mono text-sm font-bold uppercase tracking-[0.14em] [animation-delay:1100ms] sm:text-base">
                  Secure it. <span className="text-pink">Shield it.</span> Deliver it.
                </p>

                <div className="mt-8 animate-fade-up [animation-delay:1300ms]">
                  <Button size="xl" onClick={() => start("live")} disabled={accepted} className="w-full sm:w-auto">
                    {resume ? "Resume mission →" : "Accept mission →"}
                  </Button>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-dim">
                    <span>~5 min · {config.isTestnet ? "Zcash testnet" : "Zcash"} · No real money</span>
                    <button className="text-muted underline decoration-dim underline-offset-4 hover:text-white" onClick={() => start("demo")}>
                      Demo mode
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <EvidenceCase />
              </div>
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
          <div className="mt-3 font-display text-[13vw] font-black tracking-[-0.03em] sm:text-8xl">CLASSIFIED</div>
        </div>
      )}
      <div className="label absolute bottom-8 text-[10px] text-dim">Click or press any key to skip</div>
    </div>
  );
}

function AcceptedFlash({ resuming }: { resuming: boolean }) {
  return (
    <div className="fixed inset-0 z-[80] grid animate-fade-in place-items-center bg-black/85 px-4">
      <div className="ring-in-pink animate-deal rounded-[14px] bg-white px-6 py-7 text-center text-black sm:px-10 sm:py-8" style={{ "--tilt": "-4deg" } as CSSProperties}>
        <div className="label text-pink">Operation active</div>
        <div className="mt-2 font-display text-4xl font-black leading-none sm:text-6xl">{resuming ? "Welcome back." : "Mission accepted."}</div>
        <div className="label mt-4 text-[11px] text-black/60">{resuming ? "Resuming your operation" : "Proceeding to 01 // Safehouse"}</div>
      </div>
    </div>
  );
}

/* ─────────────── HUD pieces ─────────────── */

/* ─────────────── The prop: classified USB in an evidence case ─────────────── */

function EvidenceCase() {
  return (
    <div className="ring-in-white w-full max-w-[420px] animate-fade-up rounded-[14px] bg-carbon p-5 [animation-delay:500ms] sm:p-6">
      <div className="flex items-center justify-between gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
        <span className="text-muted">Evidence // USB-07</span>
        <span className="flex items-center gap-2 text-red">
          <span className="h-2 w-2 animate-blink rounded-full bg-red" />
          Exposed
        </span>
      </div>
      <div className="relative mt-4 grid h-44 place-items-center overflow-hidden rounded-[10px] bg-black ring-in-ash sm:h-56">
        <UsbDrive />
        <div className="pointer-events-none absolute inset-x-3 top-0 h-px animate-scan bg-pink" />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.1em]">
        <Readout k="Classification" v="Top secret" />
        <Readout k="Transfer" v={<span className="text-red">Visible</span>} />
      </dl>
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
    <svg viewBox="0 0 240 120" className="w-[78%]" aria-label="Classified USB drive">
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
