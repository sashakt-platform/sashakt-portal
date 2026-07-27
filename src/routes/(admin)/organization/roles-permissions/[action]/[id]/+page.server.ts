import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.UPDATE_ROLE);
	const token = getSessionTokenCookie();

	const res = await fetch(`${BACKEND_URL}/roles/`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!res.ok) {
		const errorMessage = await res.json();
		error(res.status, errorMessage.detail || 'Failed to load role');
	}

	const { data: roles } = await res.json();
	const role = roles.find((r: { id: number }) => String(r.id) === params.id);

	if (!role) {
		error(404, 'Role not found');
	}

	return { role };
};
