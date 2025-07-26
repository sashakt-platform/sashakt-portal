import { redirect } from '@sveltejs/kit';
import { deleteAllTokenCookies, logoutFromBackend } from '$lib/server/auth';

export const load = async ({ cookies, locals }) => {
	// If user is logged in, call backend logout endpoint
	if (locals.session) {
		await logoutFromBackend(locals.session);
	}

	// Clear cookies regardless of backend response
	deleteAllTokenCookies(cookies);
	throw redirect(303, '/login');
};
