# Sashakt Admin Portal

[![codecov](https://codecov.io/gh/sashakt-platform/sashakt-portal/graph/badge.svg?token=QWAAIN9EB7)](https://codecov.io/gh/sashakt-platform/sashakt-portal)
[![Test status](https://github.com/sashakt-platform/sashakt-portal/actions/workflows/test-run.yml/badge.svg)](https://github.com/sashakt-platform/sashakt-portal/actions/workflows/test-run.yml)

This builds the frontend interface for managing Sashakt platform.

## Developing

Clone this repo and installed dependencies with `pnpm install`, start a development server:

```bash
pnpm run dev

# or start the server and open the app in a new browser tab
pnpm run dev -- --open
```

## Building

To create a production version of your app:

```bash
pnpm run build
```

You can preview the production build with `npm run preview`.

## Testing

### Unit tests (Vitest)

```bash
pnpm test:unit                 # vitest (watches in an interactive terminal, exits in CI)
```

### End-to-end tests (Playwright)

E2E tests run against a real running backend
([`sashakt-platform/sashakt-core`](https://github.com/sashakt-platform/sashakt-core);
see its README for boot + seed instructions). Once the backend is up with
sample data, set these in `.env`:

Then run:

```bash
pnpm test:e2e
```

Specs live in `e2e/`. `e2e/helpers.ts` exposes `loginViaApi()` for non-auth
specs to skip the UI login. Tests run serially (`workers: 1`) — they share
a single backend session, so a concurrent logout would invalidate it.

CI runs the same suite on every PR via `.github/workflows/e2e.yml`, which
checks out `sashakt-core`, boots it via Docker Compose, and seeds it before
running Playwright.

## Deployment

This happens via CI/CD
