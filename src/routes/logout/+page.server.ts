import { redirect } from '@sveltejs/kit';
import { deleteSessionTokenCookie } from '$lib/server/auth';

export const load = async ({ cookies }) => {
	deleteSessionTokenCookie({ cookies });
	throw redirect(303, '/login');
};
