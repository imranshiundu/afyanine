# Contributing (single maintainer for now — rules exist anyway)

This repository is in **planning phase**. Rules are light but real:

## What we do not commit here

- **Real health data ever** — no test fixtures with plausible-but-real records, no
  SMS dumps, no screenshots from pilot devices.
- **Secrets** — `.env`, keys, tokens. `.gitignore` already excludes patterns; if you
  add a secret, rotate it and remove history rather than trusting the ignore.
- **Generated vendor blobs** — fonts, big binaries. Link them instead.

## Commit & branch style

- Branches: `feat/<topic>`, `docs/<topic>`, `chore/<topic>`
- Messages: one-line imperative summary, body optional but encouraged for decisions
  (why > what). Example:

  ```
  docs: define consent gate contracts

  Consent applies per category per viewer, checked on the write path,
  not just at UI time. Rationale in docs/privacy.md.
  ```

## Diagram rule

If a pull request changes behavior described by a diagram, it updates the diagram in
the same PR. Stale diagrams fail review, same as stale docs.

## Review bar before any code lands

Records/data model, authorizations, and sync policy must be decided in `docs/` before
implementation starts. Planning before pixels.
