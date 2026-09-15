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

## Milo poses (onboarding host + Home tour)

`assets/mascots/milo/{wave,talk,think,cheer,point-down,point-left}.png` — transparent
cut-outs, 720 px tall. Made on the ElevenLabs flow "Kwizillo Milo poses"
(Ro9sz8AjavE8wQSqwGlT): gemini-3-pro-image with `assets/brand/milo.jpg` as the
identity reference, one prompt per pose ("full-body, floating, flat light-grey
backdrop, no shadow"), then birefnet-v2-bg-removal, then cropped to the alpha
bounding box and scaled to a shared height. `pointRight` is `point-left`
mirrored in CSS. New poses go through the same three steps and are registered in
`K.GUIDE_POSES.milo` (milo.js).

## Luna poses (she takes over the moment a child picks her)

`assets/mascots/luna/{wave,talk,think,cheer,point-down,point-left}.png` — same
recipe on the same flow, with `assets/brand/luna.jpg` as the identity reference
(ref node B9R4IS9t0XgCpUB4d5Sm), made 2026-09-15. `cheer` was rendered with
gpt-image-2 (420 credits, the gemini attempt was refused by its safety filter) and
keyed out locally: the flat grey backdrop is flood-filled from the borders
(scratch script keybg.cjs), no bg-removal credits needed. Luna's talking base
still is `assets/mascots/luna/talk-base.png` (640×768 centre crop of a chest-up
portrait) and is already uploaded on the talking flow as node 2Z52ZSr8Pk1Gkndb0tNo.

## Talking clips (lip-synced video)

`assets/<guide>/talk/<lang>/<key>.mp4` — see `tools/guide-talks.js` (lines / encode /
manifest) and `guide-talks.js` (the generated manifest the app reads:
`window.KWIZILLO_GUIDE_TALKS.{milo,luna}`). Flow "Kwizillo Milo praat"
(SyUhvtqjRCbWNR70n0Wq): tts node (eleven_v3, the guide's voice for the language)
→ bytedance-omnihuman-v1.5 with the guide's talk-base still. About $0.60 per clip.

- Milo: all 33 clips (NL/EN/PT × 11 lines) in place since 2026-09-15. His `hello`
  line (voice.milo.hello) has no clip yet.
- Luna: the 7 Dutch clips (hello, welcome, worlds, games, hud, nav, done) since
  2026-09-15 (~€4; tts nodes vDmvwyuxk524NAfUCGEM… on the same flow, base still
  node 2Z52ZSr8Pk1Gkndb0tNo). EN and PT fall back to the audio-driven mouth; 14
  more pairs (~€9) would complete them. Print the lines with
  `node tools/guide-talks.js lines luna`. Run at most two tts→avatar pairs per
  creative_run_flow_nodes call (5 concurrent-request limit) and always pass
  `generations_count: 1`.

A missing clip is never fatal: the guide's portrait takes the same window and its
mouth moves with the voice — the app measures the loudness of the spoken line
(K.voiceLevel, m1-runtime.js) and drops the chin / opens a dark mouth on the
portrait every frame (`mouth` box per guide in K.GUIDES, milo.js). Free, works for
every line in every language; the omnihuman clips remain the premium option. To redo a line: rerun its tts + avatar pair on the
flow, then `encode <src> <guide> <lang> <key>` and `manifest`.

## Game tiles (Home "Speel ook", Memo picker)

`assets/games/{memo-island,math-island,worlds-all}.jpg` — floating islands in the world style,
made on the poses flow with the jungle and space world art as style references
(gemini-3-pro-image, 16:9, cropped to the island and downscaled to 1000 px; rename the file whenever it is replaced — assets are cached for a day). The Weetjes tile
(`facts-island.jpg`: an open storybook, a glowing lightbulb, an owl) was made with
gpt-image-2 on the same references (node lOwwipmIHBWlkF7kGwj4, 655 credits).
Mind `generations_count: 1` on creative_run_flow_nodes — a node runs four
variants by default.
