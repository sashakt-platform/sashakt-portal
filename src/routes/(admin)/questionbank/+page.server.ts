import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from './$types';
import {setFlash } from 'sveltekit-flash-message/server';

export const load: PageServerLoad = async ({cookies}) => {
	const token = getSessionTokenCookie();

	const response = await fetch(`${BACKEND_URL}/questions`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
		console.error('Failed to fetch questions:', response.status, response.statusText);
		setFlash({ type: 'error', message: "Failed to fetch questions. Please try again later." },cookies);
		return { questions: null };
	}

	const questions = await response.json();




	return {
		questions
	};
};
