import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import { getRequestEvent } from '$app/server';

export const load = async () => {
	const { locals } = getRequestEvent();
	const token = getSessionTokenCookie();
	const res = await fetch(`${BACKEND_URL}/questions?organization_id=${locals.user.organization_id}`, {
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
