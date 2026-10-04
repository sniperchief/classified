export type EngineMode = "live" | "demo";

export interface Balances {
  /** Transparent (public) funds — visible to anyone on the chain. */
  transparent: bigint;
  /** Shielded funds that are confirmed and spendable (Sapling + Orchard). */
  shielded: bigint;
  /** Shielded funds waiting for confirmations (incoming or change). */
  shieldedPending: bigint;
}

export interface Addresses {
  /** Unified address (shielded receivers + transparent receiver). */
  unified: string;
  /** Transparent address — the "public drop point". */
  transparent: string;
}

export interface EngineSnapshot {
  mode: EngineMode;
  status: "idle" | "booting" | "ready" | "error";
  hasWallet: boolean;
  agent: Addresses | null;
  /** Recipient address for the handoff (contact's unified address). */
  contactAddress: string | null;
  /** True when the contact account lives in this browser, so receipt can be observed. */
  contactIsLocal: boolean;
  agentBalance: Balances;
  contactBalance: Balances;
  chainTip: number;
  scannedHeight: number;
  syncing: boolean;
  lastSyncAt: number | null;
  bootError: unknown;
}

export type TxStage = "build" | "sign" | "prove" | "broadcast";

export interface TxStatus {
  state: "pending" | "confirmed" | "expired" | "unknown";
  confirmations: number;
  height?: number;
  /** Real txid, when the engine had to track the tx by a provisional key. */
  txid?: string;
}

export interface MissionEngine {
  readonly mode: EngineMode;
  getSnapshot(): EngineSnapshot;
  subscribe(fn: () => void): () => void;

  /** Load WASM / restore any saved wallet. Idempotent. */
  boot(): Promise<void>;
  /** Create a fresh wallet. Returns the 24-word recovery phrase so the player can see it once. */
  createWallet(): Promise<string>;
  /** Restore a wallet from an existing 24-word phrase. */
  restoreWallet(phrase: string, birthdayHeight?: number): Promise<void>;
  /** Permanently delete the local wallet. */
  burnWallet(): Promise<void>;
  /** Read the recovery phrase back (for the player's own backup). */
  revealPhrase(): string | null;

  /** Trigger a sync now (deduplicated). */
  syncNow(): Promise<void>;
  /** Keep syncing in the background while the game runs. */
  startAutoSync(): void;

  quoteFee(to: string, zats: bigint): Promise<bigint>;
  shield(onStage: (s: TxStage) => void): Promise<string>;
  send(to: string, zats: bigint, onStage: (s: TxStage) => void): Promise<string>;
  txStatus(txid: string): Promise<TxStatus>;
  /** Status of this txid as seen from the contact's (receiving) wallet. */
  contactReceipt(txid: string): Promise<TxStatus>;
  /** Basic network/format validation for a recipient address. */
  validateAddress(addr: string): string | null;
  /** Demo mode only: simulate the handler's transfer arriving. */
  demoFund?(): Promise<void>;
}
