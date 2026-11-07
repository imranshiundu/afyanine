# Reusable development environment

The tested Replit environment is **AfyaNine** (`afyanine`). Its configuration is
versioned in [`.replit-dev-environment.yaml`](../.replit-dev-environment.yaml).
In a future Replit chat, ask to use the AfyaNine development environment.

## What the environment provides

- Ubuntu 26.04 and Node.js 22.22.0.
- Locked npm dependencies, a generated Prisma client, and a production build.
- Local Postgres with the six fictional mothers from `prisma/seed.mjs`.
- Automatic database and Next.js development-server startup on port 3000.

The local database uses Unix-socket peer authentication: no database password or
external credentials are needed. It does not connect to the deployed Supabase
database. Supabase Realtime is intentionally unavailable in this configuration;
refresh to fetch new records. No real maternal data may be
entered: authentication and consent controls are not implemented.

## Run commands inside a provisioned sandbox

The configured start command runs automatically. If it has stopped, run:

```sh
service postgresql start
cd /afyanine
node /opt/afyanine-dev.cjs
```

The environment supplies `DATABASE_URL`. The machine-only launcher is generated
by the environment build, loads the repository's Next.js configuration, and
permits the sandbox preview origin. It uses webpack with hot reload and avoids
changing tracked app configuration. Restart it after changing `next.config.ts`.

Useful checks:

```sh
npm run build
curl -fsS http://localhost:3000/api/mothers
git status --porcelain
```

Whole-repository `npx tsc --noEmit` currently fails because the unused WebSocket
examples import undeclared `socket.io` and `socket.io-client` packages. The
production build skips TypeScript errors per the existing Next.js configuration;
its success is not a passing TypeScript check.

## Keep GitHub and the saved environment aligned

The YAML file is a versioned copy, not an automatic two-way sync. When changing
the environment, update this file in GitHub and apply the same specification to
the saved Replit environment through its approval flow. Build it successfully and
verify startup in a fresh sandbox before calling the setup reproducible.

The repository tracks `main`, so new builds take the current `main` revision;
already-running sandboxes keep their existing checkout until explicitly updated.
Do not commit database contents, credentials, dependency directories, or build
artifacts. The environment is owned by its creator and workspace admins; sharing
requires the environment's Share button in the web UI.
