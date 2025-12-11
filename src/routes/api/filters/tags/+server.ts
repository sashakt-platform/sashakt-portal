import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const token = getSessionTokenCookie();
	const search = url.searchParams.get('search') || '';

	try {
		const response = await fetch(`${BACKEND_URL}/tag/?name=${encodeURIComponent(search)}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const rawTags = await response.json();
			// Transform tags to include tag type in the name
			const tags = {
				...rawTags,
				items:
					rawTags.items?.map((tag: { name: string; tag_type?: { name: string } }) => ({
						...tag,
						name: tag.tag_type?.name ? `${tag.name} - (${tag.tag_type.name})` : tag.name
					})) || []
			};
			return json(tags);
		}

		console.error('Failed to fetch tags:', response.status, response.statusText);
		return json({ items: [] });
	} catch (error) {
		console.error('Failed to fetch tags:', error);
		return json({ items: [] });
	}
};
