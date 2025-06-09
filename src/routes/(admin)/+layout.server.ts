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
	const responseState = await fetch(`${BACKEND_URL}/location/state/?skip=0&limit=100`, {
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

	const responseTags = await fetch(`${BACKEND_URL}/tag/?skip=0&limit=100`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!responseTags.ok) {
		console.error('Failed to fetch tags:', responseTags.status, responseTags.statusText);
		return { states: null };
	}

	const tags = await responseTags.json();

	const responseQuestions = await fetch(
		`${BACKEND_URL}/questions/?skip=0&limit=100&organization_id=${locals.user.organization_id}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	);

	if (!responseQuestions.ok) {
		return { states: null };
	}

	const questions = await responseQuestions.json();


	const responseUsers = await fetch(
		`${BACKEND_URL}/users/`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	);

	if (!responseUsers.ok) {
		return { states: null };
	}

	const users = await responseUsers.json();


	const responseTest = await fetch(
		`${BACKEND_URL}/test/?is_template=0`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	);

	if (!responseTest.ok) {
		return { states: null };
	}

	const tests = await responseTest.json();

	return {
		tests: tests,
		user: locals.user,
		states: states,
		tags: tags,
		questions: questions,
		users: users
	};
};
