import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const token = getSessionTokenCookie();

	try {
		const response = await fetch(`${BACKEND_URL}/languages/`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			return json(data);
		}

		return json({ error: 'Failed to fetch languages' }, { status: response.status });
	} catch (error) {
		console.error('Failed to fetch supported language list', error);
		return json({ error: 'Failed to fetch languages' }, { status: 500 });
	}
};
