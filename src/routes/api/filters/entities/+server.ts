import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const token = getSessionTokenCookie();
	if (!token) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

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
		return json({ items: [] });
	} catch (error) {
		console.error('Failed to fetch entities:', error);
		return json({ items: [] });
	}
};
