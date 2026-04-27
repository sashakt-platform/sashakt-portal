import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ fetch, locals }) => {
	const token = getSessionTokenCookie();
	const orgId = locals.user?.organization_id;
	if (!orgId) {
		return json({ message: 'Organization not found' }, { status: 400 });
	}

	try {
		const res = await fetch(`${BACKEND_URL}/organization/${orgId}/platform_guide`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (res.ok) {
			return json({ message: 'Platform guide removed' }, { status: 200 });
		}
		return json({ message: 'Failed to remove platform guide' }, { status: res.status });
	} catch (_error) {
		return json({ message: 'Failed to remove platform guide' }, { status: 500 });
	}
};
