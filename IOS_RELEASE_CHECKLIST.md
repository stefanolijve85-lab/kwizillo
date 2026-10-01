# Kwizillo — iOS build & release checklist

The iOS app is a Capacitor 8 shell (Swift Package Manager, no CocoaPods) around the
web release candidate, plus one native plugin: StoreKit 2 for Kwizillo Premium.

| | |
|---|---|
| Project | `ios/App/App.xcodeproj` (scheme `App`) |
| Bundle id | `nl.kwizillo.app` |
| Deployment target | iOS 15.0 (StoreKit 2 needs 15; `AppStore.showManageSubscriptions` too) |
| Web build | `www/` — generated, git-ignored |
| Native plugin | `ios/App/App/KwizilloStoreKitPlugin.swift`, registered in `KwizilloViewController.swift` |
| StoreKit test config | `ios/App/Kwizillo.storekit` (both products, 7-day trial on yearly) |
| Speech backend | `https://app.kwizillo.nl/api/tts` (set by `tools/build-www.cjs`; `API_HOST=` overrides) |

## Build steps

```sh
node tools/build-www.cjs        # www/ from the repo root, pointed at the HTTPS proxy
npx cap sync ios                # copies www/ into ios/App/App/public and updates the SPM package
open ios/App/App.xcodeproj      # or:
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

Every change to the web app needs `build-www` + `cap sync` before the next Xcode build.

## Publisher: Solotech vof (decided 30 Sept)

Kwizillo is published from the existing Apple Developer account of **Solotech vof**
(team 26UQ38LCBQ, KvK 94214578), which already has an active Paid Apps Agreement.
The seller on the App Store and the bank account are always those of the account,
so revenue goes to Solotech's account. Should the app later move to another
company, App Store Connect can transfer an approved app to another account.

## In Xcode, once (OWNER ACTION)

1. **Signing & Capabilities** → Team: your Apple Developer team (automatic signing).
   Add the **In-App Purchase** capability. The bundle id is already `nl.kwizillo.app`.
2. **StoreKit testing**: Product → Scheme → Edit Scheme → Run → Options → StoreKit
   Configuration → `Kwizillo.storekit`. With this, the simulator and a connected
   iPhone buy against the local configuration (no App Store Connect needed):
   the paywall shows the two products in the storefront's currency, the yearly plan
   with "7 dagen gratis", purchases succeed, and Debug → StoreKit → Manage
   Transactions lets you refund/expire to test relocking.
3. **Ask to Buy**: in the StoreKit configuration editor enable *Ask to Buy* to test
   the pending state.
4. **Sandbox / TestFlight** (needs App Store Connect, see `APP_STORE_MONETIZATION_SETUP.md`):
   remove the StoreKit configuration from the scheme, sign in with a sandbox tester
   on the device, run the purchase / restore / expiry tests.

## What is where in the app

- Premium content lock, paywall, parental gate, restore, manage: web layer
  (`premium.js`, `premium-ui.js`) — identical to the web build.
- `window.KwizilloStoreKit` is created by `premium.js` from the Capacitor plugin;
  an entitlement stamped `ios` is only valid while that plugin exists, so a copied
  localStorage on the web is worthless.
- Transaction updates (renewal, revocation, approved Ask-to-Buy) arrive through the
  plugin's `entitlementChanged` event → `K.premium.refresh()`.
- The development purchase simulator does **not** exist in the app (`capacitor://`
  is not an http development host).

## Status of this phase

