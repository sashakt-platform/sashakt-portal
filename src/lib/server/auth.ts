import { redirect, type Cookies } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import { BACKEND_URL } from '$env/static/private';
import { dev } from '$app/environment';

export const sessionCookieName = 'sashakt-session';
export const refreshCookieName = 'sashakt-refresh';

export async function refreshAccessToken(refreshToken: string) {
	try {
		const res = await fetch(`${BACKEND_URL}/login/refresh-token/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				refresh_token: refreshToken
			})
		});

		if (!res.ok) {
			return { success: false, tokens: null };
		}

		const tokens = await res.json();
		return { success: true, tokens };
	} catch (error) {
		console.error('Token refresh failed:', error);
		return { success: false, tokens: null };
	}
}

export async function validateSessionToken(token: string) {
	try {
		const res = await fetch(`${BACKEND_URL}/users/me`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) {
			return { user: null };
		}

		const user = await res.json();

		return { user };
	} catch (error) {
		console.error('Session validation failed:', error);
		return { user: null };
	}
}

export function setSessionTokenCookie(cookies: Cookies, token: string, expiresAt: Date) {
	cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev
	});
}

export function setRefreshTokenCookie(cookies: Cookies, token: string) {
	cookies.set(refreshCookieName, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev
	});
}

export function deleteSessionTokenCookie(cookies: Cookies) {
	cookies.delete(sessionCookieName, {
		path: '/'
	});
}

export function deleteRefreshTokenCookie(cookies: Cookies) {
	cookies.delete(refreshCookieName, {
		path: '/'
	});
}

export function deleteAllTokenCookies(cookies: Cookies) {
	deleteSessionTokenCookie(cookies);
	deleteRefreshTokenCookie(cookies);
}

export async function logoutFromBackend(accessToken: string) {
	try {
		const res = await fetch(`${BACKEND_URL}/login/logout/`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		return { success: res.ok };
	} catch (error) {
		console.error('Backend logout failed:', error);
		return { success: false };
	}
}

export function getSessionTokenCookie() {
	const { locals } = getRequestEvent();
	return locals.session;
}

export function getRefreshTokenCookie() {
	const { cookies } = getRequestEvent();
	return cookies.get(refreshCookieName) ?? null;
}

export function requireLogin() {
	const { locals, url } = getRequestEvent();

	// `locals.user` is populated in `handle`
	if (!locals.user) {
		const redirectTo = url.pathname + url.search;
		const params = new URLSearchParams({ redirectTo });

		redirect(307, `/login?${params}`);
	}

	return locals.user;
}
