import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { explorerTx } from "../config";
import type { TxStage } from "../zcash";
import { DemoBadge, ExternalLink, Panel } from "./ui";

export type Phase = "idle" | TxStage | "confirming" | "confirmed";

const STEPS: { key: Phase; label: string; note: string }[] = [
  { key: "build", label: "Building transaction", note: "Selecting funds and recipients" },
  { key: "prove", label: "Generating zero-knowledge proof", note: "Proves the transfer is valid without revealing it" },
  { key: "sign", label: "Signing with your spending key", note: "Your key never leaves this device" },
  { key: "broadcast", label: "Broadcasting to the Zcash network", note: "Handing the sealed package to the relay" },
  { key: "confirming", label: "Awaiting block confirmation", note: "Blocks arrive about every 75 seconds" },
];
const ORDER: Phase[] = ["idle", "build", "prove", "sign", "broadcast", "confirming", "confirmed"];

const TIPS = [
  "A zero-knowledge proof lets the network verify a transfer is valid without learning who sent it, who received it, or how much.",
  "Zcash blocks arrive roughly every 75 seconds. A transfer is final once it's inside a block.",
  "Shielded testnet addresses start with 'utest1'. On mainnet they start with 'u1'.",
  "Your recovery phrase is the master key. Whoever holds it controls the funds.",
  "Transparent addresses work like Bitcoin: every amount and address is public, forever.",
  "Testnet coins (TAZ) have no monetary value. That's what makes them perfect for training.",
];

type NodeTone = "gold" | "violet" | "pink" | "red";
const LIT: Record<NodeTone, string> = {
  gold: "bg-lemon text-black ring-in-black",
  violet: "bg-lavender text-black ring-in-violet",
  pink: "bg-white text-black ring-in-pink",
  red: "bg-white text-black ring-in-red",
};

export function TxCinematic({
  phase,
  nodes,
  txid,
  demo,
  elapsed,
  doneLabel,
}: {
  phase: Phase;
  nodes: { icon: ReactNode; label: string; sub?: string; tone?: NodeTone }[];
  txid?: string;
  demo?: boolean;
  elapsed?: number;
  doneLabel: string;
}) {
  const p = ORDER.indexOf(phase);
  const lit = [p >= 1, p >= ORDER.indexOf("prove"), p >= ORDER.indexOf("confirmed")];
  const flowing = p >= 1 && phase !== "confirmed";
  const defaults: NodeTone[] = ["gold", "violet", "pink"];

  return (
    <div className="space-y-6">
      {/* The table: three cards, flipped face-up as the real pipeline advances */}
      <div className="flex flex-col items-center gap-3 py-4 sm:flex-row sm:justify-center sm:gap-0">
        {nodes.map((n, i) => {
          const tone = n.tone ?? defaults[i];
          const tilt = (i - 1) * 5;
          return (
            <div key={i} className="contents">
              <div className="flex flex-col items-center">
                <div
                  key={lit[i] ? "up" : "down"}
                  className={`relative flex h-44 w-32 flex-col items-center justify-between rounded-[14px] p-3 sm:h-52 sm:w-36 ${
                    lit[i] ? `animate-flip ${LIT[tone]}` : "card-back ring-in-ash tilt text-dim"
                  }`}
                  style={{ "--tilt": `${tilt}deg` } as CSSProperties}
                >
                  {lit[i] ? (
                    <>
                      <span className="self-start font-mono text-[10px] font-bold">0{i + 1}</span>
                      <div className="h-14 w-14">{n.icon}</div>
                      <div className="text-center">
                        <div className="font-display text-sm font-black uppercase leading-tight">{n.label}</div>
                        {n.sub && <div className="mt-0.5 font-mono text-[9px] font-bold tracking-[0.12em] opacity-60">{n.sub}</div>}
                      </div>
                    </>
                  ) : (
                    <span className="m-auto font-mono text-2xl font-bold">?</span>
                  )}
                  {i === 1 && lit[1] && flowing && <span className="absolute inset-0 animate-pulse-ring rounded-[14px] border-2 border-violet" />}
                </div>
              </div>
              {i < nodes.length - 1 && (
                <div className="flex h-8 items-center justify-center sm:h-auto sm:w-20">
                  <span className={`font-mono text-lg font-bold ${lit[i + 1] ? "text-white" : flowing && lit[i] ? "animate-pulse text-pink" : "text-dim"}`}>
                    <span className="sm:hidden">↓</span>
                    <span className="hidden sm:inline">→</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal log: mirrors the real wallet pipeline */}
      <Panel fill="carbon" tone="ash" className="p-5 font-mono text-[13px] sm:p-6">
        <div className="label mb-3 text-[10px] text-dim">Secure channel // operation log</div>
        {STEPS.map((s) => {
          const idx = ORDER.indexOf(s.key);
          const state = p > idx ? "done" : p === idx ? "active" : "todo";
          return (
            <div key={s.key} className={`flex items-start gap-3 py-1 ${state === "todo" ? "text-dim" : "text-white"}`}>
              <span className={`w-7 shrink-0 font-bold ${state === "done" ? "text-white" : state === "active" ? "text-pink" : ""}`}>
                {state === "done" ? "[✓]" : state === "active" ? <Spinner /> : "[ ]"}
              </span>
              <div className="min-w-0">
                <span>{s.label}</span>
                {s.key === "confirming" && state === "active" && elapsed !== undefined && <span className="ml-2 text-gold">{fmtTime(elapsed)}</span>}
                {state === "active" && <div className="text-[11px] text-muted">{s.note}</div>}
              </div>
            </div>
          );
        })}
        {phase === "confirmed" && (
          <div className="flex items-center gap-3 py-1 font-bold text-white">
            <span className="w-7">[✓]</span>
            <span className="uppercase tracking-[0.08em]">{doneLabel}</span>
          </div>
        )}

        {txid && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ash pt-4">
            <span className="label text-[10px] text-dim">TX</span>
            {txid.startsWith("pending:") ? (
              <span className="min-w-0 flex-1 text-[11px] text-muted">Broadcast. Transaction ID appears once the network picks it up…</span>
            ) : (
              <>
                <code className="min-w-0 flex-1 truncate text-[11px] text-muted">{txid}</code>
                {demo ? <DemoBadge /> : <ExternalLink href={explorerTx(txid)}>View on chain</ExternalLink>}
              </>
            )}
          </div>
        )}
      </Panel>

      {phase === "confirming" && <RotatingTip />}
    </div>
  );
}

function Spinner() {
  const frames = ["[|]", "[/]", "[-]", "[\\]"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % frames.length), 120);
    return () => clearInterval(t);
  }, []);
  return <>{frames[i]}</>;
}

function RotatingTip() {
  const [i, setI] = useState(() => Math.floor(Math.random() * TIPS.length));
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % TIPS.length), 9000);
    return () => clearInterval(t);
  }, []);
  return (
    <div key={i} className="ring-in-gold animate-deal max-w-xl rounded-[14px] bg-black p-5" style={{ "--tilt": "-1deg" } as CSSProperties}>
      <div className="label text-[10px] text-gold">Field note</div>
      <p className="mt-2 text-[15px] leading-[1.7] text-white/90">{TIPS[i]}</p>
    </div>
  );
}

export function fmtTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
