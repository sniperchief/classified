// Extract the transparent receiver from a Unified Address (ZIP 316).
//
// WebZjs' get_current_address_transparent() panics in its in-memory wallet
// backend ("not yet implemented"), so we decode the UA ourselves:
// bech32m -> F4Jumble^-1 -> strip HRP padding -> parse typecode/length/value items.
// The wallet tracks UTXOs for exactly this receiver.

import { blake2b } from "@noble/hashes/blake2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bech32, bech32m, createBase58check } from "@scure/base";

const enc = new TextEncoder();
const b58c = createBase58check(sha256);

const T_PREFIX = {
  test: { p2pkh: [0x1d, 0x25], p2sh: [0x1c, 0xba] },
  main: { p2pkh: [0x1c, 0xb8], p2sh: [0x1c, 0xbd] },
} as const;

function personal(tag: string, ...bytes: number[]) {
  const p = new Uint8Array(16);
  p.set(enc.encode(tag));
  p.set(bytes, tag.length);
  return p;
}

function xor(a: Uint8Array, b: Uint8Array) {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
}

const H = (i: number, u: Uint8Array, lenL: number) => blake2b(u, { dkLen: lenL, personalization: personal("UA_F4Jumble_H", i, 0, 0) });

function G(i: number, u: Uint8Array, lenR: number) {
  const out = new Uint8Array(lenR);
  for (let j = 0; j * 64 < lenR; j++) {
    const block = blake2b(u, { dkLen: 64, personalization: personal("UA_F4Jumble_G", i, j & 0xff, j >> 8) });
    out.set(block.subarray(0, Math.min(64, lenR - j * 64)), j * 64);
  }
  return out;
}

export function f4jumbleInv(m: Uint8Array): Uint8Array {
  const lenL = Math.min(64, Math.floor(m.length / 2));
  const lenR = m.length - lenL;
  const c = m.subarray(0, lenL);
  const d = m.subarray(lenL);
  const y = xor(c, H(1, d, lenL));
  const x = xor(d, G(1, y, lenR));
  const a = xor(y, H(0, x, lenL));
  const b = xor(x, G(0, a, lenR));
  const out = new Uint8Array(m.length);
  out.set(a);
  out.set(b, lenL);
  return out;
}

function readCompactSize(buf: Uint8Array, pos: number): [number, number] {
  const first = buf[pos];
  if (first < 0xfd) return [first, pos + 1];
  if (first === 0xfd) return [buf[pos + 1] | (buf[pos + 2] << 8), pos + 3];
  throw new Error("UA: oversized compactSize");
}

/** Decode a UA into its (typecode, receiver bytes) items. */
function receivers(ua: string): { typecode: number; value: Uint8Array }[] {
  const { prefix, words } = bech32m.decode(ua as `${string}1${string}`, false);
  const raw = f4jumbleInv(Uint8Array.from(bech32m.fromWords(words)));
  const pad = raw.subarray(raw.length - 16);
  const expected = personal(prefix);
  if (!pad.every((v, i) => v === expected[i])) throw new Error("UA: bad padding (wrong network or corrupt address)");
  const body = raw.subarray(0, raw.length - 16);
  const items: { typecode: number; value: Uint8Array }[] = [];
  let pos = 0;
  while (pos < body.length) {
    let typecode: number, len: number;
    [typecode, pos] = readCompactSize(body, pos);
    [len, pos] = readCompactSize(body, pos);
    items.push({ typecode, value: body.subarray(pos, pos + len) });
    pos += len;
  }
  return items;
}

/** Returns the transparent address inside `ua`, or null if it has no transparent receiver. */
export function transparentFromUnified(ua: string, network: "test" | "main"): string | null {
  const r = receivers(ua).find((i) => (i.typecode === 0x00 || i.typecode === 0x01) && i.value.length === 20);
  if (!r) return null;
  const p = T_PREFIX[network][r.typecode === 0x00 ? "p2pkh" : "p2sh"];
  const payload = new Uint8Array(22);
  payload.set(p);
  payload.set(r.value, 2);
  return b58c.encode(payload);
}

/**
 * Returns the Sapling address inside `ua` (typecode 0x02, 43 bytes, bech32 per the Zcash
 * protocol spec §5.6.3.1), or null. Used to keep payments in the Sapling pool: since NU6.3,
 * payments to an Orchard receiver land in the Ironwood pool, which WebZjs' in-memory wallet
 * can't build or scan yet.
 */
export function saplingFromUnified(ua: string, network: "test" | "main"): string | null {
  const r = receivers(ua).find((i) => i.typecode === 0x02 && i.value.length === 43);
  if (!r) return null;
  return bech32.encode(network === "test" ? "ztestsapling" : "zs", bech32.toWords(r.value), false);
}
