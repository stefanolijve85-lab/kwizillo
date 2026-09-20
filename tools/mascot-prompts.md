# Mascot wave 2 — generation prompts

Six more buddies for the collection (unlock at 70/90/115/140/170/200 correct
answers). Same look as Comet, Pootje, Terra, Sparky and Lumi: glossy 3D
animated-film character, upper body, centred, soft studio light, one plain
pastel background colour, no text. Deliver as 512×512 JPEG in
`assets/mascots/<id>.jpg`, then add the id to the list in `world-assets.js`
(the buddy stays hidden until its picture exists).

Common prompt suffix for every one:
> Cute 3D animated-film style character for a children's quiz game, upper body,
> centred, soft studio lighting, glossy Pixar-like render, big bright eyes,
> friendly smile, plain solid pastel background, square, no text.

| id | Name | For | Prompt core | Background |
|----|------|-----|-------------|------------|
| nova | Nova | girls (space) | a girl astronaut kid about 8, curly dark hair in two puffs, glossy white-and-lavender spacesuit with a small gold star emblem, helmet under one arm, waving | lavender |
| kiko | Kiko | boys/girls (animals) | a round panda cub explorer with a khaki safari hat and a tiny backpack, holding binoculars, cheeky grin | mint green |
| pip | Pip | boys/girls (earth/ice) | a small penguin with a red knitted beanie and orange scarf, goggles pushed up, arms out like flying, playful | ice blue |
| ravi | Ravi | boys (science) | a boy inventor kid about 9, brown skin, short curly hair, oversized brass goggles on his forehead, yellow lab coat with pockets full of tools, holding a glowing gadget, excited | soft yellow |
| flora | Flora | girls (nature) | a girl about 7 with long red braids and a flower crown, green hoodie, translucent butterfly wings, holding a small sprouting plant, gentle smile | peach |
| draco | Draco | boys/girls (history/mystery) | a chubby baby dragon, teal scales, tiny knight helmet with a visor up, small wooden shield with a star, tail curled, proud grin | warm sand |

Tools that can render these once credit/permission is there:
- ElevenLabs connector → `creative_generate_image`, model `gpt-image-2`
  (needs the *Image & Video Generation* permission on the connection).
- Higgsfield → `generate_image_batch` (needs credits).

## Guide poses (onboarding host + Home tour) — v2, 2026-09-15

Both guides were redesigned by Stefan (ChatGPT renders that match the intro's
Milo): one hi-res full-body render each plus a 4×3 character sheet
("Animatie · poses & expressies": voorzijde, driekwart, zij, achter, zwaaien,
wijzen, nadenken, juichen, two walk frames, two jump frames). The sources live in
`incoming/` (git-ignored). From them:

- `assets/mascots/<guide>/{wave,talk,think,cheer,point-right}.png` — cut-outs,
  720 px tall, all from hi-res single renders except Milo's `talk` and Luna's
  `wave` (sheet cells). `pointLeft` mirrors `point-right` in CSS; `pointDown` is
  the same cut-out leaned over 38°. Every pose carries a `mouth` box in
  K.GUIDE_POSES (fractions of the image) so the mouth can talk on the figure.
- `assets/mascots/<guide>/{walk-a,walk-b,jump-a,jump-b}.png` — the sheet's walk
  and jump frames, scaled relative to the front view so a crouch stays small.
  The tour cycles them while the guide walks in / hops between stops.
- `assets/mascots/<guide>/talk-base.png` — 640×768 chest-up crop of the hi-res
  render; the portrait in the talking window and the base for any new clips.
- `assets/mascots/{milo,luna}.jpg` — 512×512 faces (guide pick, HUD, profile, result).

Backgrounds are keyed out locally (scratch `newguides.cjs`): flood-fill the flat
light-blue backdrop from the borders, then a second pass eats the soft ground
shadow (bluish, unsaturated, darker than the backdrop) so white bodies and grey
metal stay. The old gemini/birefnet poses (v1) are in git history before this date.

## Talking clips (lip-synced video)

