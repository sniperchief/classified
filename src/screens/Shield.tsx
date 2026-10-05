import { useCallback } from "react";
import { ErrorPanel } from "../components/ErrorPanel";
import { CaseIcon, EyeIcon, LockIcon, UsbIcon } from "../components/icons";
import { TxCinematic } from "../components/TxCinematic";
import { Button, ExternalLink, MissionTitle, Panel, Screen, Stamp, Steps, Typewriter } from "../components/ui";
import { config, explorerAddress } from "../config";
import { useGame, useSnapshot } from "../game/state";
import { useTxRunner } from "../game/useTxRunner";
import { useUnlockChime } from "../game/useUnlockChime";
import { formatZats, shortAddr } from "../lib/format";

export function Shield() {
  const { engine, go, update, progress } = useGame();
  const s = useSnapshot();
  const demo = progress.mode === "demo";
  const onTxid = useCallback((id: string | undefined) => update({ shieldTxid: id }), [update]);
  const tx = useTxRunner(progress.shieldTxid, onTxid);
  const b = s.agentBalance;

  const nothingToShield = !progress.shieldTxid && tx.phase === "idle" && b.transparent === 0n && b.shielded + b.shieldedPending > 0n;
  const secured = tx.phase === "confirmed";
  const exposed = !secured && !nothingToShield;

  const shield = () => engine && tx.run((onStage) => engine.shield(onStage));

  const fundsConfirming = b.transparent === 0n;
  useUnlockChime(fundsConfirming);
  const steps = [fundsConfirming ? "Waiting for funds" : "Shield the funds", "Confirm in a block"];
  const step = secured || nothingToShield ? 2 : tx.phase === "idle" ? 0 : 1;

  return (
    <Screen>
      <MissionTitle
        code="03"
        title="Shield the intelligence."
        accent="Shield"
        status={secured || nothingToShield ? "COMPLETE" : "ACTIVE"}
        info={{
          term: "What is shielding?",
          body: "Shielding moves funds into Zcash's shielded pool, helping keep transaction details private.",
          more: (
            <>
              Your public (transparent) coins are spent into an encrypted note in Zcash's Sapling shielded pool, owned by your wallet. The blockchain stores
              only a commitment to that note plus a zero-knowledge proof that the transaction is valid, so observers can't see who owns it or how much it
              holds. The proof is generated right here in your browser.
            </>
          ),
        }}
      />

      <div className="mt-8 space-y-8">
        <Surveillance exposed={exposed} address={s.agent?.transparent} amount={b.transparent} demo={demo} />

        {nothingToShield ? (
          <>
            <Stamp tone="violet">Already shielded</Stamp>
            <p className="font-mono text-sm text-muted">Your funds arrived shielded — nothing is exposed.</p>
            <Button size="xl" onClick={() => go("infiltrate")} className="w-full sm:w-auto">
              Next mission →
            </Button>
          </>
        ) : tx.phase === "idle" ? (
          <>
            <Typewriter lines={["You're exposed. Shield the intelligence."]} />
            {tx.error != null && <ErrorPanel error={tx.error} context="shielding" onRetry={shield} />}
            {tx.error == null && (
              <Panel className="max-w-2xl space-y-6 p-5 sm:p-7">
                <Steps labels={steps} current={step} />
                <Button
                  size="xl"
                  onClick={shield}
                  disabled={fundsConfirming}
                  className={`w-full !py-7 !text-xl sm:w-auto sm:!px-20 sm:!py-8 sm:!text-2xl ${fundsConfirming ? "animate-pulse" : ""}`}
                >
                  {fundsConfirming ? "⏳ Funds confirming" : "🔒 Shield"}
                </Button>
                <p className="label text-[10px] text-dim">
                  {fundsConfirming
                    ? `Unlocks automatically${s.chainTip ? ` · block ${s.chainTip.toLocaleString()}` : ""}`
                    : `${formatZats(b.transparent)} ${config.ticker} → shielded pool`}
                </p>
              </Panel>
            )}
          </>
        ) : (
          <>
            <TxCinematic
              phase={tx.phase}
              txid={progress.shieldTxid}
              demo={demo}
              elapsed={tx.elapsed}
              doneLabel="Funds shielded"
              nodes={[
                { icon: <UsbIcon />, label: "Exposed", sub: "PUBLIC FUNDS", tone: "red" },
                { icon: <CaseIcon />, label: "Encrypting", sub: "ZK PROOF", tone: "violet" },
                { icon: <LockIcon />, label: "Shielded", sub: "PRIVATE POOL", tone: "violet" },
              ]}
            />
            {secured && (
              <div className="animate-fade-up space-y-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <Stamp tone="violet">Intelligence secured</Stamp>
                  <div className="ring-in-violet rounded-[14px] bg-lavender px-6 py-4 text-center text-black">
                    <div className="font-display text-2xl font-black">🔒 SHIELDED</div>
                    <div className="mt-1 font-mono text-xs font-bold">
                      {formatZats(b.shielded + b.shieldedPending)} {config.ticker}
                    </div>
                  </div>
                </div>
                <Button size="xl" onClick={() => go("infiltrate")} className="w-full sm:w-auto">
                  Next mission →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Screen>
  );
}

function Surveillance({ exposed, address, amount, demo }: { exposed: boolean; address?: string; amount: bigint; demo: boolean }) {
  return (
    <Panel tone={exposed ? "red" : "violet"} className="relative overflow-hidden font-mono transition-colors duration-700">
      <div className={`flex items-center justify-between border-b px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] ${exposed ? "border-red text-red" : "border-violet text-lavender"}`}>
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${exposed ? "animate-pulse bg-red" : "bg-violet"}`} /> Hostile surveillance // Cam 04
        </span>
        <span>{exposed ? "Target visible" : "Signal lost"}</span>
      </div>
      <div className="relative grid gap-6 p-6 sm:grid-cols-[auto_1fr]">
        {exposed && <div className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan bg-red" />}
        <div className={`grid h-24 w-24 place-items-center rounded-[14px] ${exposed ? "ring-in-red text-red" : "ring-in-violet text-lavender"}`}>
          {exposed ? <EyeIcon className="h-12 w-12" /> : <LockIcon className="h-12 w-12" />}
        </div>
        <div className="space-y-2 text-[13px]">
          <div className={`font-display text-3xl font-black ${exposed ? "text-red" : "text-lavender"}`}>{exposed ? "⚠ Surveillance detected." : "Target lost."}</div>
          <Row k="Address" v={exposed && address ? shortAddr(address, 12, 6) : "█████████████"} />
          <Row k="Holdings" v={exposed ? `${formatZats(amount)} ${config.ticker}` : "██████"} />
          <Row k="Visible to" v={exposed ? "ANYONE ON THE INTERNET" : "NO ONE BUT YOU"} />
          {exposed && address && !demo && (
            <div className="pt-2">
              <ExternalLink href={explorerAddress(address)}>Verify on public explorer</ExternalLink>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-24 shrink-0 uppercase tracking-[0.1em] text-dim">{k}</span>
      <span className="text-white">{v}</span>
    </div>
  );
}
