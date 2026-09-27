# Kwizillo — children's-app compliance

What Kwizillo does with data, why that satisfies the rules for a children's app on
both stores, what is already proven by tests, and what still has to be filled in
by hand before submission. Checked against the store rules as they stand on
**27 September 2026**.

The one-line version: **Kwizillo collects nothing.** The child's name, settings
and progress never leave the device, the app has no accounts, no ads, no
analytics and no third-party SDKs, and the only request it makes is the sentence
its own speech proxy reads aloud.

## 1. Data inventory

| What | Where it lives | Leaves the device? | Kept for | Why |
|---|---|---|---|---|
| Name the child types | `localStorage` `kwizillo-state` | No | Until erased or the app is deleted | Greeting on screen |
| Language, voice, sound, school year, level | same | No | same | Settings |
| Progress: quizzes, correct answers, XP, coins, streak, cards, medals, mascots | same | No | same | The game |
| Fresh-start switch | `kwizillo-fresh-start` | No | same | Parent setting |
| Premium active yes/no | `kwizillo-entitlement` (cache of the App Store's answer) | No | same | Unlocks |
| Dev test unlock | `kwizillo-test-unlock` (dev hosts only) | No | same | Testing |
| The sentence being read aloud | request to `/api/tts` on our own server, then ElevenLabs | **Yes** — game text only | Audio cache on the server, no personal data | The guide's voice |
| IP address of a speech request | server memory | n/a | ≤ 60 s (rate-limit window), never written to disk | Stops abuse of the proxy |

Not present at all: accounts, e-mail addresses, passwords, advertising id,
device id, location, contacts, camera, microphone, cookies, analytics, crash
reporting, third-party SDKs, server-side user records.

`server.js` writes no request log with IP addresses (the `LOG_REQUESTS`
development switch logs method, path and user-agent only).

## 2. What proves it

| Claim | Proof |
|---|---|
| Nothing but our own origin is contacted | `tests/privacy.spec.js` records every request of a full session and fails on any foreign host |
| The child's name never leaves the device | same test checks every URL, every request body and every spoken line; `tests/strings.test.js` fails if any spoken string in any of the nine languages contains a `{name}` placeholder |
| No cookies | same test asserts `document.cookie === ''` |
| The page cannot load or call a third party even by accident | the `Content-Security-Policy` meta in `index.html` (`default-src 'self'`, `connect-src 'self'` — widened only to the production API host by `tools/build-www.cjs`), asserted in `tests/privacy.spec.js` |
| The parent portal really erases everything | `tests/privacy.spec.js` drives the gate, the confirm and the reload, then asserts that every `kwizillo-*` key is gone and the fresh state holds no name |
| The speech key is server-side only | `config.js` holds URLs only; `tests/server-static.test.js` covers the proxy's error handling and origin allowlist |

## 3. In-app parent portal

Parent zone → **Privacy & veiligheid** (`K.showPrivacy` in `m1-ui.js`), in all
nine languages:

- what is stored on this device, **with the real values** (name, counts, cards);
- what leaves the device, naming ElevenLabs as the only third party;
- what the app never does (ads, analytics, accounts, sensors, cookies);
- how long anything is kept and that we hold no copy — the retention statement
  the amended COPPA Rule wants inside the notice itself;
- **Alle gegevens wissen** → parental gate → confirm → every `kwizillo-*` key is
  removed and the app restarts at the first run;
- a contact address, behind the same gate because it leaves the app.

Parental gates (`showParentalGate`, a two-digit × one-digit multiplication) sit
in front of: erasing data, resetting progress, sharing a score, the mail link,
and every path that leads to a purchase (`premium-ui.js` gates both the locked
teaser and the Premium card in the parent zone).

## 4. Apple

| Requirement | State |
|---|---|
| 1.3 — no links out, no purchasing, no distractions outside a parental gate | Met. The only outbound link is the gated `mailto:`; every purchase path is gated |
| 1.3 / 5.1.4 — no personally identifiable or device information to third parties | Met, and tested |
| 1.3 — no third-party analytics or advertising | Met: there are none |
| 5.1.4 — privacy policy for a Kids Category app | `site/privacy.html` + `site/en/privacy.html`, rewritten 27-09-2026, same text as the in-app screen |
| Privacy manifest (`PrivacyInfo.xcprivacy`) | Added to the app target: `NSPrivacyTracking false`, no tracking domains, **no collected data types**, `NSPrivacyAccessedAPICategoryUserDefaults` / `CA92.1` |
| App Privacy answers in App Store Connect | Answer **Data Not Collected**. Nothing is linked to the user, nothing is used for tracking |
| Age rating questionnaire (the expanded 4+/9+/13+/16+/18+ set, mandatory since 31-01-2026) | To answer in App Store Connect: no violence, no mature themes, no gambling, no user-generated content, no chat, no ads, no unrestricted web access. Expected result 4+ |
| Kids Category age band | **Decision for Stefan.** The game reads questions aloud and asks for a school year: 6–8 fits the content best. 4–5 would force simpler wording; 9–11 undersells the younger half of the audience |
| Declared Age Range API | Not needed: no social features, no user-generated content |
| Subscriptions in a kids app | Allowed, gated. Terms and privacy are reachable from the Premium screen; auto-renew wording is in `settings.termsBody` |
| `UIRequiredDeviceCapabilities` | Fixed: was `armv7` (a 32-bit-only claim), now `arm64` |
| Trader status (EU DSA, mandatory in App Store Connect) | **Open:** needs legal name, address, phone number and e-mail of the publisher |

## 5. Google Play

| Requirement | State |
|---|---|
| Target Audience and Content: declare the age groups | To do in Play Console; primary target is children, so the Families policy applies |
| Families policy: no ads SDKs, or only self-certified ones | Met: no ads at all |
| No AAID, SIM/Build serial, BSSID, MAC, SSID, IMEI, IMSI | Met: the app reads none of them |
| Only APIs/SDKs approved for child-directed services | Met: Capacitor and the app's own code; no third-party SDK |
| Data safety section | Declare: no data collected, no data shared. Google audits this against real behaviour — the CSP and `tests/privacy.spec.js` keep the app honest |
| Privacy policy URL | `https://kwizillo.nl/privacy.html` (and `/en/privacy.html`) |
| IARC content rating questionnaire | To answer; expect the lowest band |
| Account deletion (in-app **and** via a web resource) | Not applicable: the app creates no accounts. The in-app erase covers the device data and the privacy policy says so explicitly |
| Designed for Families programme | Optional; worth opting into once the store listing exists |

## 6. COPPA (amended Rule, in force since 22 April 2026)

- No personal information is collected from children, so no verifiable parental
  consent is required. What the child types stays on the device.
- The notice states **what is kept, where, for how long and how to delete it**,
  in the app and on the site — the written retention policy the amended Rule
  requires inside the notice.
- Audio is never recorded: the microphone is not used, so no voiceprint or audio
  recording of a child exists anywhere.
- Written security programme: **open** — a short document naming who holds the
  ElevenLabs key, where the server runs, who can reach it, and how a problem
  would be handled. The technical side is in place (key server-side only, origin
  allowlist, rate limit, daily budget, HTTPS).

## 7. EU: GDPR and DSA

- Controller identity and contact details must be in the privacy notice —
  **open**: both policy pages carry a clearly marked placeholder for the
  publisher's legal name and address.
- Legal basis: none needed for the device-only data (it never reaches us). The
  speech proxy processes game text, not personal data; ElevenLabs acts as a
  processor and a data processing agreement should be on file.
- Rights (access, correction, erasure) are answered by the in-app erase, and the
  contact address is in the policy.
- DSA trader information (name, address, phone, e-mail) is mandatory in App
  Store Connect and in Play Console — see the open item above.

## 8. Open before submission

1. Publisher's legal name, address, phone number and e-mail — for both policy
   pages (replacing the placeholder), App Store Connect trader status and Play
   Console.
2. Decide the Kids Category age band (recommended: **6–8**).
3. Put `site/` live on `kwizillo.nl` / `kwizillo.com` so the privacy URLs
   resolve, and check that `hallo@kwizillo.nl` and `hello@kwizillo.com` receive
   mail.
4. Write the short security programme described in §6.
5. Data processing agreement with ElevenLabs on file.
6. Answer the questionnaires: Apple age rating, Apple App Privacy (Data Not
   Collected), Play Target Audience, Play Data safety, IARC.
7. Re-read this file at submission time: store rules move, and the dates above
   say when it was last checked.
