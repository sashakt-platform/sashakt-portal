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

export async function getAccessToken(
	request: APIRequestContext,
	username = E2E_USERNAME,
	password = E2E_PASSWORD
): Promise<TokenResponse> {
	const res = await request.post(`${BACKEND_URL}/login/access-token/`, {
		form: { username: username!, password: password! }
	});
	if (!res.ok()) {
		throw new Error(`Login failed (${res.status()}): ${await res.text()}`);
	}
	return (await res.json()) as TokenResponse;
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
