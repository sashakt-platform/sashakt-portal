import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';

export const load = async () => {
	const token = getSessionTokenCookie();
	const res = await fetch(`${BACKEND_URL}/users`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!res.ok) {
		return { users: null };
	}

	const users = await res.json();

	return {
		users
	};
};
