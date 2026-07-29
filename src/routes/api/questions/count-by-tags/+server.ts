import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const tagIds = url.searchParams.getAll('tag_ids');
	if (tagIds.length === 0) {
		return json([]);
	}

	const token = getSessionTokenCookie();
	const tagIdParams = tagIds.map((id) => `tag_ids=${encodeURIComponent(id)}`).join('&');

	try {
		const response = await fetch(`${BACKEND_URL}/questions/count-by-tags?${tagIdParams}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			return json(await response.json());
		}

		console.error(
			'Failed to fetch question counts by tags:',
			response.status,
			response.statusText
		);
		return json([]);
	} catch (error) {
		console.error('Failed to fetch question counts by tags:', error);
		return json([]);
	}
};
