import { getRequestEvent } from '$app/server';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ url }) => {
	const { locals } = getRequestEvent();
	const token = getSessionTokenCookie();

	let states = [];
	let tags = [];

	const statesearch = url.searchParams.get('state_search') || '';

	const responseState = await fetch(`${BACKEND_URL}/location/state/?name=${statesearch}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!responseState.ok) {
		console.error('Failed to fetch states:', responseState.status, responseState.statusText);
	} else {
		states = await responseState.json();
	}

	const responseTags = await fetch(`${BACKEND_URL}/tag/?skip=0&limit=100`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!responseTags.ok) {
		console.error('Failed to fetch tags:', responseTags.status, responseTags.statusText);
	} else {
		tags = await responseTags.json();
	}

	return {
		user: locals.user,
		states: states,
		tags: tags
	};
};
