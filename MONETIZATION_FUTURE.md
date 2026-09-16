# Kwizillo — monetization ideas that are deliberately NOT in RC1

RC1 sells exactly two things — Premium Monthly and Premium Yearly (with a 7-day
free trial) — through Apple. Everything below is parked. None of it is implemented,
and nothing in the code assumes any of it.

## Introductory first-year price (e.g. €39,99)
An introductory *price* on the yearly plan (Apple: Subscription Prices → Introductory
Offers → Pay as you go / Pay up front). The paywall would then show the offer price
with the regular price after it. Do this only once the base flow has proven itself in
production, and never together with the free trial on the same product (Apple allows
one introductory offer per customer).

## Family plan / several child profiles
There is one profile per device today. A "Premium Family" tier could add up to
four child profiles (own name, group, progress, collection). That is a state-model
change (`state.js`: progress per profile, a profile switcher behind the parental
gate) before it is a monetization change. Apple's Family Sharing for subscriptions
is a separate switch in App Store Connect that needs no code.

## School / teacher plans and classroom licensing
Volume purchase through Apple School Manager, or a web subscription managed by a
teacher. Needs accounts and a backend, which Kwizillo does not have and does not
need for consumers.

## Web subscription
If Kwizillo is ever sold outside the App Store (Android, web), the entitlement layer
in `premium.js` is provider-based: a `webProvider` (Stripe/Mollie) or a Google Play
provider would slot in next to `storeKitProvider`. Inside the iOS app only Apple's
purchase route may exist.

## Content packs
Only if a pack is a genuinely separate product (a new subject area, a new language
pack). Cards, mascots, coins, hints and lives are never for sale — the child earns
them by playing.

## Analytics
No analytics exist and none were added. If a privacy-friendly, first-party counter
is ever wanted, the events that make sense are: premium_viewed,
premium_parent_gate_completed, purchase_started, purchase_success,
purchase_cancelled, purchase_pending, purchase_failed, restore_started,
restore_success — with no identifiers.
