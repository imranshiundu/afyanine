# Architecture — draft overview

> **Status: draft.** No stack or vendor is committed yet.
> The diagram below describes *responsibilities*, not technologies.

![Afyanine system overview — draft](assets/architecture-overview.svg)

## What the component names actually mean

| Component | Responsibility | Why it is drawn this way |
|---|---|---|
| **Mother's phone** | Primary source of truth while offline. Vitals and symptoms are typed in or collected by peripherals (if added later), stored locally, cached. | Households have patchy data — the app must **never** lose usable function offline. |
| **Sync / outbound queue** | Resumable, retry-with-backoff upload path from phone → cloud, with conflict resolution that prefers **newer locally recorded values**. | Networks drop mid-upload; a queue decouples UX from connectivity. |
| **API + auth** | Phone-number-first identity (proposed), rate-limited, audited. | Low-friction login matters; phone numbers are universal in the target market. |
| **Consent service** | Holds current consent state per data category, per viewer. Every write is checked against it before it is allowed. | Consent is not a checkbox at signup — it is a **gate on the data plane**. |
| **Core data store** | Encrypted at rest, retention rules applied on schedule. | The single place maternal-health records live; smaller trust surface. |
| **Clinician view** | Case review and referrals, scoped so clinicians see only the consented subset. | Rewards consent: without it, a clinician sees less, not more. |
| **Aggregate analytics** | Population-level signals only, small-group shielding, no raw export, no third-party marketing data flow. | "No marketing data" principle outputs here. |

## Honest unknowns (tracked, not hidden)

- [ ] Exact sync conflict policy (last-write-wins per field vs. per-record)
- [ ] Where end-to-end encryption can meaningfully start (especially for CHW-mediated notes)
- [ ] Whether analytics runs in-region
- [ ] Realistic device floor (how old can the lowest supported Android be?)

## How this evolves

When a stack decision lands, this page gets a second diagram: the **technology view**
(ways components map onto concrete tools), and the component view is kept for the
"why it is shaped this way" record. Together they become the review artifact for
every future feature proposal.
