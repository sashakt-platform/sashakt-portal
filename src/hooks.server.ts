import { redirect, type Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth.js';
import { sequence } from '@sveltejs/kit/hooks';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName) ?? null;

	if (!sessionToken) {
		event.locals.user = null;
		return resolve(event);
	}

	const { user } = await auth.validateSessionToken(sessionToken);

	if (!user) {
		auth.deleteSessionTokenCookie(event);
		throw redirect(302, '/login');
	}

	event.locals.user = user;
	return resolve(event);
};

export const admin: Handle = async function ({ event, resolve }) {
	if (event.route.id?.startsWith('/(admin)') && !event.locals?.user) {
		throw redirect(302, '/login');
	}
	return resolve(event);
};

export const handle: Handle = sequence(handleAuth, admin);
