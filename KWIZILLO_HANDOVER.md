# KWIZILLO — CURRENT PROJECT HANDOVER

## Purpose

This document gives Claude Code the project context needed to continue Kwizillo without repeating past mistakes.

The immediate objective is **not** App Store submission. The immediate objective is a clean, tested **release candidate**, followed by a native iOS/TestFlight build.

---

## Product Summary

Kwizillo is a mobile educational adventure game for primary school children. The player explores six themed fantasy worlds, answers general knowledge questions, earns XP/coins/collectibles, unlocks cards/mascots, and builds knowledge over time.

The experience should feel like a game first and an educational app second.

Target first languages:
- Dutch
- English

Target platforms:
- iOS first
- Android after iOS is stable

---

## Current Product Features

Currently intended / implemented in the evolving build:

- cinematic intro
- tap intro to continue
- first-run onboarding
- name input
- language choice NL / EN
- voice choice Milo / Luna / Silent
- Home/world hub
- 6 worlds
- 24 topics
- 240 NL questions
- 240 EN questions
- mixed quizzes
- topic quizzes
- Quiz 1 → Quiz 2 progression
- question image
- 4 answers
- TTS question + A/B/C/D
- spoken-answer tile animation
- hint popup
- correct/incorrect popup
- result screen
- XP
- coins
- streak
- collection
- knowledge cards
- mascots
- achievements
- statistics
- settings
- music
- SFX
- speech controls
- local persistence
- ElevenLabs backend/proxy for local testing

---

## Known Historical Problems

The app has gone through many rapid visual iterations. Past builds accumulated layers and patches. Claude should assume there may still be residue until proven otherwise.

Historical issues included:

### Visual
- screenshot/mockup UI beneath native UI
- double layers
- world screens from inconsistent generations
- generic dashboard-like layouts
- white cards that felt detached from world art
- tiny square question images in large white areas
- image cropping caused by mismatched canvas ratios
- separate NL and EN home designs
- generic bottom navigation
- inconsistent fonts
- excessive or mismatched overlays

### Audio/TTS
- wrong API key vs Key ID confusion
- missing `voices_read` permission
- Luna being Flemish/Belgian rather than Netherlands Dutch
- occasional English pronunciation inside Dutch speech
- A/B/C/D pronounced awkwardly
- TTS fragments too close together
- speech continuing after navigation
- Milo/Luna perceived loudness mismatch
- intro soundtrack clashing with game music

### Gameplay
- “Nog een quiz” previously restarted Quiz 1
- duplicate/repeated questions
- non-working Collection tabs in earlier builds
- static statistics in earlier builds
- dead buttons in earlier builds

### Engineering
- repeated version CSS overrides
- legacy code from many milestones
- possibility of duplicated event/route/audio logic
- local-network-only testing backend
- Apple production packaging not done yet

---

## Most Recent Testing State

Recent local/mobile testing proved:

- app can run on Mac local server
- iPhone can reach Mac over LAN using an address such as `http://192.168.x.x:8080`
- ElevenLabs API key works once the correct secret is used
- API key must include voice-reading permission (e.g. `voices_read`)

This LAN arrangement is **development-only**.
Production cannot depend on the Mac or a LAN IP.

---

## Voice Requirements

### Dutch
User explicitly wants:
- genuine Netherlands Dutch
- no Flemish/Belgian Luna
- no accidental English accent

Preferred spoken quiz flow:

“[question]”

pause

“A. [answer]”

pause

“B. [answer]”

pause

“C. [answer]”

pause

“D. [answer]”

Do not repeatedly say “Antwoord A”.

Speech should be calm/natural, not rushed.

### English
Same pacing and UX, using native English voice.

### Welcome
User wanted personalized onboarding such as:
“Hi Mike, nice that you want to learn together. Let’s begin.”

However, because this is a kids app, production should avoid sending the child’s name to third-party TTS unless an explicit compliant solution is implemented. Safer option is local visual personalization + generic spoken welcome.

---

## Intro Requirements

- starts immediately
- correct Kwizillo logo
- full logo visible
- tap anywhere to continue
- no required start button
- no ugly explanatory overlays
- smooth transition to onboarding/home
- current preferred audio direction: intro muted, Home music fades in after intro

---

## Golden Visual Direction

Strongest style characteristics established during development:

- premium 3D fantasy scenes
- floating islands
- blue skies/clouds
- waterfalls
- rich, colorful, Pixar-like game energy without copying any specific IP
- bright game-lighting
- magical sci-fi / adventure / history / nature worlds
- Milo integrated into scenes
- strong full-bleed artwork
- UI should sit naturally on the world, not cover it with generic white rectangles

Strong world art exists or has existed for:
- Space
- Animals
- Earth
- History
- Science
- Mystery

