import { getRequestEvent } from '$app/server';

export function load() {
	const { locals } = getRequestEvent();

	return {
		user: locals.user
	};
}
