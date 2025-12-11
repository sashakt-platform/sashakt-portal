import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const token = getSessionTokenCookie();
	const search = url.searchParams.get('search') || '';
	const stateIds = url.searchParams.getAll('state_ids');

	const params = new URLSearchParams({
		name: search
	});

	for (const id of stateIds) {
		params.append('state_ids', id);
	}

	try {
		const response = await fetch(`${BACKEND_URL}/location/district/?${params.toString()}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			return json(data);
		}

		console.error('Failed to fetch districts:', response.status, response.statusText);
		return json({ items: [] });
	} catch (error) {
		console.error('Failed to fetch districts:', error);
		return json({ items: [] });
	}
};
