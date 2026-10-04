// Central configuration. Everything here is public and shipped to the browser.
const env = import.meta.env;

const network = (env.VITE_ZCASH_NETWORK || "test") as "test" | "main";
if (network !== "test" && network !== "main") {
  throw new Error(`VITE_ZCASH_NETWORK must be "test" or "main", got "${network}"`);
}

export const config = {
  network,
  isTestnet: network === "test",
  lightwalletdUrl:
    env.VITE_LIGHTWALLETD_URL ||
    (network === "test" ? "https://zcash-testnet.chainsafe.dev" : "https://zcash-mainnet.chainsafe.dev"),
  faucetUrl: env.VITE_FAUCET_URL || "https://faucet.testnet.valargroup.dev",
  explorerTxUrl: env.VITE_EXPLORER_TX_URL || "https://testnet.zcashexplorer.app/transactions/{txid}",
  explorerAddressUrl: env.VITE_EXPLORER_ADDRESS_URL || "https://testnet.zcashexplorer.app/address/{address}",
  minConfirmations: Math.max(1, Number(env.VITE_MIN_CONFIRMATIONS || 1)),
  contactAddress: (env.VITE_CONTACT_ADDRESS || "").trim(),
  /** Ticker shown to the player. Testnet coins are "TAZ" and have no value. */
  ticker: network === "test" ? "TAZ" : "ZEC",
  /** Amount suggested for the handoff, in zatoshis. */
  defaultSendZats: 5_000_000n, // 0.05
  /** Amount moved back to the public side in the bonus operation. */
  defaultUnshieldZats: 1_000_000n, // 0.01
  syncIntervalMs: 15_000,
};

export const explorerTx = (txid: string) => config.explorerTxUrl.replace("{txid}", txid);
export const explorerAddress = (address: string) => config.explorerAddressUrl.replace("{address}", address);
