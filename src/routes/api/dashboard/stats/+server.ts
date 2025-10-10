import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const token = getSessionTokenCookie();

	try {
		const response = await fetch(`${BACKEND_URL}/organization/aggregated_data`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			const { total_questions = 0, total_users = 0, total_tests = 0 } = data ?? {};
			return json({ total_questions, total_users, total_tests });
		}

		return json({ total_questions: 0, total_users: 0, total_tests: 0 });
	} catch (error) {
		console.error('Failed to fetch dashboard stats:', error);
		return json({ total_questions: 0, total_users: 0, total_tests: 0 });
	}
};
