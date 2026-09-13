# KWIZILLO — CLAUDE CODE PROJECT INSTRUCTIONS

## 0. Mission

You are working on **Kwizillo**, a premium educational game for children in primary school, initially Dutch and English, intended for iOS App Store and later Google Play.

This is **not a greenfield project**. A working game already exists. Your job is to turn the existing implementation into a clean, consistent, production-ready release candidate without destroying the established product identity or regressing existing functionality.

The product should feel like a **real premium game**, not a generic dashboard or website.

Core inspiration:
- Duolingo: progression and friendly learning feedback
- Kahoot: playful quiz energy
- Pokémon collecting: collection/motivation
- Children’s encyclopedia: broad knowledge discovery

Primary design rule:
> A child should open Kwizillo because it feels fun to play, not because an adult tells them to learn.

---

## 1. Hard Rules

1. Work from the existing repository and existing codebase.
2. Do **not** restart the app from scratch unless explicitly requested.
3. Do **not** invent a new visual direction.
4. Do **not** generate new AI artwork unless explicitly approved.
5. Reuse the strongest existing Kwizillo artwork and golden-master assets.
6. Never put a complete screenshot containing UI underneath a second interactive UI layer.
7. Never stack new CSS fixes endlessly on top of old patches. Refactor when needed.
8. All text, buttons, score, progress, tabs, statistics, answers and state must remain real dynamic UI.
9. Remove legacy layers only after proving they are unused.
10. Never hard-code secrets or API keys in frontend code.
11. Never merge to `main` without explicit approval.
12. Work on a dedicated release branch, preferably:
   `release/kwizillo-rc1`
13. Commit after every completed milestone.
14. Before changing behavior, inspect current implementation and tests first.
15. If a visual change conflicts with an approved golden master, the golden master wins.

---

## 2. Product Identity

### Brand
Name: **Kwizillo**

Visual language:
- bright premium 3D cartoon/fantasy aesthetic
- magical floating islands
- strong depth, soft clouds, glowing waterfalls
- saturated but clean color palette
- glossy rounded game controls
- blue / purple / gold primary UI language
- soft shadows and glows
- rich illustrations
- child-friendly, ages roughly 4–12, but never babyish

### Mascots / guides

**Milo**
- friendly white robot
- glossy dark face
- glowing blue eyes
- bronze/gold goggles/headgear
- blue star emblem
- energetic/friendly

**Luna**
- friendly dark-haired girl
- purple headphones / hoodie aesthetic
- calm/friendly voice

Voice options:
- Milo
- Luna
- Stil / Silent

### Tone
- warm but not patronizing
- playful
- encouraging
- wrong answers should never feel punitive
- concise explanations
- child-safe language

---

## 3. Current Core Game Structure

Six worlds:
1. Ruimte / Space
2. Dieren / Animals
3. Aarde / Earth
4. Geschiedenis / History
5. Wetenschap / Science
6. Mysterie / Mystery

Each world has 4 topics.
Current intended dataset:
- 240 Dutch questions
- 240 English questions
- 40 questions per world
- 10 questions per topic
- 24 topics total

Quiz size:
- 10 questions

Mixed world quiz progression:
- Quiz 1: first unique batch of 10
- Quiz 2: next unique batch of 10
- Quiz 3: next unique batch of 10
- Quiz 4: final unique batch of 10
- only after that should the cycle reshuffle/restart

Specific topic quizzes currently have 10 questions each. Do not falsely imply there are four unique 10-question batches for a topic unless the dataset is expanded.

Avoid immediate repeats.

---

## 4. Required Game Flow

Test and preserve this complete flow:

1. App cold launch
2. Cinematic intro begins immediately
3. User may tap/click intro to continue immediately
4. First-run onboarding
5. Choose language: Nederlands / English
6. Enter player name
7. Choose Milo / Luna / Stil
8. Welcome
9. Home
10. Choose world
11. Choose topic OR mixed quiz
12. Quiz 1
13. Question shown
14. Voice reads question, then A/B/C/D answers naturally
15. Hint available
16. Answer selected
17. Correct / incorrect feedback
18. Explanation / fact
19. Next question
20. 10 questions complete
21. Result screen
22. “Nog een quiz / Another quiz” must open next quiz number
23. Collection
24. Cards
25. Mascots
26. Achievements
27. Statistics
28. Settings
29. Change language
30. Change voice
31. Change audio
32. Restart app
33. Verify state/progress/settings persistence

