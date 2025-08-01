import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const token = getSessionTokenCookie();

	let tags = [];
	let tagTypes = [];

	const response = await fetch(`${BACKEND_URL}/tag`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
		const errorMessage = await response.json();
		setFlash({ type: 'error', message: errorMessage.detail || 'Failed to fetch Tags.' }, cookies);
	} else {
		tags = await response.json();
	}

	const responseTagTypes = await fetch(`${BACKEND_URL}/tagtype`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});
	if (!responseTagTypes.ok) {
		const errorMessage = await responseTagTypes.json();
		setFlash(
			{ type: 'error', message: errorMessage.detail || 'Failed to fetch Tag Types.' },
			cookies
		);
	} else {
		tagTypes = await responseTagTypes.json();
	}

	return {
		tags,
		tagTypes
	};
};
