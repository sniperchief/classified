import { useEffect, useRef, useState } from "react";
import { UsbIcon } from "../components/icons";
import { fmtTime } from "../components/TxCinematic";
import { Button, CopyField, DemoBadge, ExternalLink, MissionTitle, Panel, PlayingCard, Screen, Stamp, Steps, Typewriter } from "../components/ui";
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
  const [copied, setCopied] = useState(false);
  const elapsed = useElapsed(waitingSince);
  const b = s.agentBalance;
  const total = b.transparent + b.shielded + b.shieldedPending;
  const acquired = total > 0n;
  const announced = useRef(acquired);
  const steps = [demo ? "Find drop address" : "Copy drop address", demo ? "Signal handler" : "Call your handler", "Funds detected"];
  const step = acquired ? 3 : waitingSince !== null ? 2 : copied ? 1 : 0;

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
      setCopied(true);
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
      <MissionTitle
        code="02"
        title="Acquire the intelligence."
        accent="intelligence"
        status={acquired ? "COMPLETE" : "ACTIVE"}
        info={{
          term: "Why do I need ZEC?",
          body: (
            <>
              ZEC is Zcash's currency — you need some before you can move anything. This is a <b>testnet mission</b>: you get free test coins (
              {config.ticker}) with no real-world value.
            </>
          ),
          more: (
            <>
              On mainnet you'd buy ZEC on an exchange and withdraw it to your wallet. Many exchanges send to a transparent address — exactly what you're
              doing here. On the Zcash <b>testnet</b>, a faucet hands out free test coins instead.
            </>
          ),
        }}
      />

      <div className="mt-8 space-y-8">
        {!acquired ? (
          <>
            <Typewriter lines={["Your handler is ready. Tell them where to drop the funds."]} />

            <Panel className="max-w-3xl space-y-6 p-5 sm:p-7">
              <Steps labels={steps} current={step} />

              {!waitingSince ? (
                <>
                  {s.agent && <CopyField label="Your public drop address" value={s.agent.transparent} tone="red" onCopy={() => setCopied(true)} />}
                  <div>
                    <Button size="xl" onClick={acquire} disabled={!s.agent} className="w-full sm:w-auto">
                      {demo ? "Signal your handler" : "Call your handler ↗"}
                    </Button>
                    {!demo && <p className="label mt-3 text-[10px] text-dim">Opens the testnet faucet · paste your address · free, once a day</p>}
                  </div>
                </>
              ) : (
                <Scanning elapsed={elapsed} tip={s.chainTip} onReopen={demo ? undefined : acquire} />
              )}
            </Panel>
          </>
        ) : (
          <>
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
                <Steps labels={steps} current={step} />
                {demo && <DemoBadge />}
              </div>
            </div>
            {b.transparent > 0n && (
              <p className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-sm text-red">
                ⚠ Public drop — anyone can see this balance.
                {!demo && s.agent && <ExternalLink href={explorerAddress(s.agent.transparent)}>See what they see</ExternalLink>}
              </p>
            )}
            <Button size="xl" onClick={proceed} className="w-full sm:w-auto">
              Next mission →
            </Button>
          </>
        )}
      </div>
    </Screen>
  );
}

function Scanning({ elapsed, tip, onReopen }: { elapsed: number; tip: number; onReopen?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-24 w-24 shrink-0 rounded-full border border-white">
        <div className="absolute inset-[30%] rounded-full border border-ash" />
        <div className="absolute inset-0 animate-spin-slow">
          <div className="absolute left-1/2 top-0 h-1/2 w-px origin-bottom bg-pink" />
        </div>
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <div className="font-display text-2xl font-black">Scanning for the drop…</div>
        <div className="label mt-2 text-[10px] text-muted">
          {tip > 0 && <>Block {tip.toLocaleString()} · </>}
          {fmtTime(elapsed)}
        </div>
        {onReopen && (
          <button className="label mt-3 text-[11px] text-white underline decoration-pink decoration-2 underline-offset-4" onClick={onReopen}>
            Reopen faucet ↗
          </button>
        )}
      </div>
    </div>
  );
}
