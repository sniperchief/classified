// The WebZjs wallet core: every call into the WASM library goes through here.
//
// WebZjs must be driven from the page's main thread (its `sync` spawns its own worker and
// asserts it isn't in one). Heavy work happens on WebZjs' own threads: sync, and — with our
// patch 0002 — proving, whose Sapling prover blocks on Atomics.wait and so can't run on the
// main thread. LiveEngine talks to this core through a small serialized request API.

import type * as Webz from "../../vendor/webzjs-wallet/webzjs_wallet";
import type { WebWallet } from "../../vendor/webzjs-wallet/webzjs_wallet";
import { mnemonicToSeedSync } from "@scure/bip39";

export type Network = "test" | "main";
export type Stage = "build" | "sign" | "prove" | "broadcast";

export interface Api {
  init(a: { network: Network; url: string; minConf: number; webzUrl: string }): Promise<void>;
  /** Replace the wallet with a fresh one holding agent (0) + contact (1) accounts. */
  setup(a: { phrase: string; birthday: number }): Promise<{ agentId: number; contactId: number }>;
  latestBlock(): Promise<number>;
  defaultTransparent(a: { phrase: string }): Promise<string | null>;
  detectBirthday(a: { taddr: string }): Promise<number | null>;
  address(a: { accountId: number }): Promise<string>;
  sync(): Promise<void>;
  summary(): Promise<unknown>;
  history(a: { accountId: number }): Promise<unknown[]>;
  propose(a: { accountId: number; to: string; zats: bigint }): Promise<void>;
  shield(a: { accountId: number; phrase: string }): Promise<number>;
  send(a: { accountId: number; phrase: string; to: string; zats: bigint }): Promise<number>;
}

const nativeImport = new Function("u", "return import(u)") as (u: string) => Promise<unknown>;

let W: typeof Webz;
let net: Network = "test";
let url = "";
let minConf = 1;
let wallet: WebWallet | null = null;

function need(): WebWallet {
  if (!wallet) throw new Error("NO_WALLET: wallet not initialized");
  return wallet;
}

/** Convert wasm-bindgen / serde values (Maps, class instances) into structured-clone-safe data. */
function plain(v: unknown): unknown {
  if (v == null || typeof v !== "object") return v;
  if (v instanceof Map) return Array.from(v.entries()).map(([k, x]) => [plain(k), plain(x)]);
  if (Array.isArray(v)) return v.map(plain);
  const obj = v as { toJSON?: () => unknown };
  if (typeof obj.toJSON === "function") return plain(obj.toJSON());
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) out[k] = plain(x);
  return out;
}

/**
 * prove -> sign -> broadcast with the account key; returns the chain height at send time.
 *
 * Proving goes first: WebZjs' pczt_prove is what attaches the Sapling proof generation key to
 * each Sapling spend, and the PCZT signer verifies spends against that key — signing first
 * fails with SaplingVerify(MissingProofGenerationKey). Proofs don't depend on the
 * signatures, so this order is valid.
 *
 * Which Sapling key: shielding (propose_shielding) sends funds to the account's *internal*
 * Sapling address, and our change goes there too, so we prove with the internal key first.
 * Notes received from outside (e.g. a faucet paying the unified address) belong to the
 * external key; if signing reports WrongFvkForNote we re-prove the saved PCZT with it.
 * (Patch 0003 makes the signer itself try both keys.)
 */