All major flows must work in both Dutch and English.

---

## 5. Intro Requirements

Current direction:
- intro starts automatically
- no mandatory “Start Kwizillo” button before playback
- intro is clickable/tappable anywhere to continue
- logo must be correct, fully visible, not cropped
- no clumsy explanatory overlays
- intro should not be cut off by the app prematurely unless user taps
- intro and Home transition must feel smooth

Audio direction:
- do not let intro audio clash with game music
- safest current behavior: intro video muted, then normal game music fades in on Home
- if intro audio is reintroduced later, it must be deliberately synced and transition seamlessly into the game soundtrack

Do not allow two music sources to play simultaneously.

---

## 6. Home Screen Requirements

Home should feel like a premium fantasy game hub.

Must include:
- Kwizillo branding
- player identity / level
- coins
- streak
- world access
- large primary adventure CTA
- voice selection or obvious access to voice selection
- language selection
- bottom game navigation

Important:
- avoid generic floating pills that look like web buttons
- world access should visually belong to the scene
- bottom navigation should feel like game HUD/navigation, not an admin dashboard
- one coherent visual layer only
- no duplicate baked-in UI + native UI

---

## 7. World Screens

World screen hierarchy:

1. strong world hero art
2. world title
3. short subtitle
4. 4 topic cards
5. mixed quiz CTA
6. bottom navigation

Topic cards:
- full-bleed or strongly integrated art
- no tiny square image inside a giant white card
- card art must clearly relate to the topic
- title and question count must be readable
- consistent spacing, radius, shadow, hover/touch feedback
- should look like game level cards

World music mapping target:
- Space → space
- Animals → adventure
- Earth → calm/adventure
- History → adventure
- Science → magical
- Mystery → mysterious/calm

Crossfade rather than abrupt switches.

---

## 8. Quiz Screen Requirements

Quiz is the most important gameplay screen.

Layout target:
- compact game header
- quiz number / question progress
- world/topic / selected voice status
- strong readable question
- large relevant illustration
- 2x2 answer grid
- Hint
- Other question / skip if still retained

### Question artwork

Artwork must:
- visually match the question
- enrich comprehension
- never include the textual answer
- never obviously reveal the answer unless the educational purpose requires visual identification
- not be a random world image
- not be a small square image floating in a large white empty box

Prefer 16:9 art within a visually integrated frame.

### Answer cards

- 2x2 balanced grid
- equal visual weight
- long text must scale/wrap gracefully
- consistent internal padding
- clear A/B/C/D badge
- touch-friendly
- current spoken answer card should subtly lift / glow
- no layout shift while speaking

Wrong answer:
- supportive feedback
- no harsh red “failure” treatment

Correct answer:
- celebratory but not disruptive

---

## 9. Voice / ElevenLabs Requirements

### General

TTS must sound natural, not like disconnected API clips.

Natural sequence:
1. question
2. short pause
3. A
4. answer A
5. pause
6. B
7. answer B
8. pause
9. C
10. answer C
11. pause
12. D
13. answer D

Do **not** say “Antwoord A” / “Answer A” unless explicitly requested.

### Dutch

Target is **Netherlands Dutch (nl-NL)**.

Reject:
- Flemish / Belgian Dutch if the selected product direction remains Netherlands Dutch
- English accent
- browser/system voice fallback that unexpectedly changes accent

### English

Use consistent native English voice target (currently intended US English unless product direction changes).

### Pronunciation

Audit:
- A/B/C/D
- GPS
- ISS
- DNA
- LED
- AI
- CO₂
- numbers
- abbreviations
- proper names

Avoid brittle phonetic hacks if proper SSML / context / model options produce better results.

### Timing

Target speech rate approximately natural child-friendly pacing, not rushed.

Existing intended behavior:
- question-to-answers has short pause
- answer-to-answer has short pause
- feedback reads naturally

### Cancellation

Speech must stop immediately on:
- answer click
- any navigation
- next question
- back
- changing voice
- changing language
- opening another screen

Abort pending network requests where feasible, not just audio playback.

### Volume

Milo and Luna should have similar perceived loudness.
Do not solve by blindly setting both element volumes to 1.0; normalize perceived loudness where possible.

### Security

