import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const token = getSessionTokenCookie();
	const formId = url.searchParams.get('form_id');

	try {
		const queryParams = formId ? `?form_id=${formId}` : '';
		const response = await fetch(`${BACKEND_URL}/certificate/tokens${queryParams}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			return json(data);
		}

		return json({ error: 'Failed to fetch certificate tokens' }, { status: response.status });
	} catch (error) {
		console.error('Failed to fetch certificate tokens', error);
		return json({ error: 'Failed to fetch certificate tokens' }, { status: 500 });
	}
};
