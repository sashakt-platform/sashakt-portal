import type { Actions, PageServerLoad } from './$types.js';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { fail } from '@sveltejs/kit';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';

export const load: PageServerLoad = async ({ params, url }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_TEST);

	const token = getSessionTokenCookie();

	const page = Number(url.searchParams.get('page')) || 1;
	const size = Number(url.searchParams.get('size')) || DEFAULT_PAGE_SIZE;

	const queryParams = new URLSearchParams({
		page: page.toString(),
		size: size.toString()
	});

	const [testRes, reportRes] = await Promise.all([
		fetch(`${BACKEND_URL}/test/${params.id}`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${token}` }
		}),
		fetch(`${BACKEND_URL}/test/${params.id}/candidate-report?${queryParams}`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${token}` }
		})
	]);

	const test = testRes.ok ? await testRes.json() : null;
	const responses = reportRes.ok ? await reportRes.json() : { items: [], total: 0, pages: 0 };
	return {
		testId: params.id,
		testName: test?.name || 'Test',
		responses,
		totalPages: responses.pages || 0,
		params: { page, size }
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

		throw redirect(303, url.pathname, { type: 'success', message: 'Candidate deleted successfully.' }, cookies);
	}
};
