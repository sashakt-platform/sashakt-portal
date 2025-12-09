import { getRequestEvent } from '$app/server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const { locals } = getRequestEvent();

	return {
		user: locals.user
	};
};
