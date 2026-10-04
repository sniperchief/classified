// LIVE engine: a real Zcash light wallet running entirely in the browser.
//
// WebZjs (librustzcash compiled to WASM, driven through walletCore.ts) scans compact
// blocks from a gRPC-web lightwalletd proxy,
// builds transactions as PCZTs, signs + proves them locally and broadcasts through
// the same proxy. No backend; keys never leave the browser. This class is the
// game-facing client: it keeps the snapshot, balances and confirmation tracking.

import { generateMnemonic, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { config } from "../config";
import { toBigInt } from "../lib/format";
import { checkAddress } from "./address";
import { saplingFromUnified, transparentFromUnified } from "./unified";
import { vault, walletDb, type Vault } from "./storage";
import type { Balances, EngineSnapshot, MissionEngine, TxStage, TxStatus } from "./types";
import { WalletCore } from "./walletCore";

const ZERO: Balances = { transparent: 0n, shielded: 0n, shieldedPending: 0n };
const NET = config.network;

/* ───────────── Helpers ───────────── */

/** serde-wasm-bindgen values arrive as plain objects or [key, value] pair lists. */
function field(obj: unknown, key: string | number): unknown {
  if (obj == null) return undefined;
  if (obj instanceof Map) return obj.get(key);
  if (Array.isArray(obj)) {
    const hit = obj.find((e) => Array.isArray(e) && e.length === 2 && e[0] === key);
    return hit ? hit[1] : undefined;
  }
  return (obj as Record<string | number, unknown>)[key];
}

function readBalances(accountBalances: unknown, accountId: number): Balances {
  const b = field(accountBalances, accountId);
  if (!b) return { ...ZERO };
  const n = (k: string) => toBigInt(field(b, k));
  return {
    transparent: n("unshielded_balance"),
    shielded: n("sapling_balance") + n("orchard_balance") + n("ironwood_balance"),
    shieldedPending: n("pending_change") + n("pending_spendable"),
  };
}

/** A panicking WASM call never settles; surface that as an error instead of an endless spinner. */
function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`TIMEOUT: ${what} did not respond within ${ms / 1000}s`)), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}

function reverseHex(h: string): string {
  return (h.match(/../g) || []).reverse().join("");
}
const sameTxid = (a: string, b: string) => {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x === y || x === reverseHex(y);
};

function statusFrom(raw: unknown): TxStatus["state"] {
  if (raw === 0 || raw === "Confirmed") return "confirmed";
  if (raw === 1 || raw === "Pending") return "pending";
  if (raw === 2 || raw === "Expired") return "expired";
  return "unknown";
}

/* ───────────── Engine ───────────── */

