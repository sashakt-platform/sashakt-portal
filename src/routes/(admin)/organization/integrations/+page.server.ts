import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { setFlash } from 'sveltekit-flash-message/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_PROVIDER);
	const token = getSessionTokenCookie();
	const orgId = user.organization_id;

	const res = await fetch(`${BACKEND_URL}/providers/organizations/${orgId}/providers`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!res.ok) {
		const errorMessage = await res.json();

		setFlash(
			{
				type: 'error',
				message: `Failed to fetch providers: ${errorMessage.detail || res.statusText}`
			},
			cookies
		);

		return { providers: [] };
	}

	const providers = await res.json();



	return { providers };
};
