import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, url }) => {
	const token = getSessionTokenCookie();
	const mediaUrl = url.searchParams.get('url');

	if (!mediaUrl) {
		return json({ message: 'URL parameter is required' }, { status: 400 });
	}

	try {
		const res = await fetch(
			`${BACKEND_URL}/media/questions/${params.question_id}/external?url=${encodeURIComponent(mediaUrl)}`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

		const data = await res.json();
		return json(data, { status: res.status });
	} catch (_error) {
		return json({ message: 'Failed to add external media' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	const token = getSessionTokenCookie();
	try {
		const res = await fetch(`${BACKEND_URL}/media/questions/${params.question_id}/external`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		const data = await res.json();
		return json(data, { status: res.status });
	} catch (_error) {
		return json({ message: 'Failed to delete external media' }, { status: 500 });
	}
};
