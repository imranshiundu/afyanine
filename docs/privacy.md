# Privacy — consent-first commitments

> **Status: draft** — these commitments are written down *before code exists* so that
> features can never quietly outgrow them. Amendments require editing this file visibly.

![Afyanine consent and data flow — draft](assets/privacy-flow.svg)

## The five commitments

1. **Consent before data.** No health category is stored or transmitted without an
   explicit, revocable grant from the mother. Consent is the gate on the data plane,
   not a UX formality.
2. **Contextual, not blanket.** The consent screen asks per category (vitals,
   symptoms, visits, partner/CHW visibility) in plain language, with the *option to
   decline* honored as a real state with real features (offline-only mode).
3. **Sensitive by default.** Maternal-health records are never sold, never blended into
   ad targeting or resale inventory, and never shipped with third-party trackers in
   the app.
4. **Minimize and bound.** Every collected field needs a purpose and a retention
   window. No purpose → no field. Retention windows are TBD but must exist per
   category; once chosen, they are enforced mechanically and published here.
5. **Deletion is self-serve.** A purge request doesn't require an email; the mother
   (or a guardian per policy) triggers it and gets a confirmatory receipt of what
   was destroyed and what was kept due to legal duty.

## Consent log

Consent state changes (grant/withdraw, per category, per viewer) are recorded so the
mother's record can answer "who knew what, when" — the log itself contains no health
data, only the change history.

## Regional compliance (to be validated)

Maternal-health data in the target region falls under personal-data protection laws
(e.g. **Kenya Data Protection Act, 2019** if Kenya-first). This section is a working
checklist — claims below get validated with proper advice before launch, not asserted
in confidence:

- [ ] Lawful basis mapping per data category
- [ ] Data-residency decision + hosting evidence
- [ ] Data-subject request path (access/correction/deletion) — self-serve vs. assisted
- [ ] Minors/guardianship policy for adolescent pregnancy scenarios
- [ ] Processor agreements with hosting, SMS, and analytics vendors

## Non-negotiables this doc backs into every future review

- Health data never becomes ad/resale inventory.
- Declining a category cannot degrade the app to "disabled" — limited mode stays useful.
- Any feature pull request that touches data flow must update a diagram (either this
  page or the architecture page) in the same pull request.