Strong question-art examples have existed for:
- body/anatomy
- sugar dissolving in water / science experiment
- space
- medieval history
- science/lab

Claude must inspect actual repository assets and identify the strongest current files instead of assuming filenames from old builds.

---

## Home UX Direction

The current desired direction is more **game/FX** and less “web app”.

Avoid:
- floating balloon pills
- generic white bottom navigation
- excessive pill buttons

Prefer:
- integrated game labels/badges
- richer HUD-like bottom navigation
- game-panel depth
- clean hierarchy
- strong art remains visible

Do not reintroduce double UI layers.

---

## World Screen UX Direction

Each world should feel like entering a level/world, not opening a dashboard.

Recommended structure:
- background/hero fills most of screen
- clear world title
- four visual topic cards integrated into lower scene
- topic art fills card
- card titles/metadata overlay art
- prominent mixed quiz CTA
- game HUD bottom navigation

---

## Quiz UX Direction

Quiz should be highly polished because it is the core loop.

Desired qualities:
- question text readable at first glance
- illustration strongly related to question
- image does not leak answer
- four balanced answer cards
- long answers fit without overflowing
- A/B/C/D letter badge
- current spoken tile animates subtly
- Hint is themed
- correct/wrong popup matches game world
- next-question transition feels instant/smooth

---

## Question Bank Rules

Expected data:
- 240 Dutch
- 240 English
- six worlds
- 40 per world
- four topics per world
- ten per topic

Claude should programmatically validate:
- unique IDs
- exactly 4 answers per question
- correct answer exists among choices
- world exists
- topic exists
- hint exists
- explanation exists
- translation coverage
- group/age metadata valid

Question quality should also be spot-audited for factual correctness and age appropriateness.

---

## Game Progression

Reward principles previously discussed:
- first try +10 XP
- second attempt lower if retry mechanic exists
- quiz completion reward
- perfect bonus
- daily challenge bonus later
- coins should be cosmetic / progression, not pay-to-win

Do not implement monetization without explicit instruction.

---

## Mobile / iPhone Findings

App is intended to be 9:16 visually, but the final iOS UI must respect actual device safe areas.

Test specifically:
- status bar
- notch/Dynamic Island
- home indicator
- keyboard on name field
- Safari viewport quirks
- native Capacitor viewport later

Do not crop golden art simply to force 9:16 if it damages composition; use deliberate object-position / responsive treatment.

---

## Backend / Production Requirement

Development currently uses a local Node/proxy pattern.

Production needs a real HTTPS backend.

Backend responsibilities:
- hold ElevenLabs secret
- provide TTS endpoint
- validate language/voice request
- sanitize input
- rate-limit
- cache common TTS
- timeouts/retries
- no leaking upstream errors/secrets

Potential deployment can be decided later (Render, Railway, Cloudflare, Vercel serverless, etc.) based on existing architecture and costs.

Claude should not select infrastructure without first examining the current project and discussing tradeoffs.

---

## App Store / Kids Release Concerns

User has an Apple Developer account.

Before App Store submission, verify current Apple rules.

Because target users are children:
- minimize personal data
- no tracking
- no ads by default
- analytics only if truly necessary and privacy-safe
- privacy policy required
- parental gates may be required for external links/settings
- review whether app should enter Kids Category and what age band(s) make sense

Do not blindly submit until privacy/data flows have been mapped.

---

## Required Documents Claude Should Produce

During the release process create:

### `AUDIT.md`
- architecture
- active code
- dead code
- visual layering problems
- backend/security findings
- recommended cleanup

### `AUDIO_QA.md`
- NL voice tests
- EN voice tests
- pronunciation failures
- volume tests
- cancellation tests
- final settings

### `RELEASE_QA.md`
- screen-by-screen QA
- flow tests
- device tests
- network tests
- remaining blockers

### `IOS_RELEASE_CHECKLIST.md`
- Capacitor setup
- bundle ID
- icons
- splash
- signing
- backend endpoint
- secrets audit
- privacy strings
- build result
- TestFlight status

---

## Working Style Expected From Claude

Do not spend a whole session only explaining what you might do.

Each phase should produce concrete repository changes or a concrete audit file.

Do not attempt the entire release process in one giant run.

Work in milestones and stop after each one so the user can review.

Never claim a feature is complete without running the relevant test.

---

## First Task

Start with Phase 1 only:

1. confirm repository root
2. create/check out `release/kwizillo-rc1`
3. inspect git status
4. inventory files
5. inspect package/config
6. inspect active HTML/CSS/JS/server/question files
7. inspect assets
8. search for legacy/version overrides
9. search for secrets
10. create `AUDIT.md`
11. commit audit only
12. stop and report

Do not redesign anything in Phase 1.
