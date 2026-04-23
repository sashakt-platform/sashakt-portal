import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const token = getSessionTokenCookie();
	const testId = url.searchParams.get('test_id');

	if (!testId) {
		return json({ error: 'test_id is required' }, { status: 400 });
	}

	try {
		const response = await fetch(
			`${BACKEND_URL}/candidate/summary?test_id=${encodeURIComponent(testId)}`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

		if (response.ok) {
			const data = await response.json();
			return json(data);
		}

		console.error('Failed to fetch test report:', response.status, response.statusText);
		return json({ error: 'Failed to fetch test report' }, { status: response.status });
	} catch (error) {
		console.error('Failed to fetch test report:', error);
		return json({ error: 'Failed to fetch test report' }, { status: 500 });
	}
};
