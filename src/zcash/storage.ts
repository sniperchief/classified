// Local-only persistence. Nothing here ever leaves the player's browser.
//
// - The wallet database (notes, scan progress — no spending keys) goes to IndexedDB.
// - The recovery phrase is kept in localStorage so the mission survives a reload.
//   This is acceptable ONLY because the game is a testnet training wallet; the
//   UI says so, and the player can burn the safehouse at any time.

const DB_NAME = "classified";
const STORE = "wallet";
const VAULT_KEY = "classified.vault.v1";

export interface Vault {
  network: string;
  phrase: string;
  birthday: number;
  agentId: number;
  contactId: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
  });
}

export const walletDb = {
  load: (network: string) => tx<Uint8Array | undefined>("readonly", (s) => s.get(`db:${network}`)),
  save: (network: string, bytes: Uint8Array) => tx<void>("readwrite", (s) => s.put(bytes, `db:${network}`)),
  clear: (network: string) => tx<void>("readwrite", (s) => s.delete(`db:${network}`)),
};

export const vault = {
  load(network: string): Vault | null {
    try {
      const v = JSON.parse(localStorage.getItem(VAULT_KEY) || "null") as Vault | null;
      return v && v.network === network ? v : null;
    } catch {
      return null;
    }
  },
  save(v: Vault) {
    localStorage.setItem(VAULT_KEY, JSON.stringify(v));
  },
  clear() {
    localStorage.removeItem(VAULT_KEY);
  },
};
