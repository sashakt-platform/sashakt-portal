import { getRequestEvent } from '$app/server';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from '../$types';
// export function load() {
// 	const { locals } = getRequestEvent();

// 	return {
// 		user: locals.user
// 	};
// }




export const load: PageServerLoad = async () => {

	const { locals } = getRequestEvent();
	const token = getSessionTokenCookie();
	const responseState = await fetch(`${BACKEND_URL}/api/v1/location/state/?skip=0&limit=100`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!responseState.ok) {
		console.error('Failed to fetch states:', responseState.status, responseState.statusText);
		return { states: null };
	}

	const states = await responseState.json();	


	const responseTags = await fetch(`${BACKEND_URL}/api/v1/tag/?skip=0&limit=100`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!responseTags.ok) {
		console.error('Failed to fetch states:', responseTags.status, responseTags.statusText);
		return { states: null };
	}

	const tags = await responseTags.json();

	return {
		// tests: tests,
		user: locals.user,
		states: states,
		tags: tags
	};
};
