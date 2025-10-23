import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const token = getSessionTokenCookie();

	try {
		const response = await fetch(`${BACKEND_URL}/candidate/summary`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			const {
				total_test_submitted = 0,
				total_test_not_submitted = 0,
				not_submitted_active = 0,
				not_submitted_inactive = 0
			} = data ?? {};

			return json({
				total_test_submitted,
				total_test_not_submitted,
				not_submitted_active,
				not_submitted_inactive
			});
		}

		return json({
			total_test_submitted: 0,
			total_test_not_submitted: 0,
			not_submitted_active: 0,
			not_submitted_inactive: 0
		});
	} catch (error) {
		console.error('Failed to fetch test attempt stats:', error);
		return json({
			total_test_submitted: 0,
			total_test_not_submitted: 0,
			not_submitted_active: 0,
			not_submitted_inactive: 0
		});
	}
};
