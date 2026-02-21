import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_FORM);
	const token = getSessionTokenCookie();
	const search = url.searchParams.get('search') || '';

	try {
		const queryParams = new URLSearchParams({
			size: '100',
			...(search && { name: search })
		});

		const response = await fetch(`${BACKEND_URL}/entitytype/?${queryParams}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			return json(data);
		}

		console.error('Failed to fetch entity types:', response.status, response.statusText);
		return json({ items: [] });
	} catch (error) {
		console.error('Failed to fetch entity types:', error);
		return json({ items: [] });
	}
};
