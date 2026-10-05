import { useCallback, useEffect, useState } from "react";
import { ErrorPanel } from "../components/ErrorPanel";
import { SlideToDeliver, type Lock } from "../components/SlideToDeliver";
import { AgentIcon, HouseIcon, LockIcon } from "../components/icons";
import { TxCinematic } from "../components/TxCinematic";
import { Button, MissionTitle, Panel, PlayingCard, Screen, Stamp, Steps, Typewriter } from "../components/ui";
import { config } from "../config";
import { useGame, useSnapshot } from "../game/state";
import { useTxRunner } from "../game/useTxRunner";
import { isConfirmed, useTxWatch } from "../game/useTxWatch";
import { formatZats, parseZec, shortAddr } from "../lib/format";
import { sfx } from "../lib/sound";

const CODE_NAME = "NIGHTJAR";
/** NIGHTJAR's identity: a portrait from the Zilkroad collection ("shielded identities" on Zcash). */
const IDENTITY = {
  src: "/zilkroad/zksnark-7470.png",
  name: "zkSNARK #7470",
  url: "https://zilkroad.com/explorer/7470",
  alt: "NIGHTJAR — portrait zkSNARK #7470 from the Zilkroad collection",
};

function Portrait({ size, ring }: { size: string; ring: string }) {
  return (
    <img
      src={IDENTITY.src}
      alt={IDENTITY.alt}
      width={520}
      height={520}
      className={`${size} ${ring} shrink-0 rounded-[10px] bg-black [image-rendering:pixelated]`}
    />
  );
}
const field = "w-full rounded-[38px] bg-black px-5 py-3.5 font-mono text-white placeholder:text-dim ring-in-white";
/** Quick amounts for phones: tap instead of typing. */
const CHIPS = [1_000_000n, 5_000_000n, 10_000_000n];

