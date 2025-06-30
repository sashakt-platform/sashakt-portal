import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const token = getSessionTokenCookie();

	const responseActive = await fetch(`${BACKEND_URL}/questions`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!responseActive.ok) {
		console.error('Failed to fetch questions:', responseActive.status, responseActive.statusText);
		return { questions: null };
	}

	const questionsActive = await responseActive.json();

	const responseInactive = await fetch(`${BACKEND_URL}/questions?is_active=false`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!responseInactive.ok) {
		console.error('Failed to fetch questions:', responseInactive.status, responseInactive.statusText);
		return { questions: null };
	}

	const questionsInactive = await responseInactive.json();

	return {
		questions: questionsActive.concat(questionsInactive)
	};
};
