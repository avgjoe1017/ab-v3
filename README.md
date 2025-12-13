# Affirmation Beats V3 (Repo Skeleton)

Monorepo layout:

- `apps/mobile` — Expo React Native app (uses `expo-audio`)
- `apps/api` — Bun + Hono API server + Prisma
- `packages/contracts` — Zod schemas, migrations, typed errors (single source of truth)
- `packages/audio-engine` — `expo-audio`-based singleton playback engine (3-track model)
- `packages/utils` — Pure utilities (no network/storage side-effects)

## Quick start

### Prereqs
- Node 20+ (or 22+)
- pnpm 9+
- Bun 1.1+

### Install
```bash
pnpm install
```

### Run API (dev)
```bash
pnpm -C apps/api dev
```

### Run Mobile (dev)
```bash
pnpm -C apps/mobile start
```

## Environment
Copy `.env.example` files as needed:
- `apps/api/.env.example` -> `apps/api/.env`
- `apps/mobile/.env.example` -> `apps/mobile/.env` (optional)

## V3 Architecture Spec
See `docs/V3_ARCHITECTURE.md`.
