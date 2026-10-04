import { useCallback } from "react";
import { ErrorPanel } from "../components/ErrorPanel";
import { CaseIcon, LockIcon, UsbIcon } from "../components/icons";
import { TxCinematic } from "../components/TxCinematic";
import { Button, Explain, ExternalLink, MissionTitle, Screen, Stamp, Typewriter } from "../components/ui";
import { config, explorerAddress } from "../config";
import { useGame, useSnapshot } from "../game/state";
import { useTxRunner } from "../game/useTxRunner";
import { formatZats } from "../lib/format";

export function Bonus() {
  const { engine, go, update, progress } = useGame();
  const s = useSnapshot();
  const demo = progress.mode === "demo";
  const onTxid = useCallback((id: string | undefined) => update({ unshieldTxid: id, unshieldZats: config.defaultUnshieldZats.toString() }), [update]);
  const tx = useTxRunner(progress.unshieldTxid, onTxid);
  const amount = config.defaultUnshieldZats;
  const done = tx.phase === "confirmed";

  const unshield = () => {
    if (!engine || !s.agent) return;
    const to = s.agent.transparent;
    tx.run((onStage) => engine.send(to, amount, onStage));
  };

  return (
    <Screen>
      <MissionTitle code="B1" title="Extraction." accent="Extraction" status="BONUS OPERATION" />
      <div className="mt-10 space-y-10">
        <Typewriter lines={["Intelligence extraction requires moving funds back to the public side.", "Some exchanges and services only accept public funds."]} />
        <Explain term="What is unshielding?">
          Unshielding moves funds from the shielded pool to a transparent address. Once there, the amount and address are public again.
        </Explain>

        {tx.phase === "idle" ? (
          <>
            <p className="font-mono text-sm text-muted">
              Move <span className="font-bold text-white">{formatZats(amount)} {config.ticker}</span> from your shielded balance to your own public address.
            </p>
            {tx.error != null && <ErrorPanel error={tx.error} context="extraction" onRetry={unshield} />}
            {tx.error == null && (
              <div className="flex flex-wrap gap-4">
                <Button size="xl" onClick={unshield} disabled={s.agentBalance.shielded <= amount}>
                  Unshield
                </Button>
                <Button variant="outline" size="xl" onClick={() => go("complete")}>
                  Back to debrief
                </Button>
              </div>
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
                <p className="text-[15px] leading-[1.7] text-muted">
                  {formatZats(amount)} {config.ticker} is back on the public side.{" "}
                  {!demo && s.agent && <ExternalLink href={explorerAddress(s.agent.transparent)}>See it on the public explorer</ExternalLink>}
                </p>
                <p className="text-sm text-dim">Run the mission again and you can shield it right back.</p>
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