export class LiveEngine implements MissionEngine {
  readonly mode = "live" as const;
  private w: WalletCore | null = null;
  private v: Vault | null = null;
  private listeners = new Set<() => void>();
  private syncPromise: Promise<void> | null = null;
  private autoSync: number | null = null;
  private bootPromise: Promise<void> | null = null;
  private snap: EngineSnapshot = {
    mode: "live",
    status: "idle",
    hasWallet: false,
    agent: null,
    contactAddress: null,
    contactIsLocal: !config.contactAddress,
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

  private get worker(): WalletCore {
    if (!this.w) throw new Error("NO_WALLET: wallet engine not started");
    return this.w;
  }

  boot(): Promise<void> {
    if (!this.bootPromise) {
      this.set({ status: "booting", bootError: null });
      this.bootPromise = (async () => {
        if (!self.crossOriginIsolated) {
          throw new Error("ENV_NOT_ISOLATED: page is not cross-origin isolated (COOP/COEP headers missing)");
        }
        this.w = new WalletCore();
        await withTimeout(
          this.worker.call("init", {
            network: NET,
            url: config.lightwalletdUrl,
            minConf: config.minConfirmations,
            webzUrl: new URL(`${import.meta.env.BASE_URL}webzjs/webzjs_wallet.js`, location.href).href,
          }),
          90_000,
          "loading the wallet engine",
        );
        const saved = vault.load(NET);
        if (saved) {
          // Rebuild from the phrase and rescan from the birthday (see ARCHITECTURE.md › Persistence).
          const ids = await this.worker.call("setup", { phrase: saved.phrase, birthday: saved.birthday });
          this.v = { ...saved, ...ids };
          await this.loadAddresses();
        }
        // Remove DBs saved by earlier builds; they crash on load.
        await walletDb.clear(NET).catch(() => undefined);
        this.set({ status: "ready" });
      })().catch((e) => {
        this.bootPromise = null;
        this.set({ status: "error", bootError: e });
        throw e;
      });
    }
    return this.bootPromise;
  }

  private async loadAddresses() {
    const v = this.v!;
    const unified = await this.worker.call("address", { accountId: v.agentId });
    const contactUa = await this.worker.call("address", { accountId: v.contactId });
    // Not get_current_address_transparent(): it panics in some WebZjs builds.
    const transparent = transparentFromUnified(unified, NET);
    if (!transparent) throw new Error("NO_TRANSPARENT: unified address has no transparent receiver");
    // Deliver to the contact's Sapling receiver so the whole flow stays in the Sapling pool
    // (WebZjs can't build Orchard/Ironwood outputs on post-NU6.3 testnet).
    const contactSapling = saplingFromUnified(contactUa, NET);
    this.set({
      hasWallet: true,
      agent: { unified, transparent },
      contactAddress: config.contactAddress || contactSapling || contactUa,
    });
  }

  createWallet(): Promise<string> {
    return withTimeout(this.createWalletInner(), 120_000, "safehouse setup");
  }
  private async createWalletInner(): Promise<string> {
    await this.boot();
    // 256 bits of entropy from crypto.getRandomValues -> 24 words.
    const phrase = generateMnemonic(wordlist, 256);
    const tip = await this.worker.call("latestBlock");
    // A fresh wallet cannot have history: start scanning just below the tip.
    await this.setupAccounts(phrase, Math.max(1, tip - 10));
    return phrase;
  }

  async restoreWallet(phrase: string, birthdayHeight?: number): Promise<void> {
    await this.boot();
    const clean = phrase.trim().toLowerCase().split(/\s+/).join(" ");
    if (!validateMnemonic(clean, wordlist)) throw new Error("BAD_PHRASE: invalid recovery phrase");
    let birthday = birthdayHeight;
    if (!birthday) {
      const taddr = await this.worker.call("defaultTransparent", { phrase: clean });
      const detected = taddr ? await this.worker.call("detectBirthday", { taddr }) : null;
      // Fallback: ~30 days of testnet blocks (75s block target).
      birthday = detected ?? Math.max(1, (await this.worker.call("latestBlock")) - 35_000);
    }
    await this.setupAccounts(clean, birthday);
  }

  private async setupAccounts(phrase: string, birthday: number) {
    const ids = await this.worker.call("setup", { phrase, birthday });
    this.v = { network: NET, phrase, birthday, ...ids };
    vault.save(this.v);
    await this.loadAddresses();
    this.set({ scannedHeight: birthday });
  }

  async burnWallet() {
    this.stopAutoSync();
    vault.clear();
    await walletDb.clear(NET).catch(() => undefined);
    this.v = null;
    this.set({
      hasWallet: false,
      agent: null,
      contactAddress: null,
      agentBalance: { ...ZERO },
      contactBalance: { ...ZERO },
      scannedHeight: 0,
      lastSyncAt: null,
    });
  }

  revealPhrase() {
    return this.v?.phrase ?? null;
  }

  syncNow(): Promise<void> {
    if (!this.w || !this.v) return Promise.resolve();
    if (this.syncPromise) return this.syncPromise;
    this.set({ syncing: true });
    this.syncPromise = (async () => {
      try {
        await this.worker.call("sync");
        await this.refreshSummary();
        this.set({ lastSyncAt: Date.now() });
      } finally {
        this.syncPromise = null;
        this.set({ syncing: false });
      }
    })();
    return this.syncPromise;
  }

  private async refreshSummary() {
    const summary = (await this.worker.call("summary")) as {
      chain_tip_height: number;
      fully_scanned_height: number;
      account_balances: unknown;
    } | null;
    if (!summary) {
      this.set({ chainTip: await this.worker.call("latestBlock") });
      return;
    }
    if (import.meta.env.DEV) console.debug("[classified] wallet summary", summary);
    this.set({
      chainTip: summary.chain_tip_height,
      scannedHeight: summary.fully_scanned_height,
      agentBalance: readBalances(summary.account_balances, this.v!.agentId),
      contactBalance: readBalances(summary.account_balances, this.v!.contactId),
    });
  }

  startAutoSync() {
    if (this.autoSync) return;
    const tick = () => this.syncNow().catch((e) => console.warn("[classified] sync failed", e));
    tick();
    this.autoSync = window.setInterval(tick, config.syncIntervalMs);
  }
  private stopAutoSync() {
    if (this.autoSync) clearInterval(this.autoSync);
    this.autoSync = null;
  }

  /**
   * Validates the transfer against the real wallet (address, funds) by building a
   * proposal, and returns the ZIP-317 fee estimate for a simple shielded transfer.
   * This WebZjs build doesn't expose the proposal's exact fee.
   */
  async quoteFee(to: string, zats: bigint): Promise<bigint> {
    await this.worker.call("propose", { accountId: this.v!.agentId, to: to.trim(), zats });
    return 10_000n; // ZIP-317: 5,000 zats x max(2, logical actions)
  }

  /*
   * This WebZjs build can't report a PCZT's txid, so shield/send return a pending key
   * ("pending:<height>") that resolves to the real txid from the wallet's own history
   * once the transaction shows up (see findTx).
   */
  async shield(onStage: (s: TxStage) => void): Promise<string> {
    const sentAt = await withTimeout(
      this.worker.call("shield", { accountId: this.v!.agentId, phrase: this.v!.phrase }, onStage),
      360_000,
      "the shielding transaction",
    );
    this.syncNow().catch(() => undefined);
    return `pending:${sentAt}`;
  }

  async send(to: string, zats: bigint, onStage: (s: TxStage) => void): Promise<string> {
    const err = this.validateAddress(to);
    if (err) throw new Error(`BAD_ADDRESS: ${err}`);
    if (zats <= 0n) throw new Error("BAD_AMOUNT: amount must be positive");
    const sentAt = await withTimeout(
      this.worker.call("send", { accountId: this.v!.agentId, phrase: this.v!.phrase, to: to.trim(), zats }, onStage),
      360_000,
      "the transfer",
    );
    this.syncNow().catch(() => undefined);
    return `pending:${sentAt}`;
  }

  private async history(accountId: number) {
    const list = await this.worker.call("history", { accountId });
    return list.map((e) => {
      const height = field(e, "block_height");
      return {
        txid: String(field(e, "txid") ?? ""),
        status: {
          state: statusFrom(field(e, "status")),
          confirmations: Number(field(e, "confirmations") ?? 0),
          height: typeof height === "number" ? height : undefined,
        } as TxStatus,
      };
    });
  }

  private async findTx(accountId: number, id: string): Promise<TxStatus> {
    const list = await this.history(accountId);
    if (id.startsWith("pending:")) {
      // The agent's first transaction mined at/after the send height (or still unmined).
      const sentAt = Number(id.slice(8));
      const hit = list.find((e) => e.txid && (e.status.height === undefined ? e.status.state === "pending" : e.status.height >= sentAt));
      return hit ? { ...hit.status, txid: hit.txid } : { state: "unknown", confirmations: 0 };
    }
    const hit = list.find((e) => e.txid && sameTxid(e.txid, id));
    return hit ? { ...hit.status, txid: hit.txid } : { state: "unknown", confirmations: 0 };
  }

  txStatus(txid: string) {
    return this.findTx(this.v!.agentId, txid);
  }

  contactReceipt(txid: string) {
    if (!this.snap.contactIsLocal || txid.startsWith("pending:")) return Promise.resolve<TxStatus>({ state: "unknown", confirmations: 0 });
    return this.findTx(this.v!.contactId, txid);
  }

  validateAddress(addr: string) {
    return checkAddress(addr, NET);
  }
}
