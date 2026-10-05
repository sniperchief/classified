# CLASSIFIED — Architecture

CLASSIFIED is a short spy game that teaches Zcash by putting the player through the
real onboarding journey: create a wallet, get ZEC, shield it, send it privately,
receive it, and (bonus) unshield it. Every on-chain step in **Live** mode is a real
Zcash **testnet** transaction made by a wallet running inside the player's browser.

## Overview

```
┌──────────────────────── Player's browser ────────────────────────┐
│  React game (Vite + TypeScript + Tailwind)                       │
│     screens/  ── mission UI, cinematics, explainers              │
│     game/     ── progress state, tx runner / confirmation watch  │
│     zcash/    ── MissionEngine interface                         │
│        ├─ LiveEngine ── walletCore → WebZjs (WASM, threaded)    │
│        └─ DemoEngine ── clearly-labelled simulation              │
└───────────────┬──────────────────────────────────────────────────┘
                │ gRPC-web (compact blocks, UTXOs, broadcast)
                ▼
     lightwalletd (testnet) behind a gRPC-web proxy
                │
                ▼
          Zcash testnet (Zebra / zcashd nodes)
```

There is **no backend**. Keys are generated, stored and used only in the browser.

## Components and where they come from

| Component | Source | Notes |
|---|---|---|
| Wallet engine | [WebZjs](https://github.com/ZcashCommunityGrants/WebZjs) (Zcash Community Grants–maintained; originally ChainSafe, Zcash Foundation grant) | **Built from source** by us (see "Building WebZjs"). Wraps official [librustzcash](https://github.com/zcash/librustzcash) crates (`zcash_client_backend`, `zcash_keys`, `zcash_primitives`, `pczt`, `orchard`, …) pinned to upstream rev `0a2c6d1a`. |
| In-memory wallet DB | `zcash_client_memory` (red-dev-inc fork used by WebZjs) | Implements librustzcash's `WalletRead`/`WalletWrite` traits in memory. |
| Address parsing | Implemented from [ZIP 316](https://zips.z.cash/zip-0316) (`src/zcash/unified.ts`) | Extracts the transparent receiver from a Unified Address (bech32m → F4Jumble⁻¹ → TLV). Cross-checked against WebZjs key derivation. |
| Light client server | `lightwalletd` testnet via gRPC-web proxy (`https://zcash-testnet.chainsafe.dev`, configurable) | Browsers can't speak raw gRPC; WebZjs requires a gRPC-web proxy. A self-hosted proxy (`grpcwebproxy` → `testnet.zec.rocks:443`, see WebZjs `justfile`) can be swapped in via `VITE_LIGHTWALLETD_URL`. |
| Test funds | Testnet faucet (`https://faucet.testnet.valargroup.dev`, configurable) | The faucet listed in the official testnet guide (faucet.zecpages.com) is offline. This one accepts transparent `tm…` addresses. |
| Explorer links | `testnet.zcashexplorer.app` (configurable) | Links only; never used as a data source. |
| Seed phrase | `@scure/bip39` (BIP-39, `crypto.getRandomValues`) | 24 words / 256-bit entropy. WebZjs' own generator warns it may not use secure randomness, so we don't use it. |

## Transaction flows (Live mode)

All transactions use the **PCZT** pipeline (Partially Created Zcash Transaction,
[ZIP 374-era `pczt` crate](https://github.com/zcash/librustzcash/tree/main/pczt)):
`create → prove → sign → send`. Proving goes first because WebZjs' `pczt_prove` attaches the
Sapling proof generation key that the signer needs to verify each Sapling spend.

| Mission | Action | WebZjs calls |
|---|---|---|
| 01 Safehouse | Create wallet | `generateMnemonic` → `new WebWallet("test", proxy, 1, 1)` → `create_account` ×2 (agent = ZIP-32 account 0, contact = account 1) at birthday = chain tip − 10 |
| 02 Intelligence | Receive test ZEC on transparent address | Player uses faucet; `sync()` refreshes UTXOs (`GetAddressUtxos`) and scans compact blocks; balances from `get_wallet_summary()` |
| 03 Shield | transparent → Sapling | `pczt_shield(agent)` → `pczt_prove` → `pczt_sign(usk, seedFp)` → `pczt_send` |
| 05 Handoff | Sapling → Sapling send to contact | `propose_transfer` (validation) → `pczt_create(agent, contactSaplingAddr, amount)` → sign → prove → send |
| 05 Receive | Contact detects the note | Contact account (same browser) is scanned in the same `sync()`; receipt found in `get_transaction_history(contact)` |
| Bonus | Sapling → transparent (unshield) | `pczt_create(agent, own t-addr, amount)` → sign → prove → send |

**Why Sapling, not Orchard.** Zcash testnet has activated NU6.3, under which payments to an
Orchard receiver land in the new *Ironwood* pool. WebZjs' in-memory wallet backend
(`zcash_client_memory`) does not yet track an Ironwood note-commitment tree (its own source
says so), so librustzcash refuses to build those transactions (`ProposalNotSupported`). We
therefore patch WebZjs' three change strategies from `ShieldedProtocol::Orchard` to
`ShieldedProtocol::Sapling` (`vendor/webzjs-wallet/patches/0001-sapling-change-pool.patch`)
and deliver to the contact's Sapling receiver (extracted from its Unified Address per ZIP 316).
Sapling is a fully supported shielded pool: amounts, sender and receiver stay encrypted.

**NU7 on testnet.** Zcash testnet activated NU7 ([ZIP 259](https://zips.z.cash/zip-0259)) at block
4,465,026, with consensus branch ID `0x77190AD9`. NU7 introduces no new transaction format (v5/v6
stay valid; only v4 is disallowed) and no changes to sighash, Sapling/Orchard rules or circuits — for
wallets the only change is the branch ID. WebZjs pins librustzcash `0a2c6d1a`, where NU7 exists only
behind the experimental `zcash_unstable = "nu7"` cfg with a placeholder ID, so its transactions were
stamped NU6.3 and dropped by the network. Patch `0004a-nu7-librustzcash.patch` (applied to a local
copy of librustzcash `0a2c6d1a`) mirrors upstream librustzcash commits `928592188` and `a0c73f6d4`:
NU7 becomes a regular upgrade with ID `0x7719_0AD9`, testnet activation 4,465,026 (mainnet unset),
v6 transactions and Orchard revision V3 — i.e. NU6.3 rules with a new ID. The experimental ZIP 233
code stays disabled (NU7 does not deploy ZIP 233). `0004b-nu7-webzjs.patch` points WebZjs'
`[patch.crates-io]` at the local copy and maps NU7 to the NU6.3 Orchard circuit.

**Internal vs external Sapling keys.** `propose_shielding` sends shielded funds to the
account's *internal* Sapling address (ZIP 316), and change goes there too. Upstream WebZjs signs
Sapling spends only with the external key and exposes only the external proof generation key,
so notes created by shielding couldn't be spent (`SaplingVerify(WrongFvkForNote)`). Patch
`0003-sapling-internal-keys.patch` adds `to_sapling_internal_proof_generation_key()` and makes
the signer fall back to the internal key; the game proves with the internal key first and
re-proves with the external one if the note turns out to be external.

**Confirmation.** The game never claims success at broadcast. A mission completes only
when the transaction appears in the wallet's history as mined with
`VITE_MIN_CONFIRMATIONS` confirmations (default 1; testnet blocks ≈ 75 s).

**Transaction IDs.** This WebZjs build can't return a PCZT's txid before broadcast, so the
engine records the chain height at send time (`pending:<height>`) and resolves the real txid
from the wallet history once the transaction is seen. Explorer links appear only for real txids.

**Contact / receiving.** By default Agent NIGHTJAR is a second account derived from the
player's seed, so the receive side is observable in the same browser. The transfer is still a
real shielded on-chain transaction. Set `VITE_CONTACT_ADDRESS` to deliver to an external wallet.

## Persistence

- The 24-word phrase, birthday height and account ids are kept in `localStorage`
  (`classified.vault.v1`) so the mission survives a reload. This is acceptable **only** because
  it's a testnet training wallet; the UI says so, and "Burn safehouse" deletes everything.
- The wallet database is **not** persisted. On load the wallet is rebuilt from the phrase and
  rescanned from its birthday (seconds for a minutes-old wallet). Earlier WebZjs builds panicked
  when deserializing a saved DB containing transparent outputs.
- Game progress (current mission, txids) is in `localStorage` (`classified.progress.v1`).

## Demo mode

`DemoEngine` implements the same interface with timers. It is chosen explicitly by the player
(link on the briefing screen, or offered when the live engine can't start). Every demo txid is
prefixed `DEMO-`, the header shows **DEMO MODE**, and each transaction shows a
**DEMO TRANSACTION** badge. Demo mode never contacts the network.

## Security assumptions

- Testnet only by default (`VITE_ZCASH_NETWORK=test`); mainnet addresses are rejected in the
  recipient field. TAZ has no value.
- Keys never leave the browser; no server, no database, no analytics.
- Spending keys are derived per signature from the phrase and freed afterwards.
- Recipient addresses are checked for network and encoding (`src/zcash/address.ts`) and then
  fully validated by librustzcash when the transfer is proposed, before anything is signed.
- Amounts are validated against the shielded balance plus fee.
- Raw wallet errors are translated into mission language, with technical details available
  in an expandable panel.
- `.env*` files are git-ignored; all `VITE_*` values are public by nature (no secrets exist).
- WebZjs and its memory DB have **not been audited** (stated by their maintainers). That is
  acceptable for a testnet teaching game, not for real funds.

## Proving off the main thread

The Sapling prover (bellman with `multicore`) blocks on `Atomics.wait` while its rayon threads
compute; browsers forbid that on the main thread ("Atomics.wait cannot be called in this
context"). WebZjs itself must be driven from the main thread (its `sync` spawns its own
`wasm_thread` worker and asserts it isn't already in one). Patch
`0002-prove-off-main-thread.patch` makes `pczt_prove` use the same pattern as `sync`: proving
runs on a spawned `wasm_thread` and the main thread only awaits the join. The game drives the
wallet through `src/zcash/walletCore.ts`, which serializes calls (one wallet database) and
reports stage events (build → prove → sign → broadcast) to the cinematic.

## Cross-origin isolation

WebZjs uses multi-threaded WASM (`SharedArrayBuffer` + rayon web workers), which requires:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These are set in `vite.config.ts` (dev/preview), `vercel.json` and `public/_headers`
(Netlify/Cloudflare Pages). Fonts are self-hosted (`@fontsource`) so no cross-origin
asset is blocked.

## Building WebZjs

WebZjs' wallet package is not published to npm by its maintainers, so we compile it:

1. Prerequisites (Windows): Visual Studio 2022 Build Tools (C++ workload), rustup, LLVM ≥ 17.
2. `git clone https://github.com/ZcashCommunityGrants/WebZjs`
3. The repo's `rust-toolchain.toml` pins `nightly-2025-06-15` with `rust-src` and `wasm32-unknown-unknown`.
4. `cargo install wasm-pack`
5. From `crates/webzjs-wallet`:
   ```
   wasm-pack build -t web --release --out-dir ../../packages/webzjs-wallet \
     --no-default-features --features="wasm wasm-parallel" -Z build-std="panic_abort,std"
   ```
6. Apply the patches in `vendor/webzjs-wallet/patches/` (0001 Sapling change pool, 0002
   prove off the main thread, 0003 internal Sapling keys, 0004b NU7 wiring) to WebZjs, and
   0004a to a copy of librustzcash `0a2c6d1a` placed next to it as `../librustzcash` before building (step 5), then copy the output into `vendor/webzjs-wallet/`; `scripts/copy-webzjs.mjs` serves it from
   `/webzjs/` unbundled (Vite can't bundle wasm-bindgen-rayon's circular worker imports).

## Configuration

See `.env.example`: network, lightwalletd proxy URL, faucet URL, explorer URL templates,
minimum confirmations, optional fixed contact address.
