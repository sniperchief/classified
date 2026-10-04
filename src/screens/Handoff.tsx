import { useCallback, useEffect, useState } from "react";
import { ErrorPanel } from "../components/ErrorPanel";
import { AgentIcon, HouseIcon, LockIcon } from "../components/icons";
import { TxCinematic } from "../components/TxCinematic";
import { Button, CopyField, MissionTitle, Panel, PlayingCard, Screen, Stamp, Typewriter } from "../components/ui";
import { config } from "../config";
import { useGame, useSnapshot } from "../game/state";
import { useTxRunner } from "../game/useTxRunner";
import { isConfirmed, useTxWatch } from "../game/useTxWatch";
import { formatZats, parseZec } from "../lib/format";
import { sfx } from "../lib/sound";

const CODE_NAME = "NIGHTJAR";
const field = "w-full rounded-[38px] bg-black px-5 py-3.5 font-mono text-white placeholder:text-dim ring-in-white";

export function Handoff() {
  const { engine, go, update, progress } = useGame();
  const s = useSnapshot();
  const demo = progress.mode === "demo";
  const onTxid = useCallback((id: string | undefined) => update({ sendTxid: id }), [update]);
  const tx = useTxRunner(progress.sendTxid, onTxid);

  const available = s.agentBalance.shielded;
  const [amount, setAmount] = useState(() => formatZats(config.defaultSendZats));
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [fee, setFee] = useState<bigint | null>(null);

  const recipient = customOpen && custom.trim() ? custom.trim() : (s.contactAddress ?? "");
  const zats = parseZec(amount);
  const addrError = recipient ? (engine?.validateAddress(recipient) ?? null) : "No recipient";
  const amountError =
    zats === null
      ? "Enter an amount like 0.05"
      : zats <= 0n
        ? "Amount must be above zero"
        : fee !== null && zats + fee > available
          ? "More than your shielded balance (incl. fee)"
          : null;

  // Live quote (also validates the address against the real wallet).
  useEffect(() => {
    setFee(null);
    if (!engine || addrError || !zats || zats <= 0n || available === 0n || tx.phase !== "idle") return;
    let alive = true;
    const t = setTimeout(() => {
      engine
        .quoteFee(recipient, zats)
        .then((f) => alive && setFee(f))
        .catch(() => alive && setFee(null));
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [engine, recipient, zats, addrError, available, tx.phase]);

  const deliver = () => {
    if (!engine || !zats || addrError) return;
    update({ sendTo: recipient, sendZats: zats.toString() });
    tx.run((onStage) => engine.send(recipient, zats, onStage));
  };

  const delivered = tx.phase === "confirmed";
  const sentZats = progress.sendZats ? BigInt(progress.sendZats) : (zats ?? 0n);
  const sentToContact = (progress.sendTo ?? recipient) === s.contactAddress && s.contactIsLocal;

  return (
    <Screen>
      <MissionTitle code="05" title="Secure the handoff." accent="handoff" status={delivered ? "DELIVERED" : "ACTIVE"} />
      <div className="mt-10 space-y-10">
        <Typewriter lines={["CONTACT LOCATED.", `Agent ${CODE_NAME} is waiting at the rendezvous.`]} speed={26} />

        {tx.phase === "idle" ? (
          <>
            <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
              {/* Contact dossier card */}
              <PlayingCard face="white" accent="pink" tilt={-3} deal className="w-full max-w-xs">
                <div className="flex items-center justify-between">
                  <span className="label text-[10px] text-black/50">Contact dossier</span>
                  <span className="label text-[10px] text-pink">● Live</span>
                </div>
                <div className="my-6 grid place-items-center">
                  <div className="grid h-24 w-24 place-items-center rounded-full bg-black text-white">
                    <AgentIcon className="h-14 w-14" />
                  </div>
                </div>
                <div className="font-display text-4xl font-black leading-none">{CODE_NAME}.</div>
                <div className="mt-3 space-y-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-black/60">
                  <div>Status: in position</div>
                  <div>Channel: shielded only</div>
                </div>
              </PlayingCard>

              <Panel className="space-y-6 p-6">
                <div className="label text-muted">Transfer orders</div>
                {s.contactAddress && !customOpen && <CopyField label={`${CODE_NAME}'s shielded address`} value={s.contactAddress} tone="violet" />}

                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <label className="block">
                    <span className="label mb-2 block text-muted">Amount ({config.ticker})</span>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                      inputMode="decimal"
                      className={`${field} text-lg font-bold`}
                    />
                  </label>
                  <div className="font-mono text-xs leading-6 text-muted sm:text-right">
                    <div>
                      Shielded: <span className="font-bold text-white">{formatZats(available)}</span>
                    </div>
                    <div>
                      Fee (est.): <span className="font-bold text-white">{fee !== null ? formatZats(fee) : "—"}</span>
                    </div>
                  </div>
                </div>
                {amountError && amount && <p className="font-mono text-xs text-red">{amountError}</p>}

                <button className="label text-[11px] text-dim hover:text-white" onClick={() => setCustomOpen(!customOpen)}>
                  {customOpen ? `− Deliver to ${CODE_NAME} instead` : "+ Deliver to a different address"}
                </button>
                {customOpen && (
                  <div>
                    <input
                      value={custom}
                      onChange={(e) => setCustom(e.target.value)}
                      placeholder="utest1… / ztestsapling1… / tm…"
                      spellCheck={false}
                      autoComplete="off"
                      className={`${field} text-sm`}
                    />
                    {custom && addrError && <p className="mt-2 font-mono text-xs text-red">{addrError}</p>}
                    {custom && !addrError && recipient.startsWith("tm") && (
                      <p className="mt-2 font-mono text-xs text-gold">⚠ Public (transparent) address — this delivery would be visible on-chain.</p>
                    )}
                  </div>
                )}
              </Panel>
            </div>

            {available === 0n && (
              <p className="label text-[11px] text-dim">
                {s.agentBalance.shieldedPending > 0n ? "Shielded funds are confirming — ready after the next block." : "No shielded funds available."}
              </p>
            )}
            {tx.error != null && <ErrorPanel error={tx.error} context="delivery" onRetry={deliver} />}
            {tx.error == null && (
              <Button size="xl" onClick={deliver} disabled={!!addrError || !!amountError || available === 0n}>
                Deliver →
              </Button>
            )}
          </>
        ) : (
          <>
            <TxCinematic
              phase={tx.phase}
              txid={progress.sendTxid}
              demo={demo}
              elapsed={tx.elapsed}
              doneLabel="Delivery confirmed"
              nodes={[
                { icon: <HouseIcon />, label: "Safehouse", tone: "gold" },
                { icon: <LockIcon />, label: "Shielded transfer", sub: `${formatZats(sentZats)} ${config.ticker}`, tone: "violet" },
                { icon: <AgentIcon />, label: sentToContact ? CODE_NAME : "Recipient", tone: "pink" },
              ]}
            />
            {delivered && (
              <div className="animate-fade-up space-y-8">
                <Stamp tone="pink">Delivery confirmed</Stamp>
                {sentToContact ? (
                  <RecipientTerminal txid={progress.sendTxid!} zats={sentZats} />
                ) : (
                  <p className="text-[15px] leading-[1.7] text-muted">Delivered to an external address. The recipient's wallet will show the funds once it syncs.</p>
                )}
                <Button size="xl" onClick={() => go("complete")}>
                  Complete mission →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Screen>
  );
}

/** The receive side: NIGHTJAR's own wallet detecting the incoming shielded note. */
function RecipientTerminal({ txid, zats }: { txid: string; zats: bigint }) {
  const status = useTxWatch(txid, "contact");
  const received = isConfirmed(status);
  useEffect(() => {
    if (received) sfx.success();
  }, [received]);
  return (
    <Panel tone={received ? "violet" : "ash"} fill="carbon" className="max-w-2xl overflow-hidden font-mono">
      <div className="flex items-center justify-between border-b border-ash px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
        <span>{CODE_NAME} // Secure terminal</span>
        <span className={received ? "text-lavender" : "text-gold"}>{received ? "● Received" : "● Scanning"}</span>
      </div>
      <div className="p-6">
        {received ? (
          <div className="animate-fade-up">
            <div className="font-display text-4xl font-black leading-none">Intelligence received.</div>
            <div className="mt-3 text-sm text-white/80">
              +{formatZats(zats)} {config.ticker} · shielded · sender and amount hidden from the public chain
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted">
            <span className="text-pink">&gt;</span> Contact's wallet is scanning the chain for the incoming shielded note…
          </div>
        )}
      </div>
    </Panel>
  );
}
