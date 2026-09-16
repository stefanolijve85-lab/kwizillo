# Kwizillo — Monetization implementation report (RC1)

Date: 2026-09-16 · Branch: `release/kwizillo-rc1` · Commits: `6830620`, `8d25469`, `e176e67`, `e4c6726` (web phase), `757ce93` (iOS + StoreKit phase)

Labels used below: **IMPLEMENTED**, **TESTED**, **NOT TESTED**, **REQUIRES APP STORE CONNECT**,
**REQUIRES PHYSICAL IPHONE**, **REQUIRES TESTFLIGHT**, **NOT IMPLEMENTED — IOS TARGET REQUIRED**.

## 1. Summary

Kwizillo now has a freemium model with one central entitlement layer. Free is a real
game (the whole starter world, the first quiz of every other world, math up to level 3,
two memo boards, a selection of facts, every voice, collection, achievements,
statistics, sharing). Premium unlocks everything. The child never sees a price: a
locked thing shows a friendly card, then a parent passes the gate, sees the paywall
with store prices, buys through the store, and the child's chosen content opens by
itself. Progress is never touched by buying or by expiry.

The iOS shell (Capacitor 8, Swift Package Manager, bundle id `nl.kwizillo.app`) and
the native StoreKit 2 plugin are in the repository too. The app **compiles** and
**runs in the iOS simulator**; the plugin is registered and reachable from the web
layer (verified in the running app: native=true, plugin=true, bridge=true,
provider=true, dev simulator off). Real products, purchases and receipts still need
App Store Connect and a device (or the StoreKit configuration in Xcode).

## 2. Existing architecture found

- Vanilla-JS single page app, one global `window.KWIZILLO_M1` (`K`), script order in
  `index.html`; one state store with schema/migration (`state.js`), one i18n table
  (`i18n.js`, nl-NL / en-US / pt-BR), one audio manager and one TTS manager
  (`m1-runtime.js`, key server-side in `server.js`).
- Content: 6 worlds × 4 topics, ≈480 questions per language; per world/topic a
  "run" with quiz number and used ids; math levels 1–6 from a global parent setting
  (`niveau`); memo boards per world + "all worlds"; 16 facts per world.
- A parental gate already existed (multiplication modal) for sharing and reset.
- No analytics, no purchase code, no Capacitor/iOS project.

## 3. New monetization architecture

```
premium.js         CONFIG (bundle id, products, FREE rules)
                   Entitlement (kwizillo-entitlement, validity, refresh on start/foreground)
                   PurchaseService (states, providers: storeKitProvider [contract], devProvider [simulator])
                   Gating rules + K.premium.can(kind, ...) / isPremium() / status()
                   Pending destination (setPending / runPending)
                   K.premiumDev (simulator controls — development hosts only)
premium-ui.js      lock badge, teaser, paywall, restore/manage, welcome, parent-zone card
m1-ui.js           K.parentalGate (shared gate), lock badges on topics/mix, Premium card in the parent zone, Terms modal
quiz-visual-v2.js / games-memo.js / games-math.js / facts-ui.js   gates inside the start functions
```

The rest of the app only calls `K.premium.isPremium()` / `K.premium.can(...)`.
`grep -c "isPremium\|premium.can"` outside premium*.js: 8 call sites, all at content entry points.

## 4. Changed files
`index.html`, `quiz-visual-v2.js`, `games-memo.js`, `games-math.js`, `facts-ui.js`,
`m1-ui.js`, `i18n.js`, `screens.css`, `tests/*.spec.js` (gameplay suites boot as Premium).

## 5. New files
`premium.js`, `premium-ui.js`, `tests/premium.spec.js`,
`APP_STORE_MONETIZATION_SETUP.md`, `MONETIZATION_FUTURE.md`, this report.

## 6. Free entitlement — IMPLEMENTED, TESTED
Onboarding, Home, all voices in all three languages, XP/coins/streak, achievements,
statistics, collection, sharing (behind the gate), settings — unchanged and free.
Content: see §8.

## 7. Premium entitlement — IMPLEMENTED, TESTED (simulator)
`kwizillo-entitlement` is kept next to the game state, never inside it. It is valid
only when `status==='active'`, not expired, and stamped by a store that exists on
this host: `ios` (verified StoreKit, once the native bridge exists) or `dev` (only on
a plain-http development host). A forged `ios` entitlement on the web is ignored
(tested). Refresh: at startup, after purchase/restore, and on `visibilitychange`.
Offline: the cached verified state is kept; nothing locks because a request failed.

