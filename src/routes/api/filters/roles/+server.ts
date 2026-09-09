import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	requireLogin();
	const token = getSessionTokenCookie();

	const organizationId = url.searchParams.get('organization_id');

	const params = new URLSearchParams({ limit: '200' });
	if (organizationId) {
		params.set('organization_id', organizationId);
	}

	try {
		const response = await fetch(`${BACKEND_URL}/roles/?${params.toString()}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			return json(data);
		}

		console.error('Failed to fetch roles:', response.status, response.statusText);
		return json({ data: [] });
	} catch (error) {
		console.error('Failed to fetch roles:', error);
		return json({ data: [] });
	}
};