ElevenLabs secret key must never ship in frontend or iOS app.
Production architecture must be:

Kwizillo client → secure HTTPS backend → ElevenLabs

Backend must use:
- environment secret
- access control where appropriate
- rate limiting
- request validation
- timeouts
- caching
- safe error handling

### Child privacy

Do **not** send a child’s entered name to ElevenLabs in production unless privacy/legal requirements are explicitly satisfied.

Safer production pattern:
- display child name locally
- speak generic welcome message

Example:
“Hallo! Leuk dat je samen wilt leren. Laten we beginnen.”

---

## 10. Audio System

Must remain centralized in one audio manager.

Audio categories:
- music
- sound effects
- voice

User controls:
- FX on/off
- music on/off
- FX volume
- music volume
- voice selection
- speech speed if retained
- music track selection if retained

Music:
- seamless loops
- no audible gap at loop boundary
- crossfade between tracks/worlds

Voice ducking:
- music lowers during speech
- returns smoothly after speech
- never gets stuck quiet

SFX:
- tap
- correct
- wrong
- reward
- world transition

Do not let multiple managers/audio elements fight each other.

---

## 11. Collection / Progress Systems

Collection has tabs:
- Worlds
- Cards
- Mascots

All must be interactive.

World collectible visuals should match the correct content.
Examples:
- Mercury → planet art
- Elephant → animal art
- Volcanoes → volcano art
- Pyramids → Egypt/history art
- Science → lab/science art
- Mystery → portal/crystal art

Knowledge cards should derive from correctly answered questions.

Mascots should have clear unlock conditions.

Do not use static progress placeholders.

---

## 12. Achievements / Statistics

All statistics must derive from real gameplay state.

Examples:
- total answered
- total correct
- accuracy
- per-world progress
- quizzes completed
- unlocks

Achievements must unlock based on real state.

No static screenshots pretending to be data.

---

## 13. Internationalization

Current languages:
- Dutch
- English

Changing language must change:
- navigation
- buttons
- settings
- onboarding
- world names
- topic names
- question bank
- answers
- hints
- explanations
- feedback
- result text
- collection labels
- achievements
- statistics
- voice locale

Changing language must **not** change the visual design.

The same UI structure must be used for NL and EN.

Do not maintain a separate English home layout.

---

## 14. State / Persistence

Use one clear state model.

Persist at minimum:
- language
- name
- voice
- school group / level
- XP
- coins
- streak
- questions answered
- correct answers
- quiz runs
- world progress
- topic progress
- unlocked collection items
- selected mascot
- audio settings
- onboarding completion

Migration must be deliberate if storage schema changes.

Do not silently corrupt old local state.

---

## 15. Technical Cleanup Goal

There have historically been multiple iterative builds and override layers.

Your cleanup target is:
- one Home implementation
- one World implementation
- one Quiz implementation
- one Bottom Navigation implementation
- one State store/model
- one Audio manager
- one TTS manager
- one localization system
- one design system

Audit for:
- dead CSS
- duplicated selectors
- version-specific overrides
- obsolete screens
- unused assets
- duplicate event listeners
- duplicate route handlers
- multiple audio managers
- multiple TTS managers
- stale test assets
- baked UI screenshots
- API key leakage

Do not remove anything without verifying references.

---

## 16. QA Requirements

### Visual QA

For each screen:
1. run app
2. capture screenshot
3. compare with approved direction
4. fix
5. recapture

Test on real mobile dimensions, not only desktop browser.

Minimum viewport/device coverage:
- compact iPhone
- standard iPhone
- Pro Max-size iPhone
- desktop browser test harness

Check:
- safe areas
- Dynamic Island/notch
- bottom home indicator
- text wrapping
- 44pt-ish touch target expectation
- cropping
- scroll behavior
- orientation assumptions
- keyboard opening on onboarding

### Functional QA

Test every button and route.

Must include:
- intro tap-to-skip
- onboarding
- NL / EN
- Milo / Luna / Silent
- six worlds
- 24 topics
- mixed quiz
- 10-question completion
- Quiz 1 → Quiz 2
- hint
- answer feedback
- collection tabs
- mascot selection
- achievements
- statistics
- settings
- sound controls
- reload persistence

### Failure QA

Test:
- no internet
- slow internet
- ElevenLabs timeout
- bad ElevenLabs response
- backend unavailable
- rapid tapping
- double-tap answers
- navigating during TTS
- language change during session
- app background/foreground

