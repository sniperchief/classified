// DEMO engine: a clearly-labelled simulation for judging environments where
// the live testnet flow can't run (no cross-origin isolation, flaky network,
// faucet rate limits). Nothing here touches a blockchain, every txid starts
// with "DEMO-", and the UI shows a DEMO TRANSACTION badge wherever it's used.

import { checkAddress } from "./address";
import type { Balances, EngineSnapshot, MissionEngine, TxStage, TxStatus } from "./types";

const ZERO: Balances = { transparent: 0n, shielded: 0n, shieldedPending: 0n };
const DEMO_FEE = 15_000n;
const CONFIRM_MS = 6_000;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function demoId(): string {
  const b = crypto.getRandomValues(new Uint8Array(12));
  return "DEMO-" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

const DEMO_PHRASE = "demo mode does not create a real wallet so there is no recovery phrase to protect";

export class DemoEngine implements MissionEngine {
  readonly mode = "demo" as const;
  private listeners = new Set<() => void>();
  private txs = new Map<string, { at: number; contact: boolean }>();
  private snap: EngineSnapshot = {
    mode: "demo",
    status: "idle",
    hasWallet: false,
    agent: null,
    contactAddress: null,
    contactIsLocal: true,
    agentBalance: { ...ZERO },
    contactBalance: { ...ZERO },
    chainTip: 0,
    scannedHeight: 0,
    syncing: false,
    lastSyncAt: null,
    bootError: null,
  };

  getSnapshot = () => this.snap;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  private set(patch: Partial<EngineSnapshot>) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((l) => l());
  }

  async boot() {
    this.set({ status: "ready", chainTip: 1_000_000, scannedHeight: 1_000_000 });
  }

  async createWallet() {
    await wait(1200);
    this.set({
      hasWallet: true,
      agent: { unified: "utest1-DEMO-SAFEHOUSE-NOT-A-REAL-ADDRESS", transparent: "tm-DEMO-PUBLIC-DROP-NOT-REAL" },
      contactAddress: "utest1-DEMO-CONTACT-NIGHTJAR-NOT-REAL",
    });
    return DEMO_PHRASE;
  }
  async restoreWallet() {
    await this.createWallet();
  }
  async burnWallet() {
    this.txs.clear();
    this.set({ hasWallet: false, agent: null, agentBalance: { ...ZERO }, contactBalance: { ...ZERO } });
  }
  revealPhrase() {
    return this.snap.hasWallet ? DEMO_PHRASE : null;
  }

  /** Simulates the faucet drop arriving at the public address. */
  async demoFund() {
    await wait(2500);
    const b = this.snap.agentBalance;
    this.set({ agentBalance: { ...b, transparent: b.transparent + 12_500_000n } });
  }

  async syncNow() {
    this.set({ lastSyncAt: Date.now(), chainTip: this.snap.chainTip + 1, scannedHeight: this.snap.chainTip + 1 });
  }
  startAutoSync() {}

  async quoteFee() {
    return DEMO_FEE;
  }

  private async fakeStages(onStage: (s: TxStage) => void) {
    onStage("build");
    await wait(700);
    onStage("prove");
    await wait(2200);
    onStage("sign");
    await wait(700);
    onStage("broadcast");
    await wait(800);
  }

  async shield(onStage: (s: TxStage) => void) {
    const b = this.snap.agentBalance;
    if (b.transparent <= DEMO_FEE) throw new Error("InsufficientFunds: no transparent funds to shield");
    await this.fakeStages(onStage);
    const id = demoId();
    this.txs.set(id, { at: Date.now(), contact: false });
    this.set({ agentBalance: { transparent: 0n, shielded: b.shielded, shieldedPending: b.transparent - DEMO_FEE } });
    setTimeout(() => {
      const a = this.snap.agentBalance;
      this.set({ agentBalance: { ...a, shielded: a.shielded + a.shieldedPending, shieldedPending: 0n } });
    }, CONFIRM_MS);
    return id;
  }

  async send(to: string, zats: bigint, onStage: (s: TxStage) => void) {
    const b = this.snap.agentBalance;
    if (zats + DEMO_FEE > b.shielded) throw new Error("InsufficientFunds: not enough shielded funds");
    await this.fakeStages(onStage);
    const id = demoId();
    const toContact = to === this.snap.contactAddress;
    const toSelfPublic = to === this.snap.agent?.transparent;
    this.txs.set(id, { at: Date.now(), contact: toContact });
    this.set({ agentBalance: { ...b, shielded: b.shielded - zats - DEMO_FEE } });
    setTimeout(() => {
      const a = this.snap.agentBalance;
      const c = this.snap.contactBalance;
      this.set({
        agentBalance: toSelfPublic ? { ...a, transparent: a.transparent + zats } : a,
        contactBalance: toContact ? { ...c, shielded: c.shielded + zats } : c,
      });
    }, CONFIRM_MS);
    return id;
  }

  private status(txid: string): TxStatus {
    const t = this.txs.get(txid);
    if (!t) return { state: "unknown", confirmations: 0 };
    const confirmed = Date.now() - t.at >= CONFIRM_MS;
    return { state: confirmed ? "confirmed" : "pending", confirmations: confirmed ? 1 : 0 };
  }
  async txStatus(txid: string) {
    return this.status(txid);
  }
  async contactReceipt(txid: string) {
    return this.txs.get(txid)?.contact ? this.status(txid) : { state: "unknown" as const, confirmations: 0 };
  }
  validateAddress(addr: string) {
    if (addr === this.snap.contactAddress || addr === this.snap.agent?.transparent) return null;
    return checkAddress(addr, "test");
  }
}
