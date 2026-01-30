import { redirect } from '@sveltejs/kit';
import { deleteAllTokenCookies, logoutFromBackend } from '$lib/server/auth';

export const load = async ({ cookies, locals }) => {
	// If user is logged in, call backend logout endpoint

	const currentOrganization = cookies.get('organization');
	if (locals.session) {
		await logoutFromBackend(locals.session);
	}

	// Clear cookies regardless of backend response
	deleteAllTokenCookies(cookies);

	const next = currentOrganization ? `/${encodeURIComponent(currentOrganization)}` : '/login';

	throw redirect(303, next);
};
