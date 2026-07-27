import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { setFlash } from 'sveltekit-flash-message/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_ROLE);
	const token = getSessionTokenCookie();

	const res = await fetch(`${BACKEND_URL}/roles/`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!res.ok) {
		const errorMessage = await res.json();

		setFlash(
			{
				type: 'error',
				message: `Failed to fetch roles: ${errorMessage.detail || res.statusText}`
			},
			cookies
		);

		return { roles: [] };
	}

	const { data: roles } = await res.json();

	return { roles };
};
