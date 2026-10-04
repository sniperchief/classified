// Translate raw wallet / network errors into mission language.
// The raw text is always kept for the expandable "technical details" panel.

export interface MissionError {
  title: string;
  message: string;
  hint?: string;
  technical: string;
}

export function describeError(err: unknown, context = "operation"): MissionError {
  const technical = errorText(err);
  const t = technical.toLowerCase();
  const make = (title: string, message: string, hint?: string): MissionError => ({ title, message, hint, technical });

  if (t.includes("env_not_isolated") || t.includes("sharedarraybuffer"))
    return make(
      "SECURE ENCLAVE UNAVAILABLE",
      "This browser session can't run the secure wallet engine.",
      "Open the game from its official URL in a current desktop Chrome, Edge, Firefox or Safari — or switch to Demo Mode.",
    );
  if (t.includes("timeout:"))
    return make("NO RESPONSE", `The ${context} stopped responding.`, "Reload the page and try again. Your progress is saved.");
  if (t.includes("bad_phrase"))
    return make("CODES REJECTED", "That recovery phrase isn't valid.", "Check for typos — it should be 24 words.");
  if (t.includes("bad_address") || t.includes("invalid address") || t.includes("unable to decode") || t.includes("parse"))
    return make("UNKNOWN CONTACT", "That recipient address isn't valid for this network.", technical.replace(/^.*BAD_ADDRESS:\s*/, ""));
  if (t.includes("bad_amount"))
    return make("INVALID PAYLOAD", "Enter an amount greater than zero.");
  if (t.includes("insufficient") || t.includes("not enough") || t.includes("insufficientfunds"))
    return make(
      "INSUFFICIENT FUNDS",
      `The ${context} needs more funds than are currently available.`,
      "New funds become usable after one block confirmation (~75 seconds). Wait for the safehouse to sync, then try again.",
    );
  if (t.includes("no transparent") || t.includes("no utxo") || t.includes("nothing to shield"))
    return make("NOTHING TO SHIELD", "There are no public funds waiting to be shielded yet.", "Wait for the handler's transfer to confirm.");
  if (t.includes("failed to fetch") || t.includes("network") || t.includes("grpc") || t.includes("transport") || t.includes("timeout"))
    return make(
      "RELAY OFFLINE",
      "We lost contact with the Zcash network relay.",
      "Check your connection and try again. Your funds are safe — nothing was sent.",
    );
  if (t.includes("expired"))
    return make("TRANSMISSION EXPIRED", "The transfer wasn't picked up by the network in time.", "Your funds were not moved. Try again.");
  return make(
    "TRANSMISSION FAILED",
    `The ${context} could not be completed.`,
    "Check your balance and try again.",
  );
}

export function errorText(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
