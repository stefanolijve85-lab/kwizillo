# Kwizillo — App Store Connect setup for Premium

What the owner still has to do in App Store Connect (and Xcode) before the Premium
subscription can be sold. Every step is marked **OWNER ACTION** (only you can do it,
it needs your Apple account) or **CODE COMPLETE** (already in the repository).

The app side is documented in `MONETIZATION_IMPLEMENTATION_REPORT.md`. Ideas that
are deliberately *not* in this release are in `MONETIZATION_FUTURE.md`.

## Identifiers (decided 2026-09-16)

| | |
|---|---|
| Bundle identifier | `nl.kwizillo.app` |
| Subscription group | **Kwizillo Premium** |
| Monthly product id | `nl.kwizillo.app.premium.monthly` |
| Yearly product id | `nl.kwizillo.app.premium.yearly` |
| Target prices | Monthly €6,99 · Yearly €49,99 (Apple's local price tiers decide the exact amount per country) |
| Introductory offer | Yearly: **7-day free trial** (once per Apple ID, Apple enforces eligibility) |

All four ids live in one place in the code: `premium.js` → `CONFIG`. Nothing else
in the app spells them out.

## Step by step

1. **Bundle identifier** — OWNER ACTION. Register `nl.kwizillo.app` in the Apple
   Developer portal (Certificates, Identifiers & Profiles → Identifiers → App IDs)
   with the *In-App Purchase* capability. Use exactly this id when the Capacitor iOS
   project is created (see step 20); changing it later means new products and a new
   app record.
2. **Agreements** — OWNER ACTION. App Store Connect → Business → the *Paid Apps*
   agreement must be signed (subscriptions are paid content). Without it products
   never load, even in sandbox.
3. **Tax** — OWNER ACTION. Fill in the tax forms under the Paid Apps agreement
   (NL entity: W-8BEN-E or the EU form Apple presents).
4. **Banking** — OWNER ACTION. Add the payout bank account. Status must be *Active*.
5. **Subscription group** — OWNER ACTION. App Store Connect → your app → Subscriptions
   → create group **Kwizillo Premium**. One group, so a family can only hold one of
   the two plans at a time and can switch between them.
6. **Monthly product** — OWNER ACTION. In the group: *Create Subscription*, reference
   name "Kwizillo Premium Monthly", product id `nl.kwizillo.app.premium.monthly`,
   duration 1 month.
7. **Yearly product** — OWNER ACTION. Reference name "Kwizillo Premium Yearly",
   product id `nl.kwizillo.app.premium.yearly`, duration 1 year. Put it at rank 1
   in the group (the "higher" service level) and monthly at rank 2, so a switch
   from monthly to yearly is an upgrade that takes effect at once.
8. **Product ids** — CODE COMPLETE. `premium.js` `CONFIG.products.*.id`.
9. **Monthly price** — OWNER ACTION. Choose the price tier closest to €6,99 for
   the Netherlands; let Apple generate the other countries from it (review
   USD ≈ $6.99 and BRL for Brazil).
10. **Yearly price** — OWNER ACTION. Tier closest to €49,99; check USD ≈ $49.99 and BRL.
11. **7-day free trial** — OWNER ACTION. On the *yearly* subscription: Subscription
    Prices → Introductory Offers → *Free* → duration 1 week → all countries. Do
    **not** add an introductory price (€39,99 etc.) for RC1 — see `MONETIZATION_FUTURE.md`.
12. **Dutch localization** — OWNER ACTION. Group display name and per-product
    localization. Copy that matches the app:

    | Field | Text |
    |---|---|
    | Group name | Kwizillo Premium |
    | Monthly name | Kwizillo Premium — Maandelijks |
    | Monthly description | Alle werelden, 480+ kennisvragen, Rekenen, Memo, Weetjes en alle kaarten en mascottes. Maandelijks opzegbaar. |
    | Yearly name | Kwizillo Premium — Jaarlijks |
    | Yearly description | Alle werelden, 480+ kennisvragen, Rekenen, Memo, Weetjes en alle kaarten en mascottes. 7 dagen gratis proberen. |
13. **English (US) localization** — OWNER ACTION.

    | Field | Text |
    |---|---|
    | Group name | Kwizillo Premium |
    | Monthly name | Kwizillo Premium — Monthly |
    | Monthly description | All worlds, 480+ knowledge questions, math, memory, facts and every card and mascot. Cancel any time. |
    | Yearly name | Kwizillo Premium — Yearly |
    | Yearly description | All worlds, 480+ knowledge questions, math, memory, facts and every card and mascot. Try 7 days free. |
14. **Portuguese (Brazil) localization** — OWNER ACTION.

    | Field | Text |
    |---|---|
    | Group name | Kwizillo Premium |
    | Monthly name | Kwizillo Premium — Mensal |
    | Monthly description | Todos os mundos, mais de 480 perguntas, matemática, jogo da memória, curiosidades e todas as cartas e mascotes. Cancele quando quiser. |
    | Yearly name | Kwizillo Premium — Anual |
    | Yearly description | Todos os mundos, mais de 480 perguntas, matemática, jogo da memória, curiosidades e todas as cartas e mascotes. Experimente grátis por 7 dias. |
15. **Review screenshot** — OWNER ACTION. Each subscription needs one screenshot of
    the paywall as the reviewer will see it (take it from the iOS build; the web
    paywall is `K.showPremium()` — identical design).
16. **Subscription review notes** — OWNER ACTION. Suggested text: "Kwizillo is a
    children's learning game. Premium unlocks all worlds, questions and games; it
    contains no ads and no consumables. The purchase sits behind a parental gate
    (a multiplication the adult must answer) as required for the Kids category.
    Prices are read from StoreKit; the yearly plan has a 7-day free trial."
17. **Privacy policy link** — OWNER ACTION. A public URL (the app shows the privacy
    text in-app under Settings → Privacy; App Store Connect needs a web URL).
18. **Terms of Use link** — OWNER ACTION. Either your own URL or Apple's standard
    EULA (allowed for subscriptions). The app links "Gebruiksvoorwaarden" from the
    paywall; put the same URL in the App Store description.
19. **Sandbox tester** — OWNER ACTION. Users and Access → Sandbox → add a tester
    Apple ID (a fresh address). On the test iPhone: Settings → App Store → Sandbox
    Account. Sandbox trials/renewals run fast (a year = 1 hour) so expiry can be tested.
20. **iOS target + StoreKit 2** — CODE PENDING (separate phase). Create the
    Capacitor iOS project with bundle id `nl.kwizillo.app`, add the StoreKit
    capability, and implement the native bridge the web layer already expects:
    `window.KwizilloStoreKit` with `products(ids)`, `purchase(id)`, `restore()`,
    `currentEntitlement()`, `manageSubscriptions()` — see `premium.js`
    `storeKitProvider`. Add a `Kwizillo.storekit` configuration file in Xcode with
    both products and the trial for local StoreKit testing.
21. **TestFlight purchase test** — OWNER ACTION (after step 20). Buy monthly, buy
    yearly with trial, cancel in the sheet, Ask to Buy (pending) with a child
    sandbox account.
22. **Restore test** — OWNER ACTION. Delete and reinstall the app → Settings →
    Kwizillo Premium → Herstel aankopen → Premium is back, progress untouched.
23. **Expired subscription test** — OWNER ACTION. Let a sandbox subscription lapse
    (≈ 1 h for a yearly): content locks again, XP/cards/mascots stay.
24. **Production readiness** — OWNER ACTION. Products *Ready to Submit*, the
    binary references them, Kids category questionnaire answered, privacy
    nutrition labels: no data collected (Kwizillo sends no child data anywhere;
    Apple handles the purchase).

## What the app already does (CODE COMPLETE)

- Free/Premium entitlement, content gating, paywall, parental gate, restore and
  manage entries, pending destination, progress kept on expiry, three languages,
  StoreKit-unavailable fallback message, development purchase simulator (only on a
  plain http development host — never in an https deployment or in the iOS app).
- Localized prices come from the store; the app never hard-codes a price in the UI.
  The "per month" line under the yearly plan is computed from the store price.
