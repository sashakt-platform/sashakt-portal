import { requireLogin } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export function load() {
	const user = requireLogin();

	if (user) {
		redirect(307, '/tests/test-session');
	} else {
		redirect(307, '/login');
	}
}
