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
	const entityTypeId = url.searchParams.get('entity_type_id') || '';

	const params = new URLSearchParams({
		size: '100',
		...(search && { name: search }),
		...(entityTypeId && { entity_type_id: entityTypeId })
	});

	try {
		const response = await fetch(`${BACKEND_URL}/entity/?${params.toString()}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();

			return json(data);
		}

		console.error('Failed to fetch entities:', response.status, response.statusText);
		return json({ error: 'Failed to fetch entities' }, { status: response.status });
	} catch (error) {
		console.error('Failed to fetch entities:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