## 8. Gating rules (premium.js → CONFIG.free)
| Area | Free | Premium |
|---|---|---|
| Quiz | Starter world **Ruimte**: every topic, every quiz number. Other worlds: mixed quiz 1 | everything |
| Math | sums of levels 1–3 (the parent's level setting is kept; levels 4–6 are starred) | levels 1–6 |
| Memo | boards **Ruimte** and **Alle werelden** (both modes, all levels) | every world |
| Facts | all 16 of Ruimte + the first 4 of every other world (a "n more with Premium" button) | all 96 |
| Cards / mascots / achievements / stats / sharing / voices | free | free |

Gates live in `K.startQuiz`, `K.startMemo`, `K.startMath` (cap) and the facts pool —
not in the tiles — so direct calls, saved destinations, back/refresh and state edits
cannot open Premium content (tested).

## 9. Product ids
`nl.kwizillo.app.premium.monthly`, `nl.kwizillo.app.premium.yearly`, group
"Kwizillo Premium", bundle id `nl.kwizillo.app` (chosen 2026-09-16; no bundle id
existed). All in `premium.js` `CONFIG`.

## 10. StoreKit implementation — IMPLEMENTED, COMPILES, TESTED IN SIMULATOR (bridge), NOT TESTED WITH STOREKIT CONFIG / SANDBOX
`ios/App/App/KwizilloStoreKitPlugin.swift` (StoreKit 2, iOS 15+): `Product.products`,
`product.purchase()` with verification and `finish()`, `Transaction.currentEntitlements`,
`Transaction.updates` listener → `entitlementChanged` event, `AppStore.sync()` for restore,
`AppStore.showManageSubscriptions`, `isEligibleForIntroOffer` for the trial. Registered by
`KwizilloViewController` (SceneDelegate root). `ios/App/Kwizillo.storekit` holds both
products and the 7-day trial for Xcode's local StoreKit testing. `tools/build-www.cjs`
builds the shipped `www/` with the HTTPS speech proxy. Build result: `xcodebuild … -sdk
iphonesimulator build` → **BUILD SUCCEEDED**; installed and launched on an iPhone 16 Pro
Max simulator (intro, onboarding, safe areas fine). Products came back empty there, as
expected without a StoreKit configuration or App Store Connect.

`storeKitProvider` in `premium.js` defines the bridge: `products(ids)` → `[{key,id,displayPrice,
price,currency,period,months,trialDays,trialEligible}]`, `purchase(id)` →
`{result:'purchased'|'pending'|'cancelled', entitlement?}`, `restore()`,
`currentEntitlement()`, `manageSubscriptions()` → `{result:'opened'}`. The web layer
handles every state (idle, loadingProducts, ready, purchasing, purchased, cancelled,
pending, failed, restoring, restored) and never shows a technical error.

## 11. Trial — IMPLEMENTED (architecture), REQUIRES APP STORE CONNECT
The yearly product carries `trialDays: 7`; "7 dagen gratis proberen" and the trial CTA
are shown only when the store reports `trialEligible` (simulator: `premiumDev.set({trialEligible:false})`
hides them). No local trial flag exists; Apple is the source of truth.

## 12. Parental gate — IMPLEMENTED, TESTED
One shared `K.parentalGate(onPass)` (multiplication a × b, wrong answer stays put),
used before: Premium (from the teaser and from the parent zone), restore/manage,
sharing, reset. External links are not opened from the child UI.

## 13. Score sharing protection — IMPLEMENTED (existing), unchanged
Share → parental gate → system share sheet / clipboard; the text contains the first
name the child typed, score, level and cards — no identifiers.

## 14–16. Localization — IMPLEMENTED, TESTED
All Premium strings exist in nl-NL, en-US, pt-BR (`i18n.js`, 55 keys × 3; a test
asserts every `premium.*` key resolves in all three and that the EN/PT paywalls contain
no Dutch). Prices come from the store in the store's currency; the "per month" value
is computed with `Intl.NumberFormat` for the app language.

## 17. ElevenLabs impact
None: voices stay free, the key stays server-side, cache/dedup/rate limit unchanged.

## 18. Security
- No secrets in the repository (`git ls-files` shows only `.env.example`, empty key).
- The purchase simulator (`K.premiumDev`) exists only when `location.protocol==='http:'`
  on localhost / private LAN; `capacitor://` and any https deployment never expose it,
  and a `dev` entitlement is invalid there.
- No child data leaves the device for Premium; the store only sees the product id.

## 19–20. Tests executed and results
`npx playwright test` — **84 passed** (76 existing + 8 new in `tests/premium.spec.js`):
free starter world / locked world; teaser → gate (wrong, then right) → paywall (prices,
recommended yearly, trial, legal text) → purchase → welcome → pending destination;
cancel / pending / error; bypass via direct calls and forged storage; restore none /
found; store unavailable; Premium keeps progress, expiry relocks; free math cap, memo
locks, facts counter; EN and PT paywalls.

## 21. Not tested
- With the StoreKit configuration in Xcode (REQUIRES XCODE RUN: select `Kwizillo.storekit`
  in the scheme, then Run): products with prices, purchase sheet, Ask to Buy, refund/expiry.
- Sandbox / TestFlight (REQUIRES APP STORE CONNECT + PHYSICAL IPHONE): real receipts,
  trial eligibility per Apple ID, renewal timing, Manage Subscriptions sheet.
- Signing (REQUIRES the owner's team in Xcode). Landscape (portrait-only app).

## 22. What App Store Connect needs
See `APP_STORE_MONETIZATION_SETUP.md` (24 steps, OWNER ACTION / CODE COMPLETE).

## 23. What a physical iPhone / TestFlight needs
The Capacitor iOS project with the StoreKit 2 bridge (next phase), a sandbox tester,
then the purchase/restore/expiry tests from the setup document.

## 24. Open points
- A shared Xcode scheme with the StoreKit configuration pre-selected (Xcode 26 rejected the
  hand-written scheme file; selecting the configuration in the scheme editor takes one step).
- "Beheer abonnement" on the web shows a hint; on iOS it opens Apple's sheet (plugin `manageSubscriptions`).
- App icon and launch screen are generated first versions.
- Terms of Use / Privacy need public URLs for App Store Connect (in-app texts exist).

## 25. Recommendations for RC2
- Build the iOS phase next; keep the simulator for LAN testing of the paywall.
- Consider Family Sharing (App Store Connect switch, no code) at launch.
- Keep the free/Premium split as data (`CONFIG.free`) so it can be tuned from
  real usage without touching the gates.
