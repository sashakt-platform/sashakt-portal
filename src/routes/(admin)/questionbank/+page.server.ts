import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const token = getSessionTokenCookie();
	const organizationId = locals.user?.organization_id;
	const url = organizationId != null
    ? `${BACKEND_URL}/questions?organization_id=${encodeURIComponent(organizationId)}`
    : `${BACKEND_URL}/questions`;
	const res = await fetch(url, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!res.ok) {
		console.error('Failed to fetch questions:', res.status, res.statusText);
		return { questions: null };
	}

	const questions = await res.json();

	return {
		questions: questions
	};
};
