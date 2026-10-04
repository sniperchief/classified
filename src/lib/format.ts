export const ZATS_PER_ZEC = 100_000_000n;

/** 12_500_000n -> "0.125" (trailing zeros trimmed, at least 2 decimals kept when fractional). */
export function formatZats(zats: bigint, maxDecimals = 8): string {
  const neg = zats < 0n;
  const abs = neg ? -zats : zats;
  const whole = abs / ZATS_PER_ZEC;
  let frac = (abs % ZATS_PER_ZEC).toString().padStart(8, "0").slice(0, maxDecimals);
  frac = frac.replace(/0+$/, "");
  if (frac.length > 0 && frac.length < 2) frac = frac.padEnd(2, "0");
  return `${neg ? "-" : ""}${whole}${frac ? "." + frac : ".00"}`;
}

/** Parse a user-entered decimal ZEC amount into zatoshis. Returns null if invalid. */
export function parseZec(input: string): bigint | null {
  const s = input.trim();
  if (!/^\d+(\.\d{1,8})?$/.test(s)) return null;
  const [w, f = ""] = s.split(".");
  return BigInt(w) * ZATS_PER_ZEC + BigInt(f.padEnd(8, "0"));
}

export function shortAddr(addr: string, head = 10, tail = 8): string {
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function toBigInt(v: unknown): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number" && Number.isFinite(v)) return BigInt(Math.trunc(v));
  if (typeof v === "string" && /^-?\d+$/.test(v)) return BigInt(v);
  return 0n;
}
