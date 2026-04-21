import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, organizationCookieName } from '$lib/server/auth';
import { invalidateOrganizationCache } from '$lib/server/organization-cache';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ fetch, cookies }) => {
	const token = getSessionTokenCookie();
	try {
		const res = await fetch(`${BACKEND_URL}/organization/current/logo`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (res.ok) {
			const shortcode = cookies.get(organizationCookieName);
			if (shortcode) {
				invalidateOrganizationCache(shortcode);
			}
			return json({ message: 'Logo deleted successfully' }, { status: 200 });
		}
		return json({ message: 'Failed to delete logo' }, { status: res.status });
	} catch (_error) {
		return json({ message: 'Failed to delete logo' }, { status: 500 });
	}
};
