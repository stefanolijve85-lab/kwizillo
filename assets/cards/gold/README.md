# Golden world cards

One painting per world, awarded when that world has been finished at all six
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

Portrait, about 3:4 (for example 960×1280), no text or UI baked into the
picture: the title, the stars and the world name are drawn by the app on top.
After replacing a file, bump `K.ASSET_V` in `world-assets.js` so browsers do not
keep the old picture.
