import * as Sentry from '@sentry/sveltekit';
import { redirect, type Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth.js';
import { sequence } from '@sveltejs/kit/hooks';
import { BACKEND_URL } from '$env/static/private';

// simple in-memory cache for organization lookups (per-node)
const orgCache = new Map<string, { data: any; expiresAt: number }>();
const ORG_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const handleOrganization: Handle = async ({ event, resolve }) => {
	const shortcode = event.cookies.get(auth.organizationCookieName);

	if (!shortcode) {
		event.locals.organization = null;
		return resolve(event);
	}

	// check cache
	const key = String(shortcode);
	const now = Date.now();
	const cached = orgCache.get(key);
	if (cached && cached.expiresAt > now) {
		event.locals.organization = cached.data;
		return resolve(event);
	}

	// if no BACKEND_URL, skip fetch
	if (!BACKEND_URL) {
		event.locals.organization = null;
		return resolve(event);
	}

	try {
		// use event.fetch so SvelteKit fetch hooks / platform fetch are used
		const res = await event.fetch(`${BACKEND_URL}/organization/public/${encodeURIComponent(key)}`);

		if (res.ok) {
			const json = await res.json();
			event.locals.organization = json;
			// cache the successful result
			orgCache.set(key, { data: json, expiresAt: now + ORG_CACHE_TTL });
		} else {
			event.locals.organization = null;
			// remove any stale cache on non-ok
			orgCache.delete(key);
		}
	} catch (err) {
		// on error, avoid leaving stale cached data; set null for this request
		orgCache.delete(key);
		event.locals.organization = null;
	}

	return resolve(event);
};

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName) ?? null;
	const refreshToken = event.cookies.get(auth.refreshCookieName) ?? null;

	// If no tokens at all, continue as guest user
	if (!sessionToken && !refreshToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	let user = null;

	// If we have a session token, try to validate it
	if (sessionToken) {
		const result = await auth.validateSessionToken(sessionToken);
		user = result.user;
	}

	// If no user (either no session token or invalid session token) and we have a refresh token, try to refresh
	if (!user && refreshToken) {
		const refreshResult = await auth.refreshAccessToken(refreshToken);

		if (refreshResult.success && refreshResult.tokens) {
			const { access_token, refresh_token: newRefreshToken, expires_in } = refreshResult.tokens;

			// Set new tokens
			const accessExpiryMs = expires_in ? expires_in * 1000 : 60 * 60 * 24 * 1000;

			auth.setSessionTokenCookie(
				event.cookies,
				access_token,
				new Date(Date.now() + accessExpiryMs)
			);
			if (newRefreshToken) {
				auth.setRefreshTokenCookie(event.cookies, newRefreshToken);
			}

			// Validate the new access token
			const { user: refreshedUser } = await auth.validateSessionToken(access_token);
			if (refreshedUser) {
				event.locals.user = refreshedUser;
				event.locals.session = access_token;
				return resolve(event);
			}
		}

		// Refresh failed, clear all tokens and logout
		auth.deleteAllTokenCookies(event.cookies);
		throw redirect(302, '/login');
	}

	// If no user and no refresh token, logout
	if (!user) {
		auth.deleteAllTokenCookies(event.cookies);
		throw redirect(302, '/login');
	}

	event.locals.user = user;
	event.locals.session = sessionToken;
	return resolve(event);
};

export const admin: Handle = async function ({ event, resolve }) {
	if (event.route.id?.startsWith('/(admin)') && !event.locals?.user) {
		throw redirect(302, '/login');
	}
	return resolve(event);
};

export const handle: Handle = sequence(
	Sentry.sentryHandle(),
	sequence(handleOrganization, handleAuth, admin)
);
export const handleError = Sentry.handleErrorWithSentry();
