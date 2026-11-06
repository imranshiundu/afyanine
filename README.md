<p align="center">
  <img src="assets/banner.svg" alt="Afyanine — maternal health monitoring" width="640"/>
</p>

<h1 align="center">Afyanine</h1>
<p align="center">
  <b>afya</b> (health) + <b>nine</b> (months) · <i>maternal health monitoring — consent-first, offline-ready</i>
</p>

> **Status: Planning phase.** No application code has been committed yet.
> This repository exists to capture decisions first: scope, stack, privacy posture.
> Documentation lives in [`docs/`](docs/).

---

## Documentation

| Document | What it covers |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | Draft component view + diagram, honest unknowns |
| [`docs/privacy.md`](docs/privacy.md) | Consent-first commitments, consent gate, compliance checklist |
| [`docs/contributing.md`](docs/contributing.md) | What never gets committed here, commit style, review bar |

Visual assets: [`assets/banner.svg`](assets/banner.svg) · [`assets/logo.svg`](assets/logo.svg) · diagrams under [`docs/assets/`](docs/assets/).

## Purpose (draft)

Help expectant mothers and their supported caregivers track the pregnancy journey —
antenatal schedule reminders, vitals logging, symptom awareness, and connections to
healthcare providers.

## Open decisions (to resolve before any code lands)

| # | Decision | Options |
|---|----------|---------|
| 1 | Target platform(s) | Android-first (low-end friendly?), PWA, iOS later |
| 2 | Core feature set (MVP) | antenatal timeline · reminder engine · vitals log · symptoms · teleconsult hook |
| 3 | Backend & data residency | hosting region + data-residency evidence |
| 4 | Identity & access | phone-number-first auth? Community health worker accounts? |
| 5 | Offline strategy | how much must work with zero connectivity |
| 6 | Languages | Swahili-first? i18n framework choice |

## Non-negotiable design principles

1. **Maternal health data is sensitive by default.** Consent, minimization, and clear
   retention rules get designed in from day one — not retrofitted ([details](docs/privacy.md)).
2. **Works where the users are.** Patchy networks, older devices, low storage.
3. **No marketing data.** Health data never becomes ad or resale inventory.

## Next steps

- [ ] Confirm MVP feature scope (per-semester goals)
- [ ] Choose platform + stack
- [ ] Sketch data model with privacy annotations
- [ ] Threat-model the data flows
- [ ] Then, and only then, write code
