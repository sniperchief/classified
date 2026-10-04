import { useEffect, useState, type CSSProperties } from "react";
import { Button, DemoBadge, ExternalLink, Panel, Stamp } from "../components/ui";
import { config, explorerTx } from "../config";
import { RANKS, clearance, useGame } from "../game/state";
import { sfx } from "../lib/sound";

const SKILLS: { name: string; face: string; ring: string }[] = [
  { name: "Set up a Zcash wallet", face: "bg-white", ring: "ring-in-black" },
  { name: "Get ZEC", face: "bg-lemon", ring: "ring-in-black" },
  { name: "Shield ZEC", face: "bg-lavender", ring: "ring-in-violet" },
  { name: "Send ZEC", face: "bg-white", ring: "ring-in-pink" },
  { name: "Receive ZEC", face: "bg-mint", ring: "ring-in-black" },
  { name: "Complete a shielded transaction", face: "bg-white", ring: "ring-in-gold" },
];

export function Complete() {
  const { progress, go, replay, burn, engine } = useGame();
  const demo = progress.mode === "demo";
  const [showPhrase, setShowPhrase] = useState(false);
  const [confirmBurn, setConfirmBurn] = useState(false);
  const lvl = clearance(progress);
  const unshielded = !!progress.unshieldTxid;
  const skills = unshielded ? [...SKILLS, { name: "Unshield ZEC", face: "bg-white", ring: "ring-in-red" }] : SKILLS;

  useEffect(() => {
    sfx.success();
  }, []);

  const log = [
    progress.shieldTxid && { label: "Shielding", txid: progress.shieldTxid },
    progress.sendTxid && { label: "Shielded delivery", txid: progress.sendTxid },
    progress.unshieldTxid && { label: "Unshielding (bonus)", txid: progress.unshieldTxid },
  ].filter((l) => l && !l.txid.startsWith("pending:")) as { label: string; txid: string }[];

  return (
    <div className="relative">
      <section className="relative mx-auto max-w-[1200px] px-4 pb-32 pt-14 sm:px-6 sm:pt-20">
        {/* Headline + rank card */}
        <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="label animate-fade-up text-muted">Operation status // closed</div>
            <h1 className="mt-5 animate-fade-up font-display text-[17vw] font-black leading-[0.9] tracking-[-0.04em] sm:text-[110px] lg:text-[128px]">
              Mission
              <br />
              complete.
            </h1>
            <p className="mt-6 max-w-xl animate-fade-up text-xl leading-[1.5] [animation-delay:250ms] sm:text-2xl">
              You just completed your first <span className="font-extrabold text-pink">shielded Zcash transaction</span>.
            </p>
          </div>
          <div
            className="ring-in-pink animate-deal mx-auto flex aspect-[5/7] w-64 flex-col justify-between rounded-[14px] bg-white p-6 text-black"
            style={{ "--tilt": "4deg", animationDelay: "300ms" } as CSSProperties}
          >
            <div className="flex items-center justify-between">
              <span className="label text-[10px] text-black/50">Agent rank</span>
              <span className="label text-[10px] text-pink">Lv {lvl}</span>
            </div>
            <div>
              <div className="font-display text-5xl font-black leading-[0.95]">{RANKS[lvl]}.</div>
              <div className="mt-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-black/60">Clearance {lvl} / 6</div>
              {(progress.intel ?? 0) > 0 && (
                <div className="mt-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-black/60">★ {progress.intel} intel points</div>
              )}
            </div>
            <div className="flex gap-1">
              {RANKS.slice(1).map((_, i) => (
                <span key={i} className={`h-2 flex-1 rounded-full ${i < lvl ? "bg-black" : "bg-black/15"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Skills dealt as a fan of cards */}
        <div className="mt-20">
          <div className="label text-muted">You learned</div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:flex lg:justify-start lg:gap-0">
            {skills.map((s, i) => {
              const tilt = (i - (skills.length - 1) / 2) * 4;
              return (
                <div
                  key={s.name}
                  className={`animate-deal flex aspect-[5/7] flex-col justify-between rounded-[14px] p-4 text-black lg:-ml-4 lg:w-44 lg:first:ml-0 ${s.face} ${s.ring} transition-transform hover:z-10 hover:-translate-y-4`}
                  style={{ "--tilt": `${tilt}deg`, "--deal-x": "-40px", animationDelay: `${500 + i * 140}ms` } as CSSProperties}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-black font-mono text-sm font-bold text-white">✓</span>
                  <span className="font-display text-lg font-black leading-[1.1]">{s.name}.</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quote */}
        <blockquote className="mt-20 font-display text-[clamp(2rem,9vw,4rem)] font-black leading-[1.02] tracking-[-0.02em] sm:mt-24">
          You didn't read a tutorial.
          <br />
          <span className="text-pink">You completed a mission.</span>
        </blockquote>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button size="xl" onClick={replay} className="w-full sm:w-auto">
            Run the mission again
          </Button>
          <a
            href="https://z.cash/learn/"
            target="_blank"
            rel="noopener noreferrer"
            className="ring-in-white inline-flex w-full items-center justify-center rounded-[38px] px-7 py-5 text-center font-mono text-base font-bold uppercase tracking-[0.12em] transition hover:bg-white hover:text-black sm:w-auto sm:px-12 sm:py-6 sm:text-lg"
          >
            Learn how Zcash works ↗
          </a>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-2">
          {/* Mission log */}
          <Panel className="p-6">
            <div className="label text-muted">Mission log</div>
            <div className="mt-4 space-y-4">
              {log.length === 0 && <p className="text-sm text-muted">Funds arrived pre-shielded; no shielding transaction was needed.</p>}
              {log.map((l) => (
                <div key={l.txid} className="border-b border-ash pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="label text-[11px]">{l.label}</span>
                    {demo ? <DemoBadge /> : <ExternalLink href={explorerTx(l.txid)}>Explorer</ExternalLink>}
                  </div>
                  <code className="mt-1 block truncate font-mono text-[11px] text-dim">{l.txid}</code>
                </div>
              ))}
            </div>
            {!demo && (
              <p className="mt-5 text-xs leading-[1.7] text-dim">Open a shielded transaction on the explorer: amounts and addresses aren't there. That's the point.</p>
            )}
          </Panel>

          {/* Bonus operation */}
          {!unshielded ? (
            <div className="ring-in-red rounded-[14px] bg-white p-6 text-black sm:p-7" style={{ transform: "rotate(-1.5deg)" }}>
              <div className="flex items-center justify-between">
                <span className="label text-red">Bonus operation</span>
                <span className="label text-[10px] text-black/40">Optional · ~2 min</span>
              </div>
              <div className="mt-3 font-display text-4xl font-black leading-none sm:text-5xl">Extraction.</div>
              <p className="mt-3 text-[15px] leading-[1.7] text-black/70">Intelligence extraction requires moving funds back to the public side.</p>
              <Button variant="ink" className="mt-6" onClick={() => go("bonus")}>
                Unshield →
              </Button>
            </div>
          ) : (
            <div className="flex items-center">
              <Stamp tone="gold">Bonus cleared · Director clearance</Stamp>
            </div>
          )}
        </div>

        <div className="mt-20 border-t border-ash pt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-dim">
          <div className="flex flex-wrap items-center gap-6">
            {!demo && (
              <button className="hover:text-white" onClick={() => setShowPhrase(!showPhrase)}>
                {showPhrase ? "Hide" : "Reveal"} recovery codes
              </button>
            )}
            <button className="hover:text-red" onClick={() => (confirmBurn ? burn() : setConfirmBurn(true))}>
              {confirmBurn ? "Confirm: burn safehouse & delete wallet" : "Burn safehouse"}
            </button>
            {config.isTestnet && <span className="ml-auto normal-case tracking-normal">Zcash testnet · TAZ has no monetary value.</span>}
          </div>
          {showPhrase && <p className="mt-4 max-w-2xl normal-case tracking-normal text-muted">{engine?.revealPhrase()}</p>}
        </div>
      </section>
    </div>
  );
}
