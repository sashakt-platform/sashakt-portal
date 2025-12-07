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

## Deployment

This happens via CI/CD
