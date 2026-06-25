import type { Actions, PageServerLoad } from './$types.js';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { fail } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';

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

export const actions: Actions = {
	deleteCandidate: async ({ url, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_CANDIDATE);
		const token = getSessionTokenCookie();

		const candidateId = url.searchParams.get('candidate_id');
		if (!candidateId) {
			setFlash({ type: 'error', message: 'Candidate ID is required.' }, cookies);
			return fail(400);
		}

		const response = await fetch(`${BACKEND_URL}/candidate/${candidateId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			setFlash(
				{
					type: 'error',
					message: errorData?.detail || 'Failed to delete candidate.'
				},
				cookies
			);
			return fail(response.status);
		}

		setFlash({ type: 'success', message: 'Candidate deleted successfully.' }, cookies);
	}
};