export function Handoff() {
  const { engine, go, update, progress } = useGame();
  const s = useSnapshot();
  const demo = progress.mode === "demo";
  const onTxid = useCallback((id: string | undefined) => update({ sendTxid: id }), [update]);
  const tx = useTxRunner(progress.sendTxid, onTxid);

  const available = s.agentBalance.shielded;
  const [amount, setAmount] = useState(() => formatZats(config.defaultSendZats));
  const [otherAmount, setOtherAmount] = useState(false);
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
        : zats + (fee ?? 10_000n) > available
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
  // The receive side: NIGHTJAR's own wallet must detect the note before we call it received.
  const receipt = useTxWatch(delivered && sentToContact ? progress.sendTxid : undefined, "contact");
  const contactReceived = isConfirmed(receipt);
  const broadcast = tx.phase === "confirming" || delivered;
  const estFee = fee ?? 10_000n;
  const pending = s.agentBalance.shieldedPending;
  const waitingForFunds = available === 0n && pending > 0n;
  const steps = [waitingForFunds ? "Waiting for funds" : "Set amount", `Deliver to ${customOpen && custom.trim() ? "recipient" : CODE_NAME}`, "Confirm in a block", sentToContact ? `${CODE_NAME} receives` : "Recipient sees it"];
  const amountReady = zats !== null && zats > 0n && !amountError;
  const step = (sentToContact ? contactReceived : delivered) ? 4 : delivered ? 3 : broadcast ? 2 : amountReady ? 1 : 0;

  // Arriving with a default the wallet can't cover? Pick the largest quick amount that fits.
  useEffect(() => {
    if (otherAmount || tx.phase !== "idle" || available === 0n || zats === null) return;
    if (zats + estFee <= available) return;
    const fit = [...CHIPS].reverse().find((c) => c + estFee <= available);
    if (fit) setAmount(formatZats(fit));
  }, [available, estFee, otherAmount, tx.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Why the slider is locked, in a few words, on the slider itself.
  const lock: Lock | null = waitingForFunds
    ? { kind: "wait", text: `⏳ Funds confirming${s.chainTip ? ` · block ${s.chainTip.toLocaleString()}` : ""}` }
    : available === 0n
      ? { kind: "fix", text: "No shielded funds" }
      : addrError
        ? { kind: "fix", text: "Fix the recipient address" }
        : amountError
          ? { kind: "fix", text: zats !== null && zats > 0n ? `Not enough for ${formatZats(zats)} — pick less` : "Choose an amount" }
          : null;

  return (
    <Screen>
      <MissionTitle
        code="05"
        title="Secure the handoff."
        accent="handoff"
        status={delivered ? "DELIVERED" : "ACTIVE"}
        info={{
          term: "A shielded transfer",
          body: `You send ZEC in a shielded transaction: sender, receiver and amount stay encrypted on the chain. Only ${CODE_NAME}'s wallet can see it arrive.`,
          more: (
            <>
              The transfer spends your shielded Sapling note and creates a new one for {CODE_NAME}, with a zero-knowledge proof generated in your browser.{" "}
              {CODE_NAME}'s wallet runs in this page too, as a second account, so you can watch it detect the note on chain.
            </>
          ),
        }}
      />
      <div className="mt-8 space-y-8">
        <Typewriter lines={[`${CODE_NAME} is at the rendezvous. Deliver the intelligence.`]} speed={26} />

        {tx.phase === "idle" ? (
          <>
            <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
              {/* Contact dossier card */}
              <PlayingCard face="white" accent="pink" tilt={-3} deal className="w-full max-w-xs">
                <div className="flex items-center justify-between">
                  <span className="label text-[10px] text-black/50">Contact dossier</span>
                  <span className="label text-[10px] text-pink">● Live</span>
                </div>
                <div className="my-5 grid place-items-center">
                  <Portrait size="h-32 w-32" ring="ring-in-pink" />
                </div>
                <div className="font-display text-4xl font-black leading-none">{CODE_NAME}.</div>
                <div className="mt-3 space-y-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-black/60">
                  <div>Status: in position</div>
                  <div>Channel: shielded only</div>
                  {s.contactAddress && <div className="normal-case tracking-normal text-black/45">{shortAddr(s.contactAddress, 14, 6)}</div>}
                  <div className="pt-1">
                    Identity: {IDENTITY.name} ·{" "}
                    <a href={IDENTITY.url} target="_blank" rel="noopener noreferrer" className="text-black underline decoration-black/30 underline-offset-2 hover:decoration-black">
                      Zilkroad ↗
                    </a>
                  </div>
                </div>
              </PlayingCard>

              <Panel className="space-y-6 p-6">
                <Steps labels={steps} current={step} />

                <div>
                  <span className="label mb-2 block text-muted">Amount ({config.ticker})</span>
                  <div className="grid grid-cols-3 gap-2">
                    {CHIPS.map((c) => {
                      const v = formatZats(c);
                      const selected = !otherAmount && amount === v;
                      const affordable = c + estFee <= available;
                      return (
                        <button
                          key={v}
                          type="button"
                          disabled={!affordable}
                          onClick={() => {
                            setOtherAmount(false);
                            setAmount(v);
                          }}
                          className={`min-h-12 rounded-[38px] font-mono text-base font-bold transition-colors disabled:opacity-30 ${
                            selected ? "bg-white text-black" : "ring-in-ash text-white hover:bg-white/5"
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="label mt-3 text-[11px] text-dim hover:text-white"
                    onClick={() => {
                      setOtherAmount(!otherAmount);
                      if (otherAmount) setAmount(formatZats(config.defaultSendZats));
                    }}
                  >
                    {otherAmount ? "− Use a quick amount" : "+ Other amount"}
                  </button>
                  {otherAmount && (
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                      inputMode="decimal"
                      autoFocus
                      className={`${field} mt-3 text-lg font-bold`}
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs leading-6 text-muted">
                  <div>
                    Shielded: <span className="font-bold text-white">{formatZats(available)}</span>
                  </div>
                  <div>
                    Fee (est.): <span className="font-bold text-white">{fee !== null ? formatZats(fee) : "—"}</span>
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

            {tx.error != null && <ErrorPanel error={tx.error} context="delivery" onRetry={deliver} />}
            {tx.error == null && (
              <div className="mx-auto max-w-xl">
                <SlideToDeliver
                  onConfirm={deliver}
                  lock={lock}
                  target={customOpen && custom.trim() ? "RECIPIENT" : CODE_NAME}
                />
              </div>
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
                  <RecipientTerminal received={contactReceived} zats={sentZats} />
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
function RecipientTerminal({ received, zats }: { received: boolean; zats: bigint }) {
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
          <div className="flex animate-fade-up flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex flex-col items-center gap-2">
              <Portrait size="h-24 w-24" ring="ring-in-violet" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-lavender">✓ Identity verified</span>
            </div>
            <div>
              <div className="font-display text-4xl font-black leading-none">Intelligence received.</div>
              <div className="mt-3 text-sm text-white/80">
                +{formatZats(zats)} {config.ticker} · shielded · sender and amount hidden from the public chain
              </div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.1em] text-dim">
                {CODE_NAME} = {IDENTITY.name} ·{" "}
                <a href={IDENTITY.url} target="_blank" rel="noopener noreferrer" className="text-white underline decoration-white/30 underline-offset-2 hover:decoration-pink">
                  Zilkroad ↗
                </a>
              </div>
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
