# Third-party notices

CLASSIFIED's own source code is released under the MIT License (see `LICENSE`).
The following parts of this repository are **not** covered by that license and remain
under their owners' terms:

| Path | What it is | License / owner |
|---|---|---|
| `vendor/webzjs-wallet/` (excluding `patches/`) | Build of [WebZjs](https://github.com/ZcashCommunityGrants/WebZjs) (commit `bdbc6f2`) | MIT OR Apache-2.0 — ChainSafe Systems / Zcash Community Grants contributors |
| `vendor/webzjs-wallet/patches/0001–0004b` | Modifications to WebZjs | Same terms as WebZjs (MIT OR Apache-2.0) |
| `vendor/webzjs-wallet/patches/0004a-nu7-librustzcash.patch` | Modifications to [librustzcash](https://github.com/zcash/librustzcash) `0a2c6d1a`, mirroring upstream commits `928592188` and `a0c73f6d4` | MIT OR Apache-2.0 — Electric Coin Company and contributors |
| `public/zilkroad/zksnark-7470.png` | Portrait zkSNARK #7470 from the [Zilkroad](https://zilkroad.com/explorer/7470) collection | © Zilkroad — used to depict the contact NIGHTJAR; not licensed under MIT |

npm dependencies (React, Vite, Tailwind CSS, @scure/*, @noble/hashes, @fontsource/*) are
installed from npm under their own licenses and are not redistributed in this repository.
