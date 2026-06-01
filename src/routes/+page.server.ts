import { requireLogin } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import { isSuperAdmin } from '$lib/utils/permissions';

export function load() {
	const user = requireLogin();

	if (user) {
		redirect(307, isSuperAdmin(user) ? '/organization' : '/tests/test-session');
	} else {
		redirect(307, '/login');
	}
}
