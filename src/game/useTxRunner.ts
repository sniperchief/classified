import { useCallback, useEffect, useState } from "react";
import type { Phase } from "../components/TxCinematic";
import { sfx } from "../lib/sound";
import type { TxStage } from "../zcash";
import { isConfirmed, useElapsed, useTxWatch } from "./useTxWatch";

/**
 * Drives one on-chain operation: run -> stages -> broadcast -> wait for confirmation.
 * `txid` is owned by the caller (persisted in game progress) so a reload resumes watching.
 */
export function useTxRunner(txid: string | undefined, onTxid: (id: string | undefined) => void) {
  const [phase, setPhase] = useState<Phase>(txid ? "confirming" : "idle");
  const [error, setError] = useState<unknown>(null);
  const [since, setSince] = useState<number | null>(txid ? Date.now() : null);
  const status = useTxWatch(txid);
  const elapsed = useElapsed(phase === "confirming" ? since : null);

  useEffect(() => {
    if (!txid) return;
    // Replace a provisional "pending:<height>" key with the real txid as soon as it's known.
    if (status?.txid && status.txid !== txid && txid.startsWith("pending:")) {
      onTxid(status.txid);
      return;
    }
    if (isConfirmed(status)) {
      setPhase((p) => {
        if (p !== "confirmed") sfx.success();
        return "confirmed";
      });
    } else if (status?.state === "expired") {
      setError(new Error("Transaction expired before it was mined"));
      setPhase("idle");
      onTxid(undefined);
    }
  }, [status, txid, onTxid]);

  const run = useCallback(
    async (fn: (onStage: (s: TxStage) => void) => Promise<string>) => {
      setError(null);
      sfx.whoosh();
      try {
        const id = await fn((s) => {
          setPhase(s);
          sfx.tick();
        });
        sfx.lock();
        setSince(Date.now());
        setPhase("confirming");
        onTxid(id);
      } catch (e) {
        console.error("[classified] transaction failed", e);
        setError(e);
        setPhase("idle");
      }
    },
    [onTxid],
  );

  const busy = phase !== "idle" && phase !== "confirmed";
  return { phase, error, run, busy, elapsed, status, clearError: () => setError(null) };
}
