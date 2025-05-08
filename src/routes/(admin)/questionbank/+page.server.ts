import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';

export const load = async () => {
	const token = getSessionTokenCookie();
	const res = await fetch(`${BACKEND_URL}/api/v1/question`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!res.ok) {
		return { questions: null };
	}

	const questions = await res.json();

	return {
		questions: questions
	};
};
