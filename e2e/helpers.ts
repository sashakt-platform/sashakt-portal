import type { APIRequestContext, BrowserContext } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL;
export const E2E_USERNAME = process.env.E2E_USERNAME;
export const E2E_PASSWORD = process.env.E2E_PASSWORD;

if (!BACKEND_URL) {
	throw new Error('BACKEND_URL is required for e2e tests — set it in .env');
}
if (!E2E_USERNAME || !E2E_PASSWORD) {
	throw new Error(
		'E2E_USERNAME and E2E_PASSWORD are required for e2e tests — set them in .env'
	);
}

// Must stay in sync with src/lib/server/auth.ts
const SESSION_COOKIE = 'sashakt-session';
const REFRESH_COOKIE = 'sashakt-refresh';

type TokenResponse = {
	access_token: string;
	refresh_token: string;
	expires_in: number;
};

// The backend revokes the previous session whenever a new /login/access-token/
// call is made for the same user. Multiple tests/helpers calling login in
// parallel would invalidate each other's cookies, so cache the response and
// reuse it across helpers. `resetTokenCache()` lets specs that exercise
// logout flows force a fresh login on the next call.
let cachedTokens: TokenResponse | null = null;

export function resetTokenCache() {
	cachedTokens = null;
}

export async function getAccessToken(
	request: APIRequestContext,
	username = E2E_USERNAME,
	password = E2E_PASSWORD
): Promise<TokenResponse> {
	if (cachedTokens) return cachedTokens;
	const res = await request.post(`${BACKEND_URL}/login/access-token/`, {
		form: { username: username!, password: password! }
	});
	if (!res.ok()) {
		throw new Error(`Login failed (${res.status()}): ${await res.text()}`);
	}
	cachedTokens = (await res.json()) as TokenResponse;
	return cachedTokens;
}

/**
 * Skip the UI login flow by exchanging credentials for tokens directly against
 * the backend, then injecting the resulting cookies into the browser context.
 * Use this in specs that aren't testing the login form itself.
 */
export async function loginViaApi(
	context: BrowserContext,
	request: APIRequestContext,
	baseURL: string
): Promise<void> {
	const tokens = await getAccessToken(request);
	const { hostname, protocol } = new URL(baseURL);
	const isHttps = protocol === 'https:';
	const expires = Math.floor(Date.now() / 1000) + tokens.expires_in;

	await context.addCookies([
		{
			name: SESSION_COOKIE,
			value: tokens.access_token,
			domain: hostname,
			path: '/',
			httpOnly: true,
			secure: isHttps,
			sameSite: 'Strict',
			expires
		},
		{
			name: REFRESH_COOKIE,
			value: tokens.refresh_token,
			domain: hostname,
			path: '/',
			httpOnly: true,
			secure: isHttps,
			sameSite: 'Strict'
		}
	]);
}

// ──────────────────────────────────────────────────────────────────────────────
// API helpers for mutation specs — setup and teardown go through the backend
// directly so we don't depend on UI navigation for fixture data.

export type ApiUser = {
	id: number;
	full_name: string;
	email: string;
	phone: string;
	role_id: number;
	organization_id: number;
	is_active: boolean;
};

export const E2E_EMAIL_PREFIX = 'e2e-mutation-';

/** Returns a unique-enough suffix for emails/names so parallel CI runs don't collide. */
export function uniqueSuffix(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function authHeader(request: APIRequestContext) {
	const { access_token } = await getAccessToken(request);
	return { Authorization: `Bearer ${access_token}` };
}

export async function apiCreateUser(
	request: APIRequestContext,
	overrides: Partial<{
		full_name: string;
		email: string;
		password: string;
		phone: string;
		role_id: number;
		organization_id: number;
	}> = {}
): Promise<ApiUser> {
	const suffix = uniqueSuffix();
	const me = await apiGetMe(request);
	const body = {
		full_name: overrides.full_name ?? `E2E User ${suffix}`,
		email: overrides.email ?? `${E2E_EMAIL_PREFIX}${suffix}@example.com`,
		password: overrides.password ?? 'ChangeMe123!',
		phone: overrides.phone ?? '',
		role_id: overrides.role_id ?? 2, // System Admin — avoids state/district requirements
		organization_id: overrides.organization_id ?? me.organization_id,
		state_ids: [],
		district_ids: [],
		is_active: true
	};

	const res = await request.post(`${BACKEND_URL}/users/`, {
		headers: await authHeader(request),
		data: body
	});
	if (!res.ok()) {
		throw new Error(`apiCreateUser failed (${res.status()}): ${await res.text()}`);
	}
	return (await res.json()) as ApiUser;
}

export async function apiDeleteUser(
	request: APIRequestContext,
	userId: number | string
): Promise<void> {
	const res = await request.delete(`${BACKEND_URL}/users/${userId}`, {
		headers: await authHeader(request)
	});
	// 404 is fine — the test may have already deleted via UI
	if (!res.ok() && res.status() !== 404) {
		throw new Error(`apiDeleteUser failed (${res.status()}): ${await res.text()}`);
	}
}

async function apiGetMe(request: APIRequestContext): Promise<ApiUser> {
	const res = await request.get(`${BACKEND_URL}/users/me`, {
		headers: await authHeader(request)
	});
	if (!res.ok()) {
		throw new Error(`apiGetMe failed (${res.status()}): ${await res.text()}`);
	}
	return (await res.json()) as ApiUser;
}

export async function apiFindUserByEmail(
	request: APIRequestContext,
	email: string
): Promise<ApiUser | null> {
	const res = await request.get(
		`${BACKEND_URL}/users/?page=1&size=10&search=${encodeURIComponent(email)}`,
		{ headers: await authHeader(request) }
	);
	if (!res.ok()) {
		throw new Error(`apiFindUserByEmail failed (${res.status()}): ${await res.text()}`);
	}
	const body = (await res.json()) as { items: ApiUser[] };
	return body.items.find((u) => u.email === email) ?? null;
}

/**
 * Safety net for mutation specs: delete every user whose email starts with the
 * e2e prefix, so a crashed/aborted test doesn't leak rows.
 */
export async function apiCleanupTestUsers(request: APIRequestContext): Promise<void> {
	const res = await request.get(
		`${BACKEND_URL}/users/?page=1&size=100&search=${encodeURIComponent(E2E_EMAIL_PREFIX)}`,
		{ headers: await authHeader(request) }
	);
	if (!res.ok()) return;
	const body = (await res.json()) as { items: ApiUser[] };
	await Promise.all(
		(body.items ?? [])
			.filter((u) => u.email.startsWith(E2E_EMAIL_PREFIX))
			.map((u) => apiDeleteUser(request, u.id))
	);
}
