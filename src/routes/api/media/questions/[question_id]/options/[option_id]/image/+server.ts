import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	const token = getSessionTokenCookie();
	try {
		const formData = await request.formData();
		const res = await fetch(
			`${BACKEND_URL}/media/questions/${params.question_id}/options/${params.option_id}/image`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData
			}
		);

		const data = await res.json();
		return json(data, { status: res.status });
	} catch (_error) {
		return json({ message: 'Failed to upload option image' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const token = getSessionTokenCookie();
	try {
		const res = await fetch(
			`${BACKEND_URL}/media/questions/${params.question_id}/options/${params.option_id}/image`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

		const data = await res.json();
		return json(data, { status: res.status });
	} catch (_error) {
		return json({ message: 'Failed to delete option image' }, { status: 500 });
	}
};
