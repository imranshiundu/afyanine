# Afyanine

**Maternal health monitoring app** — *Swahili: "afya" (health) + "nine" (9 months of pregnancy)*

> **Status: Planning phase.** No application code has been committed yet.
> This repository exists to capture decisions first: scope, stack, privacy posture.

---

## Purpose (draft)

Help expectant mothers and their supported caregivers track the pregnancy journey —
antenatal schedule reminders, vitals logging, symptom awareness, and connections to
healthcare providers.

## Open decisions (to resolve before any code lands)

| # | Decision | Options |
|---|----------|---------|
| 1 | Target platform(s) | Android-first (dumbphone-friendly?), PWA, iOS later |
| 2 | Core feature set (MVP) | antenatal timeline · reminder engine · vitals log · symptoms · teleconsult hook |
| 3 | Backend & data model | due diligence on hosting region + data residency |
| 4 | Identity & access | phone-number-first auth? Community health worker accounts? |
| 5 | Offline strategy | low-connectivity households — how much must work offline |
| 6 | Languages | Swahili-first? i18n framework choice |

## Non-negotiable design principles

1. **Maternal health data is sensitive by default.** Consent, minimization, and clear
   retention rules get designed in from day one — not retrofitted.
2. **Works where the users are.** Assume patchy networks, older devices, low storage.
3. **No marketing data.** Health data never becomes ad or resale inventory.

## Next steps

- [ ] Confirm MVP feature scope (per-semester goals)
- [ ] Choose platform + stack
- [ ] Sketch data model with privacy annotations
- [ ] Threat-model the data flows
- [ ] Then, and only then, write code
