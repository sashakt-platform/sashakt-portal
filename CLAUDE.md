# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Sashakt Portal is a SvelteKit (Svelte 5) admin frontend for the Sashakt platform. It communicates with a separate backend API via `BACKEND_URL` env var using bearer token authentication.

## Tech Stack

- **Framework**: SvelteKit (Svelte 5) with TypeScript
- **Styling**: Tailwind CSS v4 with tailwind-merge and tailwind-variants
- **UI Components**: bits-ui, formsnap
- **Forms**: sveltekit-superforms with Zod validation
- **Tables**: TanStack Table Core (via `DataTable.svelte`)
- **Testing**: Vitest (unit), Playwright (e2e)
- **Package Manager**: pnpm
- **Adapter**: @sveltejs/adapter-node
- **Monitoring**: Sentry (@sentry/sveltekit)

## Commands

- `pnpm dev` — Start dev server
- `pnpm build` — Build for production
- `pnpm check` — Run svelte-check for type errors
- `pnpm lint` — Run prettier + eslint checks
- `pnpm format` — Auto-format code with prettier
- `pnpm test:unit` — Run unit tests in watch mode (vitest)
- `pnpm test:unit -- --run` — Run unit tests once (no watch)
- `pnpm test:unit -- --run src/path/to/file.test.ts` — Run a single test file
- `pnpm test:e2e` — Run Playwright e2e tests
- `pnpm test` — Run all tests (unit + e2e)

## Architecture

### Route Structure

- `src/routes/(admin)/` — Protected admin routes (dashboard, users, tests, questionbank, tags, certificate, entity, forms, organization, profile)
- `src/routes/[organization]/` — Organization-scoped public pages (dynamic param)
- `src/routes/api/` — API endpoints (dashboard stats, filters, organization, certificates)
- Auth pages (login, forgot-password, reset-password, logout) are at the route root

### Auth & Hooks (`src/hooks.server.ts`)

Server hooks are composed with `sequence()` in this order:

1. **Sentry** — Error tracking
2. **handleOrganization** — Resolves org from URL, cached in-memory (5min TTL, 100 max entries)
3. **handleAuth** — Validates session token → tries refresh token → redirects to `/login`
4. **admin** — Protects `/(admin)/*` routes, redirects unauthenticated users

User context is available via `event.locals.user` (includes permissions, states, districts, organization_id) and `event.locals.session` (access token).

### Permission System (`src/lib/utils/permissions.ts`)

- `PERMISSIONS` object with string constants
- Helpers: `hasPermission()`, `hasAnyPermission()`, `canCreate()`, `canRead()`, `canUpdate()`, `canDelete()`
- Server-only: `requirePermission()` throws `error(403)` if denied
- Role detection: `isStateAdmin()`, `hasAssignedDistricts()`

### Data Loading Pattern (+page.server.ts)

Listing pages follow a consistent pattern:

1. `requireLogin()` + permission check
2. Extract URL query params (page, size, search, sort_by, sort_order)
3. Fetch from `BACKEND_URL` with bearer token
4. Return data + pagination metadata

### Forms & Validation

- Zod schemas are co-located with routes (e.g., `routes/(admin)/users/[action]/[id]/schema.ts`)
- Server: `superValidate(request, zod4(schema))` — returns `fail(400, { form })` on error
- Client: `superForm(data.form, { validators: zod4Client(schema) })`
- Success redirects use `sveltekit-flash-message`'s `redirect()` with toast messages

### Key Reusable Components (`src/lib/components/`)

- `ListingPageLayout.svelte` — Standard listing page template with snippet slots (headerActions, toolbar, filters, content, emptyState)
- `DataTable.svelte` — TanStack-powered table with pagination, sorting, row selection, expansion
- `DeleteDialog.svelte` — Delete confirmation for single/batch operations
- `Filteration.svelte` — Multi-select filter popover with debounced search
- UI primitives in `src/lib/components/ui/` — bits-ui based (form, input, dialog, table, sidebar, etc.)

### State Management

No stores directory — state is managed via:

- Svelte 5 runes (`$state`, `$derived`, `$effect`)
- URL search params (pagination, sorting, filtering)
- Flash messages (`sveltekit-flash-message`) and toasts (`svelte-sonner`)

## Testing

### Unit Tests (Vitest)

Two test projects configured in `vite.config.ts`:

- **Client tests** (`*.svelte.test.ts`): Run in jsdom, use `@testing-library/svelte` for component rendering
- **Server tests** (`*.test.ts`, excluding `*.svelte.test.ts`): Run in Node, test server load/actions with mocked fetch

### E2E Tests (Playwright)

Located in `e2e/`. Config builds and previews the app on port 4173.

## Conventions

- Use top-level imports (not inline/dynamic imports unless necessary)
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`, etc.)
- Use Zod schemas for form validation with sveltekit-superforms
- Follow SvelteKit file-based routing conventions (+page.svelte, +page.server.ts, +layout.svelte, etc.)
- URL params as primary state for listing pages (page, size, search, sort_by, sort_order)
