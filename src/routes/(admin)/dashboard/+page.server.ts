import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const token = getSessionTokenCookie();

	let users = [];
	let questions = [];
	let tests = [];

	const responseQuestions = await fetch(`${BACKEND_URL}/questions/?skip=0&limit=100`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (responseQuestions.ok) {
		questions = await responseQuestions.json();
	}

	const responseTest = await fetch(`${BACKEND_URL}/test/?is_template=0`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (responseTest.ok) {
		tests = await responseTest.json();
	}

	const responseUsers = await fetch(`${BACKEND_URL}/users/`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (responseUsers.ok) {
		users = await responseUsers.json();
	}

	return { users, questions, tests };
};
