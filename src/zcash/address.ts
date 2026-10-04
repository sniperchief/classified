// Lightweight address sanity checks (network + encoding shape). The wallet
// library performs full checksum/encoding validation when a transfer is quoted,
// and the game always quotes before it sends.

const BECH32 = /^[02-9ac-hj-np-z]+$/; // bech32 data charset (lowercase)
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

const PREFIXES = {
  test: { unified: "utest1", sapling: "ztestsapling1", tex: "textest1", transparent: ["tm", "t2"] },
  main: { unified: "u1", sapling: "zs1", tex: "tex1", transparent: ["t1", "t3"] },
} as const;

export type AddressKind = "unified" | "sapling" | "transparent" | "tex";

/** Returns an error message, or null when the address looks valid for `network`. */
export function checkAddress(addr: string, network: "test" | "main"): string | null {
  const a = addr.trim();
  if (!a) return "Enter a recipient address.";
  const p = PREFIXES[network];
  const other = PREFIXES[network === "test" ? "main" : "test"];

  const kind = kindOf(a, network);
  if (!kind) {
    if (kindOf(a, network === "test" ? "main" : "test") || a.startsWith(other.unified)) {
      return network === "test"
        ? "That is a MAINNET address. This mission runs on testnet — real funds are never used."
        : "That is a testnet address.";
    }
    return "Unrecognized address format.";
  }
  if (kind === "transparent") {
    if (!BASE58.test(a) || a.length !== 35) return "Malformed transparent address.";
  } else {
    const prefix = kind === "unified" ? p.unified : kind === "sapling" ? p.sapling : p.tex;
    const body = a.slice(prefix.length);
    if (a !== a.toLowerCase() || !BECH32.test(body) || body.length < 30) return "Malformed address.";
  }
  return null;
}

export function kindOf(a: string, network: "test" | "main"): AddressKind | null {
  const p = PREFIXES[network];
  if (a.startsWith(p.unified)) return "unified";
  if (a.startsWith(p.sapling)) return "sapling";
  if (a.startsWith(p.tex)) return "tex";
  if (p.transparent.some((t) => a.startsWith(t))) return "transparent";
  return null;
}
