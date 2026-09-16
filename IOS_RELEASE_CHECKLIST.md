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
| Portrait-only, light status bar, no-encryption declaration, icon + launch screen (first versions) | CODE COMPLETE |
| Simulator build | BUILD SUCCEEDED (Xcode 26.4.1, iPhone 16 Pro Max simulator); app runs, plugin registered and reachable |
| Signing, StoreKit config in the scheme, device run | REQUIRES PHYSICAL IPHONE / OWNER ACTION |
| Sandbox purchase, TestFlight | REQUIRES APP STORE CONNECT / TESTFLIGHT |

## Before App Review (later)

- Final app icon and launch screen from the brand (the current ones are generated
  from `assets/brand/logo.png` and Milo's cut-out).
- Kids category questionnaire; privacy labels "Data Not Collected".
- Public Privacy Policy and Terms of Use URLs.
- `ALLOWED_ORIGINS` on the speech server must include `capacitor://localhost`
  (already in `.env.example`).
