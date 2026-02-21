import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_FORM);
	const token = getSessionTokenCookie();

	try {
		const response = await fetch(`${BACKEND_URL}/form/?is_active=true&size=100`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			return json(data);
		}

		return json({ error: 'Failed to fetch forms' }, { status: response.status });
	} catch (error) {
		console.error('Failed to fetch forms', error);
		return json({ error: 'Failed to fetch forms' }, { status: 500 });
	}
};
