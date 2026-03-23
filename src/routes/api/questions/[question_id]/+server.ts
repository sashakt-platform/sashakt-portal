import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const token = getSessionTokenCookie();
	try {
		const res = await fetch(`${BACKEND_URL}/questions/${params.question_id}/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		const data = await res.json();
		return json(data, { status: res.status });
	} catch (_error) {
		return json({ message: 'Failed to fetch question' }, { status: 500 });
	}
};
