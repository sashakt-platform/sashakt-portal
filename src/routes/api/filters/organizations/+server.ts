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

	const queryParams = new URLSearchParams({
		size: '100',
		order_by: 'name',
		...(search.length >= 3 && { name: search })
	});

	try {
		const response = await fetch(`${BACKEND_URL}/organization/?${queryParams}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			return json(data);
		}

		console.error('Failed to fetch organizations:', response.status, response.statusText);
		return json({ items: [] });
	} catch (error) {
		console.error('Failed to fetch organizations:', error);
		return json({ items: [] });
	}
};
