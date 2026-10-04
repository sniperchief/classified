import { useEffect, useRef, useState, type ReactNode } from "react";
import { UsbIcon } from "../components/icons";
import { fmtTime } from "../components/TxCinematic";
import { Button, CopyField, DemoBadge, Explain, ExternalLink, MissionTitle, Panel, PlayingCard, Screen, Stamp, Typewriter } from "../components/ui";
import { config, explorerAddress } from "../config";
import { useGame, useSnapshot } from "../game/state";
import { useElapsed } from "../game/useTxWatch";
import { formatZats } from "../lib/format";
import { sfx } from "../lib/sound";

export function Acquire() {
  const { engine, go, update, progress } = useGame();
  const s = useSnapshot();
  const demo = progress.mode === "demo";
  const [waitingSince, setWaitingSince] = useState<number | null>(null);
  const elapsed = useElapsed(waitingSince);
  const b = s.agentBalance;
  const total = b.transparent + b.shielded + b.shieldedPending;
  const acquired = total > 0n;
  const announced = useRef(acquired);

  useEffect(() => {
    if (acquired && !announced.current) {
      announced.current = true;
      sfx.success();
    }
  }, [acquired]);

  // While waiting, poll a little faster than the background sync.
  useEffect(() => {
    if (!waitingSince || acquired || !engine) return;
    const t = setInterval(() => engine.syncNow().catch(() => undefined), 10_000);
    return () => clearInterval(t);
  }, [waitingSince, acquired, engine]);

  const acquire = async () => {
    if (!s.agent || !engine) return;
    setWaitingSince(Date.now());
    if (demo) {
      await engine.demoFund?.();
      return;
    }
    try {
      await navigator.clipboard.writeText(s.agent.transparent);
    } catch {
      /* fine — the address is also shown for manual copy */
    }
    window.open(config.faucetUrl, "_blank", "noopener,noreferrer");
  };

  const proceed = () => {
    update({ arrivedShielded: b.transparent === 0n && b.shielded + b.shieldedPending > 0n });
    go("shield");
  };

  return (
    <Screen>
      <MissionTitle code="02" title="Acquire the intelligence." accent="intelligence" status={acquired ? "COMPLETE" : "ACTIVE"} />

      {!acquired ? (
        <div className="mt-10 space-y-10">
          <Typewriter
            lines={["Your handler is standing by to transfer the mission funds.", "They'll leave them at your public drop point. Tell them where."]}
          />

          <Explain
            term="Why do I need ZEC?"
            tilt={1}
            more={
              <>
                On mainnet you'd buy ZEC on an exchange and withdraw it to your wallet. Many exchanges send to a transparent address — exactly what
                you're about to do. This mission runs on the Zcash <b>testnet</b>, where a faucet hands out free test coins ({config.ticker}).
              </>
            }
          >
            ZEC is Zcash's currency — you need some before you can move anything. This is a <b>testnet mission</b>: you'll get free test coins (
            {config.ticker}) with no real-world value.
          </Explain>

          <div>
            <div className="label mb-4 text-muted">Objectives</div>
            <div className="grid gap-4 md:grid-cols-3">
              <Objective n={1} tilt={-1.5} title="Copy your drop address">
                Your public (transparent) address — it starts with <b>tm</b>.
              </Objective>
              <Objective n={2} tilt={1} title={demo ? "Signal your handler" : "Request funds"}>
                {demo ? "Demo mode simulates the handler's transfer." : "Paste it into the faucet and request test coins. Free, once a day."}
              </Objective>
              <Objective n={3} tilt={-0.5} title="Come back here">
                Your safehouse spots the drop automatically, usually in 1–3 minutes.
              </Objective>
            </div>
          </div>

          {s.agent && (
            <div className="max-w-3xl">
              <CopyField label="Your public drop address" value={s.agent.transparent} tone="red" />
            </div>
          )}

          {!waitingSince ? (
            <Button size="xl" onClick={acquire} disabled={!s.agent}>
              Acquire intelligence {demo ? "" : "↗"}
            </Button>
          ) : (
            <Scanning elapsed={elapsed} tip={s.chainTip} onReopen={demo ? undefined : acquire} />
          )}
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
            <PlayingCard face="lemon" accent="black" tilt={5} deal className="flex h-56 w-44 shrink-0 flex-col justify-between">
              <span className="font-mono text-[10px] font-bold">02</span>
              <UsbIcon className="mx-auto h-16 w-16" />
              <div className="text-center">
                <div className="font-display text-2xl font-black leading-none">{formatZats(total)}</div>
                <div className="font-mono text-[10px] font-bold tracking-[0.14em]">{config.ticker}</div>
              </div>
            </PlayingCard>
            <div className="space-y-4">
              <Stamp tone="gold">Intelligence acquired</Stamp>
              <p className="font-display text-3xl font-black leading-[1.05]">💾 Classified USB secured.</p>
              {demo && <DemoBadge />}
            </div>
          </div>
          {b.transparent > 0n && (
            <Panel tone="red" className="max-w-2xl p-6">
              <div className="label text-red">⚠ Problem</div>
              <p className="mt-2 text-[15px] leading-[1.7] text-white/90">
                The drop was made in public. <b>Anyone</b> watching the chain can see your address and exactly how much you hold.
              </p>
              {!demo && s.agent && (
                <div className="mt-4">
                  <ExternalLink href={explorerAddress(s.agent.transparent)}>See what they see</ExternalLink>
                </div>
              )}
            </Panel>
          )}
          <Button size="xl" onClick={proceed}>
            Next mission →
          </Button>
        </div>
      )}
    </Screen>
  );
}

function Objective({ n, title, tilt, children }: { n: number; title: string; tilt: number; children: ReactNode }) {
  return (
    <PlayingCard face="white" accent="black" tilt={tilt} deal delay={200 + n * 120} className="flex min-h-44 flex-col">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-black font-mono text-sm font-bold text-white">{n}</span>
      <div className="mt-4 font-display text-xl font-black leading-tight">{title}</div>
      <p className="mt-2 text-sm leading-[1.7] text-black/70">{children}</p>
    </PlayingCard>
  );
}

function Scanning({ elapsed, tip, onReopen }: { elapsed: number; tip: number; onReopen?: () => void }) {
  return (
    <Panel fill="carbon" tone="ash" className="flex max-w-3xl flex-col items-center gap-6 p-6 sm:flex-row">
      <div className="relative h-24 w-24 shrink-0 rounded-full border border-white">
        <div className="absolute inset-[30%] rounded-full border border-ash" />
        <div className="absolute inset-0 animate-spin-slow">
          <div className="absolute left-1/2 top-0 h-1/2 w-px origin-bottom bg-pink" />
        </div>
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <div className="font-display text-2xl font-black">Scanning for transmission…</div>
        <div className="label mt-2 text-[10px] text-muted">
          {tip > 0 && <>Chain tip {tip.toLocaleString()} · </>}Elapsed {fmtTime(elapsed)}
        </div>
        <p className="mt-2 text-sm leading-[1.7] text-muted">Funds count once they're in a block (~75s). Keep this tab open.</p>
        {onReopen && (
          <button className="label mt-3 text-[11px] text-white underline decoration-pink decoration-2 underline-offset-4" onClick={onReopen}>
            Reopen faucet ↗
          </button>
        )}
      </div>
    </Panel>
  );
}