| Item | Status |
|---|---|
| Capacitor iOS project, SPM | CODE COMPLETE |
| StoreKit 2 plugin (products, purchase, verify, finish, current entitlements, updates, restore via `AppStore.sync`, manage sheet, trial eligibility) | CODE COMPLETE |
| JS bridge + entitlement validity tied to the native store | CODE COMPLETE |
| Light status bar, no-encryption declaration | CODE COMPLETE |
| App icon (since 1 Oct: the yellow K with a star on blue, master `assets/brand/app-icon-1024.png`; every size from `swift tools/app-icon.swift`) and launch screen (the intro's opening clouds, held by `@capacitor/splash-screen` until the film plays, 4 s safety net) | DONE 30 SEPT, checked in the iPhone 16 Pro Max simulator |
| iPad: universal target, portrait and landscape, layout scaled to fit | CODE COMPLETE, RUNS IN THE SIMULATOR |
| Simulator build | BUILD SUCCEEDED (Xcode 26.4.1); runs on the iPhone 16 Pro Max and the iPad Pro 11" (M4) simulators, plugin registered and reachable |
| Release archive for devices (generic iOS, unsigned) | ARCHIVE SUCCEEDED 30 SEPT (194 MB) |
| Signed build 1.0 (1) uploaded to App Store Connect (team 26UQ38LCBQ, automatic signing, `xcodebuild -exportArchive` with destination upload) | UPLOAD SUCCEEDED 30 SEPT 19:15 |
| Build 1.0 (2): intro plays with sound at once (web view allows media without a tap; no 'tap for sound' in the app) | UPLOADED 30 SEPT 19:38 |
| Build 1.0 (3): intro starts before the rest of the app (`intro-early.js`) | UPLOADED 30 SEPT |
| Build 1.0 (4): speech feedback as verdict + one explanation clip per question | UPLOADED 1 OCT 11:27 (archive + `-exportArchive`, destination upload) |
| Build 1.0 (5): every line said from a closed set of recordings (letter and answer apart, Rekenen in pieces, explanations reused); needs the v4 voice cache on the server | UPLOADED 1 OCT 15:09 (first try refused until the updated developer agreement was accepted) |
| Subscription review screenshots (paywall, free player, NL/EN/PT) | DONE 1 OCT — `store/screenshots/subscription/`, `tools/paywall-shots.cjs` |
| TestFlight on a real iPhone, sandbox purchase | NEXT — OWNER |
| Store texts, age rating, privacy label, review notes | READY — `STORE_LISTING.md` |
| Sandbox purchase, TestFlight | REQUIRES APP STORE CONNECT / TESTFLIGHT |

## iPad

The target has always been universal (`TARGETED_DEVICE_FAMILY = "1,2"`); what it
lacked was a layout and the orientations.

- **The layout is one design, 430 x 764.** A phone (under 581 px) gets it full
  bleed, exactly as before. Anything wider — an iPad, a browser window — scales
  that same design to fit with a transform, so the game is never laid out twice
  and never stretched: `--fit` in `m1-runtime.js`, the rule in `base.css`.
  Behind the frame stands the world the child is in, blurred and dimmed, so the
  space around the game belongs to the game.
- **Orientations**: `UISupportedInterfaceOrientations~ipad` now holds portrait,
  upside-down and both landscapes; the iPhone stays portrait-only. The design
  fits either way — in landscape it is bounded by the height.
- **Split View / Slide Over**: a narrow pane is under 581 px, so it falls back to
  the phone layout full bleed. Nothing is declared about `UIRequiresFullScreen`,
  which is what lets the app be resized at all — check Apple's current stance on
  that key before submission.
- **Covered by tests**: `tests/ipad.spec.js` — six iPad sizes portrait and
  landscape, the Split View pane, the phone layout unchanged, turning the device
  mid-screen, and a quiz where every control stays inside the frame and keeps a
  44 pt target.
- **Still owner action**: run it on a real iPad, and make the iPad screenshots
  App Store Connect asks for (13" and, if you list it, 11").

## Before App Review (later)

- Kids category **6–8** (decided 1 Oct); privacy labels "Data Not Collected".
- Public Privacy Policy and Terms of Use URLs. The live privacy pages still carry
  the publisher placeholder: pull `site/` on the server first.
- Trader status and App Review contact: Solotech vof, +31 591 561737, hallo@kwizillo.nl.
- `ALLOWED_ORIGINS` on the speech server must include `capacitor://localhost`
  (already in `.env.example`).