`assets/<guide>/talk/<lang>/<key>.mp4` — see `tools/guide-talks.js` (lines / encode /
manifest) and `guide-talks.js` (the generated manifest the app reads:
`window.KWIZILLO_GUIDE_TALKS.{milo,luna}`). Flow "Kwizillo Milo praat"
(SyUhvtqjRCbWNR70n0Wq): tts node (eleven_v3, the guide's voice for the language)
→ bytedance-omnihuman-v1.5 with the guide's talk-base still. About $0.60 per clip.

- The v1 clips (Milo 33, Luna NL 7) were rendered on the previous faces and were
  retired with the v2 redesign (git history before 2026-09-15 evening); the manifest
  is empty and every line uses the audio-driven mouth on the new portraits. To
  render v2 clips: upload the new talk-base stills to the flow, one tts→avatar pair
  per line — Milo NL 12 lines ≈ €7, Luna NL 8 ≈ €5, all three languages ≈ €36.
  Print the lines with `node tools/guide-talks.js lines`. Run at most two pairs per
  creative_run_flow_nodes call (5 concurrent-request limit) and always pass
  `generations_count: 1`.

### Milo without a mouth (v4, 2026-09-15 late evening)

Stefan re-rendered Milo's five poses **without a mouth** (`incoming/milo-{voorzijde,
zwaaien,wijzen,nadenken,juichen}.png`, real alpha). `tools/milo-cutouts.cjs` makes the
cut-outs and measures where the mouth goes on each (screen centre, 74 % down the
screen); "nadenken" is set by hand because the black glove touches the screen.
The mouth is always drawn: on the figure by CSS (`.mouth-robot`, milo.js/screens.css —
a half-ellipse smile that becomes a glowing "O" with the voice) and in the clips by
keyclip (same shape from the audio envelope). So still, live speech and video match.

### Clip pipeline (v4, transparent video, drawn mouth)

1. Base: `node tools/greenpad.cjs <transparent.png> <green.png>` — the mouthless
   `talk` render on chroma green, 3:4, character at 84 % height. On the flow the
   asset node is `ZclUeRDgjAsZt1VLjs4N`. Prompt: no mouth, screen stays as it is,
   head nods / gestures / blinks only, helmet + antenna rigid, backdrop still.
   The model still paints a small white row of "teeth" on the screen's bottom rim
   and a lip shadow under it; keyclip removes both.
2. `node tools/guide-talks.js encode <green.mp4> milo nl <key>` → `tools/keyclip.cjs
   --screen-mouth`: ffmpeg `chromakey` (no despill), alpha box crop, then per frame:
   the whole face screen is made opaque again (the key bites into cyan glows), and
   **frame 1 is the reference** (omnihuman starts from the still, so frame 1 is the
   mouthless base): every pixel the model painted — a glowing mouth on the screen and
   its halo, teeth / a lip line / a whole open mouth on the rim under the screen —
   is replaced by the reference's pixel mapped through the screen box (eye rings
   protected via a distance map). Then the robot mouth is drawn (arc when quiet,
   "O" when loud). Output: `<key>.webm` (VP9 + alpha) and
   `<key>.mp4` (ProRes 4444 → `avconvert` HEVC + alpha — ffmpeg's VideoToolbox alpha
   is not honoured by Safari). `KEYCLIP_KEEP=1` keeps the frames, `KEYCLIP_DEBUG=1`
   draws the erase ellipses. Sources are kept in `incoming/clips/` (git-ignored).
3. The app plays the transparent video in the figure's place at the cut-out's
   height (`.milo-clip`, cache-busted with `K.ASSET_V`); Safari gets the HEVC,
   everyone else the WebM. A clip that shows no frame within 2.5 s falls back to
   the figure + drawn mouth + live voice.
4. Cost (720p omnihuman): ≈ 73 credits per character of text, ≈ 3.800 credits for
   a 4 s line, ≈ $0.18 per 1.000 credits. Two avatar nodes per run, always
   `generations_count: 1`. Milo NL 13 lines ≈ 49k credits, Luna NL 8 ≈ 35k.
   Fun-fact illustrations ≈ 400 credits each (gemini-3.1-flash-image / gpt-image-1.5).

A missing clip is never fatal: the figure stays and its drawn mouth moves with the
voice (K.voiceLevel, m1-runtime.js). To redo a line: rerun its avatar node on the
flow, then `encode <src> <guide> <lang> <key>` and `manifest`.

### Clip mouth v5 (2026-09-20) and Luna's clips

keyclip's drawn mouth now follows the voice at syllable rate: 10 ms RMS with a
fast attack / ~70 ms release, averaged per frame and scaled against the loudest
sound of the surrounding 0.6 s (floored), then a continuous shape — smile arc
when quiet, a flat "o" for a soft sound, a tall "O" for a loud one, cross-faded
so it never pops. The live mouth on the figure/portrait (m1-runtime envelopeOf)
uses the same local scaling. All Milo NL clips were re-keyed from
`incoming/clips/*-src.mp4` (no re-render needed); `games` was retired (its clip
said the old two-game line) and `nav` re-rendered for the new line.

Luna: green base = `tools/greenpad.cjs assets/mascots/luna/talk.png` → asset
`P5B453dqphqYVjzhrX3k`, node `U0ITBek9c6FgL9tFIG9Z` on the flow; her mouth is
animated by omnihuman (no `--screen-mouth`). Rendered: NL `hello`, `welcome`
(≈ 2.6k + 3.6k credits). Prepared but NOT run (credits ran out on 2026-09-20 —
omnihuman "Insufficient credits"): Milo NL `games` (tts came out 18.6 s; shorten
the line first, node LKTeueHElpesCqMP7Q0i), Milo NL `hud` with the "KwizCoins /
dagen op rij" wording (node JcMpmYZ1x6sAOv4niQKp; i18n keeps the old wording
until the clip exists), Luna NL worlds/games/hud/nav/done, Milo NL onboarding
language/age/group/voice/hello, and EN/PT.

## Game tiles (Home "Speel ook", Memo picker)

`assets/games/{memo-island,math-island,worlds-all}.jpg` — floating islands in the world style,
made on the poses flow with the jungle and space world art as style references
(gemini-3-pro-image, 16:9, cropped to the island and downscaled to 1000 px; rename the file whenever it is replaced — assets are cached for a day). The Weetjes tile
(`facts-island.jpg`: an open storybook, a glowing lightbulb, an owl) was made with
gpt-image-2 on the same references (node lOwwipmIHBWlkF7kGwj4, 655 credits).
Mind `generations_count: 1` on creative_run_flow_nodes — a node runs four
variants by default.
