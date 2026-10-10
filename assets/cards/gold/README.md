# Golden world cards

One painting per world (eight since 2026-10-10), awarded when that world has been finished at all six
levels (and sold in the shop for coins). Drop the files in here with exactly
these names — `.jpg` is loaded first, `.png` is tried next, and while neither is
there the card falls back to the world art:

| file | world |
| --- | --- |
| `ruimte.jpg` | Ruimtewereld / Space |
| `dieren.jpg` | Dierenwereld / Animals |
| `aarde.jpg` | Aardewereld / Earth |
| `geschiedenis.jpg` | Geschiedeniswereld / History |
| `wetenschap.jpg` | Wetenschapswereld / Science |
| `mysterie.jpg` | Mysteriewereld / Mystery |
| `kunst.jpg` | Kunstwereld / Art |
| `sport.jpg` | Sportwereld / Sport |

Portrait, about 3:4. The card is shown edge to edge, so the painting may be a
finished card in itself — frame, title and all; the app only prints a line
underneath saying whether it was earned or bought.

The `.jpg` files here are made from the masters by `node tools/gold-cards.cjs`,
which redraws each painting at 900×1200 and writes a JPEG of about 300 kB — the
masters are two to three megabytes each and would ship inside the app. Drop a
new master in this folder as `<world>.png`, run the tool with `--move`, and the
master is kept in `art-source/cards-gold/` (outside the app, and outside git).
After replacing a file, bump `K.ASSET_V` in `world-assets.js` so browsers do not
keep the old picture.