async function authorizeAndSend(pczt: Webz.Pczt, phrase: string, stage: (s: Stage) => void): Promise<number> {
  const w = need();
  const sentAt = Number(await w.get_latest_block());
  const unsigned = pczt.serialize();
  const seed = mnemonicToSeedSync(phrase);
  const attempt = async (scope: "internal" | "external", p: Webz.Pczt) => {
    // Fresh key handles per attempt: each call takes ownership of the one passed to it.
    const keyHolder = new W.UnifiedSpendingKey(net, seed, 0);
    const proofKey = scope === "internal" ? keyHolder.to_sapling_internal_proof_generation_key() : keyHolder.to_sapling_proof_generation_key();
    stage("prove");
    const proved = await w.pczt_prove(p, proofKey);
    stage("sign");
    return W.pczt_sign(net, proved, new W.UnifiedSpendingKey(net, seed, 0), new W.SeedFingerprint(seed));
  };
  let signed: Webz.Pczt;
  try {
    signed = await attempt("internal", pczt);
  } catch (e) {
    if (!String((e as Error)?.message ?? e).includes("WrongFvkForNote")) throw e;
    signed = await attempt("external", W.Pczt.from_bytes(unsigned));
  } finally {
    seed.fill(0);
  }
  stage("broadcast");
  await w.pczt_send(signed);
  return sentAt;
}

function makeApi(stage: (s: Stage) => void): Api {
  return {
    async init(a) {
      net = a.network;
      url = a.url;
      minConf = a.minConf;
      if (!W) {
        W = (await nativeImport(a.webzUrl)) as typeof Webz;
        await W.default();
        const threads = Math.min(Math.max(navigator.hardwareConcurrency || 4, 2), 8);
        await W.initThreadPool(threads);
      }
    },
    async setup({ phrase, birthday }) {
      const w = new W.WebWallet(net, url, minConf, minConf, null);
      const agentId = await w.create_account("agent", phrase, 0, birthday);
      const contactId = await w.create_account("contact", phrase, 1, birthday);
      wallet?.free();
      wallet = w;
      return { agentId, contactId };
    },
    async latestBlock() {
      const w = wallet ?? new W.WebWallet(net, url, minConf, minConf, null);
      const tip = Number(await w.get_latest_block());
      if (!wallet) w.free();
      return tip;
    },
    async defaultTransparent({ phrase }) {
      const usk = new W.UnifiedSpendingKey(net, mnemonicToSeedSync(phrase), 0);
      return usk.to_unified_full_viewing_key().get_transparent_address(net) ?? null;
    },
    async detectBirthday({ taddr }) {
      const w = new W.WebWallet(net, url, minConf, minConf, null);
      try {
        return (await w.detect_birthday_from_transparent_address(taddr)) ?? null;
      } catch {
        return null;
      } finally {
        w.free();
      }
    },
    async address({ accountId }) {
      return need().get_current_address(accountId);
    },
    async sync() {
      await need().sync();
    },
    async summary() {
      const s = await need().get_wallet_summary();
      if (!s) return null;
      return {
        chain_tip_height: s.chain_tip_height,
        fully_scanned_height: s.fully_scanned_height,
        account_balances: plain(s.account_balances),
      };
    },
    async history({ accountId }) {
      const res = await need().get_transaction_history(accountId, 50, 0);
      return (plain(res.transactions) as unknown[]) ?? [];
    },
    async propose({ accountId, to, zats }) {
      const p = await need().propose_transfer(accountId, to, zats);
      p.free();
    },
    async shield({ accountId, phrase }) {
      stage("build");
      const pczt = await need().pczt_shield(accountId);
      return authorizeAndSend(pczt, phrase, stage);
    },
    async send({ accountId, phrase, to, zats }) {
      stage("build");
      const pczt = await need().pczt_create(accountId, to, zats);
      return authorizeAndSend(pczt, phrase, stage);
    },
  };
}

/** In-process client with the same shape the engine uses. Requests run one at a time, in
 *  order, because WebZjs shares one wallet database. */
export class WalletCore {
  private queue: Promise<unknown> = Promise.resolve();

  call<K extends keyof Api>(method: K, args?: Parameters<Api[K]>[0], onStage?: (s: Stage) => void): ReturnType<Api[K]> {
    const api = makeApi((s) => onStage?.(s));
    const run = this.queue.then(() => (api[method] as (a: unknown) => Promise<unknown>)(args));
    this.queue = run.catch(() => undefined);
    return run as ReturnType<Api[K]>;
  }
}
