import { redirect, type Cookies } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import { BACKEND_URL } from '$env/static/private';

export const sessionCookieName = 'sashakt-session';

export async function validateSessionToken(token: string) {
	const res = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
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
}

export function setSessionTokenCookie(cookies: Cookies, token: string, expiresAt: Date) {
	cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: false // change to true in production
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
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
