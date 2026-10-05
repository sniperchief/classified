import { useCallback } from "react";
import { ErrorPanel } from "../components/ErrorPanel";
import { CaseIcon, LockIcon, UsbIcon } from "../components/icons";
import { TxCinematic } from "../components/TxCinematic";
import { Button, ExternalLink, MissionTitle, Panel, Screen, Stamp, Typewriter } from "../components/ui";
import { config, explorerAddress } from "../config";
import { useGame, useSnapshot } from "../game/state";
import { useTxRunner } from "../game/useTxRunner";
import { useUnlockChime } from "../game/useUnlockChime";
import { formatZats } from "../lib/format";

export function Bonus() {
  const { engine, go, update, progress } = useGame();
  const s = useSnapshot();
  const demo = progress.mode === "demo";
  const onTxid = useCallback((id: string | undefined) => update({ unshieldTxid: id, unshieldZats: config.defaultUnshieldZats.toString() }), [update]);
  const tx = useTxRunner(progress.unshieldTxid, onTxid);
  const amount = config.defaultUnshieldZats;
  const done = tx.phase === "confirmed";
  const short = s.agentBalance.shielded <= amount;
  const confirming = short && s.agentBalance.shieldedPending > 0n;
  useUnlockChime(short);

  const unshield = () => {
    if (!engine || !s.agent) return;
    const to = s.agent.transparent;
    tx.run((onStage) => engine.send(to, amount, onStage));
  };

  return (
    <Screen>
      <MissionTitle
        code="B1"
        title="Extraction."
        accent="Extraction"
        status="BONUS OPERATION"
        info={{
          term: "What is unshielding?",
          body: "Unshielding moves funds from the shielded pool to a transparent address. Once there, the amount and address are public again — useful when a service only accepts public funds.",
        }}
      />
      <div className="mt-8 space-y-8">
        <Typewriter lines={["Extraction: move funds back to the public side."]} />

        {tx.phase === "idle" ? (
          <>
            {tx.error != null && <ErrorPanel error={tx.error} context="extraction" onRetry={unshield} />}
            {tx.error == null && (
              <Panel className="max-w-2xl space-y-5 p-5 sm:p-7">
                <p className="label text-[10px] text-dim">
                  {confirming ? "Unlocks automatically when funds confirm" : short ? "Not enough shielded funds to extract" : `${formatZats(amount)} ${config.ticker} → your public address`}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="xl" onClick={unshield} disabled={short} className={`w-full sm:w-auto ${confirming ? "animate-pulse" : ""}`}>
                    {confirming ? "⏳ Funds confirming" : "Unshield"}
                  </Button>
                  <Button variant="outline" size="xl" onClick={() => go("complete")} className="w-full sm:w-auto">
                    Back to debrief
                  </Button>
                </div>
              </Panel>
            )}
          </>
        ) : (
          <>
            <TxCinematic
              phase={tx.phase}
              txid={progress.unshieldTxid}
              demo={demo}
              elapsed={tx.elapsed}
              doneLabel="Funds unshielded"
              nodes={[
                { icon: <LockIcon />, label: "Shielded", tone: "violet" },
                { icon: <CaseIcon />, label: "Extracting", tone: "violet" },
                { icon: <UsbIcon />, label: "Public", sub: "VISIBLE AGAIN", tone: "red" },
              ]}
            />
            {done && (
              <div className="animate-fade-up space-y-6">
                <Stamp tone="red">Extraction complete</Stamp>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-sm text-muted">
                  {formatZats(amount)} {config.ticker} is public again.
                  {!demo && s.agent && <ExternalLink href={explorerAddress(s.agent.transparent)}>See it on the explorer</ExternalLink>}
                </p>
                <Button size="xl" onClick={() => go("complete")}>
                  Return to debrief →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Screen>
  );
}
