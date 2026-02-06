import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const token = getSessionTokenCookie();
	const search = url.searchParams.get('search') || '';
	const districtIds = url.searchParams.getAll('district_ids');

	const params = new URLSearchParams({
		name: search
	});

	for (const id of districtIds) {
		params.append('district_ids', id);
	}

	try {
		const response = await fetch(`${BACKEND_URL}/location/block/?${params.toString()}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			return json(data);
		}

		console.error('Failed to fetch blocks:', response.status, response.statusText);
		return json({ items: [] });
	} catch (error) {
		console.error('Failed to fetch blocks:', error);
		return json({ items: [] });
	}
};
