import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const org = params.organization;

	// encode to be safe
	throw redirect(307, `/login?organization=${encodeURIComponent(org)}`);
};
