// Serves our from-source build of the official WebZjs wallet (vendor/webzjs-wallet,
// see vendor/webzjs-wallet/BUILD-INFO.json) unbundled from public/webzjs.
// Bundlers can't handle its circular worker imports (wasm-bindgen-rayon); the browser
// resolves the worker/WASM URLs natively relative to the served module.
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const src = join(process.cwd(), "vendor", "webzjs-wallet");
const out = join(process.cwd(), "public", "webzjs");
if (existsSync(out)) rmSync(out, { recursive: true });
for (const f of ["webzjs_wallet.js", "webzjs_wallet_bg.wasm", "snippets"]) {
  cpSync(join(src, f), join(out, f), { recursive: true });
}
// wasm-bindgen-rayon's worker imports the package *directory* ('../../..'), which only a
// bundler can resolve. Point it at the actual module file so plain browser loading works.
const helper = join(out, "snippets", "wasm-bindgen-rayon-38edf6e439f6d70d", "src", "workerHelpers.js");
const code = readFileSync(helper, "utf8");
const patched = code.replace("import('../../..')", "import('../../../webzjs_wallet.js')");
if (patched === code) throw new Error("[copy-webzjs] workerHelpers.js import pattern not found");
writeFileSync(helper, patched);

console.log("[copy-webzjs] served official WebZjs build from public/webzjs");
