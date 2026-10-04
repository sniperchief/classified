import { useEffect, useState } from "react";
import { config } from "../config";
import type { TxStatus } from "../zcash";
import { useGame } from "./state";

/**
 * Poll the wallet until `txid` is mined with enough confirmations.
 * side="contact" watches the receiving (contact) account instead.
 */
export function useTxWatch(txid: string | undefined, side: "agent" | "contact" = "agent") {
  const { engine } = useGame();
  const [status, setStatus] = useState<TxStatus | null>(null);

  useEffect(() => {
    setStatus(null);
    if (!engine || !txid) return;
    let alive = true;
    let timer: number | undefined;
    const poll = async () => {
      try {
        await engine.syncNow();
        const s = side === "agent" ? await engine.txStatus(txid) : await engine.contactReceipt(txid);
        if (!alive) return;
        setStatus(s);
        if (isFinal(s)) return;
      } catch (e) {
        console.warn("[classified] tx watch", e);
      }
      if (alive) timer = window.setTimeout(poll, engine.mode === "demo" ? 1000 : 8000);
    };
    poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [engine, txid, side]);

  return status;
}

export const isConfirmed = (s: TxStatus | null) => !!s && s.state === "confirmed" && s.confirmations >= config.minConfirmations;
const isFinal = (s: TxStatus) => isConfirmed(s) || s.state === "expired";

/** Seconds elapsed since `since` (ms timestamp), ticking every second. */
export function useElapsed(since: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!since) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [since]);
  return since ? Math.max(0, Math.floor((now - since) / 1000)) : 0;
}
