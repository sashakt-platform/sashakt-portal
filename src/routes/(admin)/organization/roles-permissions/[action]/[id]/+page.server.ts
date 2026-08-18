import type { PageServerLoad } from './$types.js';
import { requireLogin } from '$lib/server/auth.js';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

export const load: PageServerLoad = async ({ params }) => {
	const user = requireLogin();

	if (params.action === 'add') {
		requirePermission(user, PERMISSIONS.CREATE_ROLE);
	} else if (params.action === 'edit') {
		requirePermission(user, PERMISSIONS.UPDATE_ROLE);
	}

	return {
		action: params.action,
		id: params.id
	};
};
