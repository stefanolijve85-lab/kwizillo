# Kwizillo — Android build & release checklist

The Android app is a Capacitor 8 shell around the same web release candidate as
iOS, plus one native plugin: Google Play Billing for Kwizillo Premium.

| | |
|---|---|
| Project | `android/` (Gradle, open in Android Studio) |
| Application id | `nl.kwizillo.app` (same as the iOS bundle id) |
| Min / target SDK | 24 / 36 |
| Web build | `www/` → `android/app/src/main/assets/public` (both git-ignored) |
| Native plugin | `android/app/src/main/java/nl/kwizillo/app/KwizilloBillingPlugin.java`, registered in `MainActivity.java` |
| Billing library | Play Billing Library 9.1.0 |
| Speech backend | `https://app.kwizillo.nl/api/tts`; the app's origin is `https://localhost`, which must be in `ALLOWED_ORIGINS` |

## Build steps

```sh
node tools/build-www.cjs          # www/, pointed at the HTTPS proxy
npx cap sync android              # copies www/ and the plugins into android/
cd android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
./gradlew assembleDebug           # app/build/outputs/apk/debug/app-debug.apk (emulator / phone)
./gradlew bundleRelease           # app/build/outputs/bundle/release/app-release.aab (Play Console)
```

`local.properties` (git-ignored) holds `sdk.dir=/Users/<you>/Library/Android/sdk`.

## Size

Google Play allows 200 MB compressed download per device. Measured on 30 Sept
with bundletool (`get-size total`) on the release bundle: **179.4 – 180.6 MB**
depending on screen density. About 19 MB of headroom. More artwork or film than
that needs Play Asset Delivery; the tour clips are already left out
(`tools/build-www.cjs`), photos are re-encoded at JPEG quality 5.

## What the Android app does differently

- **Back button / back gesture** (`native-back.js`): closes what lies on top, else
  uses the screen's own back button, else goes Home; on Home it puts the app away.
  In the runner it pauses. Covered by `tests/native-back.spec.js`.
- **Orientation**: phones (smallest width < 600 dp) portrait only, tablets turn
  freely — the same rule as iOS (`MainActivity.java`).
- **Edge to edge**: Capacitor's SystemBars injects `--safe-area-inset-*`; `base.css`
  uses those with `env()` as fallback. System bars are Kwizillo blue.
- **Launch**: Android 12+ shows Milo on Kwizillo blue (system splash API), older
  versions the intro's clouds; either way it stays up until the intro film plays
  (`@capacitor/splash-screen`, 4 s safety net).
- **Store texts**: the seven lines that name Apple / the App Store say Google Play
  in the Android app, in all ten languages (`store-texts.js`).
- **Premium**: same contract as StoreKit (`premium.js`); an entitlement is stamped
  `android` and only counts inside the Android app. Covered by
  `tests/premium-android.spec.js` with a stand-in plugin.

## Status

| Item | Status |
|---|---|
| Capacitor Android project, icon (adaptive + legacy), launch screen | DONE 30 SEPT |
| Back button, orientation, system bars, safe areas | DONE, tested in the emulator (API 36.1) and Playwright |
| Play Billing plugin | CODE COMPLETE, compiles; not yet tested against Play (needs the owner steps below) |
| Debug APK on the emulator: launch, intro, onboarding, back | PASSED |
| Release bundle | SIGNED with the upload key (30 Sept), 184 MB AAB, 180.6 MB max per-device download; copy on the Desktop in `Kwizillo-release/` |
| Upload key | CREATED: `~/.kwizillo/kwizillo-upload.jks`, passwords in `~/.gradle/gradle.properties`; SHA-256 8E:EC:08:A6:…:24:BB:8B |
| Play Console, internal testing | OWNER ACTION |

## Owner actions

1. **Google Play developer account** (one-off fee). Organisation account if the
   publisher is a company; Google asks for D-U-N-S / identity verification.
2. **Upload key** — create once and keep it safe (lose it and updates need a
   Play support request):
   ```sh
   keytool -genkeypair -v -keystore ~/kwizillo-upload.jks -alias kwizillo \
     -keyalg RSA -keysize 4096 -validity 10000
   ```
   Then in `~/.gradle/gradle.properties` (not in the repo):
   ```
   KWIZILLO_UPLOAD_STORE_FILE=/Users/<you>/kwizillo-upload.jks
   KWIZILLO_UPLOAD_STORE_PASSWORD=…
   KWIZILLO_UPLOAD_KEY_ALIAS=kwizillo
   KWIZILLO_UPLOAD_KEY_PASSWORD=…
   ```
   Opt in to Play App Signing when creating the app (the default).
3. **Create the app** in Play Console with package `nl.kwizillo.app`, upload the
   first signed `app-release.aab` to **Internal testing**.
4. **Subscriptions** (Monetise → Products → Subscriptions), same ids as iOS:
   - `nl.kwizillo.app.premium.monthly` — one auto-renewing base plan, 1 month.
   - `nl.kwizillo.app.premium.yearly` — one auto-renewing base plan, 1 year, plus
     an offer with a 7-day free trial for new customers.
5. **Licence key** (Monetise → Monetisation setup) into `~/.gradle/gradle.properties`
   as `KWIZILLO_PLAY_LICENSE_KEY=…`, so purchase signatures are checked on the
   device. Without it the plugin logs a warning and accepts the purchase.
6. **Licence testers** (Settings → Licence testing): your Google account, so test
   purchases are free and renew quickly.
7. **Store listing**: name, short and full description (nl, en), icon 512 × 512
   (`assets/brand/app-icon-1024.png` scaled), feature graphic 1024 × 500,
   phone and tablet screenshots (`node tools/store-shots.cjs` makes iPhone and
   iPad sizes; Play accepts those aspect ratios).
8. **App content**: privacy policy URL, Data safety form, content rating
   questionnaire, **target audience** (children → the Families policy applies:
   no ads SDKs, no third-party tracking, parental gate before purchases — the
   app already has one). Check Google's current Families and Designed for
   Families requirements before submitting; they change.
9. **Speech server**: `ALLOWED_ORIGINS` must include `https://localhost` (the
   Android app's origin) next to `capacitor://localhost` (iOS).
10. Test on a real Android phone via the internal testing link: purchase,
    restore, cancel in Play (Premium locks again on the next start), back
    button everywhere, audio, rotation on a tablet.

## Before production (later)

- Server-side purchase verification (Google Play Developer API) is stronger than
  the on-device signature check; worth adding once the speech server is live.
- `versionCode` / `versionName` in `android/app/build.gradle` go up with every
  upload.