No normal user flow should produce:
- JS error
- 404
- 400
- 401
- 500
- stuck overlay
- orphaned audio
- overlapping speech

---

## 17. iOS / App Store Direction

User already has an Apple Developer account.

Target roadmap:
1. clean web release candidate
2. Capacitor-based iOS wrapper around approved web game
3. Xcode project
4. physical iPhone testing
5. TestFlight
6. multiple test rounds
7. App Store submission

Do not immediately submit to App Store.

### iOS requirements

- Capacitor preferred unless repo architecture strongly suggests another minimal-risk route
- preserve existing web game
- iOS safe-area CSS
- app icon
- launch screen
- native status bar configuration
- production HTTPS API endpoints
- no local Mac dependency
- no API secrets in app bundle
- Release build compiles cleanly
- correct bundle identifier
- signing configured for user’s Apple Developer account

### Kids/privacy

Kwizillo is intended for children.
Before submission, verify current Apple Kids Category / App Review requirements.

Product principle:
- no ads
- no third-party tracking
- minimize analytics
- no unnecessary personal child data
- parental gate for external links / sensitive settings if required
- privacy policy
- clear data flow inventory

Do not assume old policy text is still current. Verify before submission.

---

## 18. Development Workflow

### Phase 1 — Audit

Create `AUDIT.md`.
Do not substantially change app yet.

Document:
- architecture
- active files
- dead/legacy files
- UI layer conflicts
- state architecture
- TTS/audio architecture
- question banks
- assets
- server/backend
- security findings
- top bugs
- recommended cleanup

Commit:
`audit: document current Kwizillo architecture and release blockers`

Stop and report.

### Phase 2 — Cleanup

Execute approved cleanup.

Goals:
- remove legacy layers
- consolidate duplicate logic
- one design system
- one state system
- one audio/TTS system
- preserve current functionality

Run tests.
Commit.
Stop and report.

### Phase 3 — Visual/Game UX Polish

Screen-by-screen polish:
- Home
- Worlds
- Quiz
- Hint
- Feedback
- Result
- Collection
- Achievements
- Statistics
- Settings

Screenshot before/after.
Test interactions.
Commit.
Stop and report.

### Phase 4 — Audio/TTS QA

Audit Dutch and English speech.
Test at least 20 questions NL + 20 questions EN.
Create `AUDIO_QA.md`.
Fix timing/pronunciation/cancellation/volume.
Commit.
Stop and report.

### Phase 5 — Release QA

Create `RELEASE_QA.md` containing:
- tested flows
- devices/viewports
- known issues
- passed checks
- failed checks
- performance concerns
- security concerns

Do not hide unresolved issues.
Commit.
Stop and report.

### Phase 6 — iOS / TestFlight

Only after web release candidate approval.

Create Capacitor/Xcode build.
Create `IOS_RELEASE_CHECKLIST.md`.
Build Release configuration.
Do not submit to App Review yet.
Stop when TestFlight-ready.

---

## 19. Commands / Repo Behavior

Do not assume commands until you inspect `package.json`, scripts, and project structure.

At the start of every phase:
- `git status`
- confirm branch
- inspect current diff
- do not overwrite user changes

Before commit:
- syntax/lint checks
- tests
- build if available
- run app
- inspect console

Use small, descriptive commits.

Never silently force reset or discard uncommitted work.

---

## 20. Definition of Done for Release Candidate

Kwizillo RC is not “done” because it looks good on one page.

RC requires:
- full NL flow passes
- full EN flow passes
- 6 worlds work
- 24 topics work
- 240 questions per language valid
- multiple quiz progression works
- no duplicate visual layers
- no dead buttons
- TTS stable
- audio stable
- collection works
- stats are dynamic
- progress persists
- no secrets client-side
- responsive on iPhone sizes
- no blocking console/network errors
- code structure understandable
- test documentation present

Only after that should iOS/TestFlight packaging begin.

---

## 21. Communication Style

Do not respond with vague statements such as “I polished the app” without evidence.

At each milestone report:
- files changed
- code removed
- bugs fixed
- tests executed
- screenshots produced
- failures remaining
- next recommended step

If something cannot be tested, say so clearly.

Never claim a TestFlight/App Store build is ready until the build has actually succeeded.
