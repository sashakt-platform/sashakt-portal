import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const token = getSessionTokenCookie();
	const search = url.searchParams.get('search') || '';
	const tagTypeIds = url.searchParams.getAll('tag_type_ids');
	const tagTypeParams = tagTypeIds.map((id) => `&tag_type_ids=${id}`).join('');

	try {
		const response = await fetch(
			`${BACKEND_URL}/tag/?name=${encodeURIComponent(search)}${tagTypeParams}`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);

		if (response.ok) {
			const rawTags = await response.json();
			// Transform tags to include tag type in the name
			const tags = {
				...rawTags,
				items:
					rawTags.items?.map((tag: { name: string; tag_type?: { name: string } }) => ({
						...tag,
						name: tag.name
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
