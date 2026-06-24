import type { PageServerLoad } from './$types.js';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

export const load: PageServerLoad = async ({ params }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_TEST);

	const token = getSessionTokenCookie();

	const [testRes, reportRes] = await Promise.all([
		fetch(`${BACKEND_URL}/test/${params.id}`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${token}` }
		}),
		fetch(`${BACKEND_URL}/test/${params.id}/candidate-report`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${token}` }
		})
	]);

	const test = testRes.ok ? await testRes.json() : null;
	const responses = reportRes.ok ? await reportRes.json() : [];
	return {
		testId: params.id,
		testName: test?.name || 'Test',
		responses
	};
};
