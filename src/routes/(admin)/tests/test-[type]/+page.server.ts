import type { PageServerLoad } from './$types.js';
import { BACKEND_URL, TEST_TAKER_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import {setFlash } from 'sveltekit-flash-message/server';


export const load: PageServerLoad = async ({ params, url,cookies }) => {

	const is_template = params.type === 'template';

	let testName = url.searchParams.get('name') || '';
	let tests = [];
	const token = getSessionTokenCookie();
	const res = await fetch(`${BACKEND_URL}/test/?is_template=${is_template}&name=${testName}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!res.ok) {
		setFlash({ type: 'error', message: `Failed to fetch Test ${is_template?'template':'sessions'}. Details: ${res.statusText}` },cookies);
	} else {
		tests = await res.json();
	}

	let questions = [];
	const responseQuestions = await fetch(
		`${BACKEND_URL}/questions/?skip=0&limit=100`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	);

		if (!responseQuestions.ok) {
			setFlash({ type: 'error', message: `Failed to fetch Questions. Details: ${responseQuestions.statusText}` },cookies);

	} else {
		questions = await responseQuestions.json();
	}


	return {
		tests,
		questions,
		is_template: is_template,
		test_taker_url: TEST_TAKER_URL
	};
};
