import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_TEST);
	const token = getSessionTokenCookie();

	const sortBy = url.searchParams.get('sortBy') || '';
	const sortOrder = url.searchParams.get('sortOrder') || 'asc';

	const queryParams = new URLSearchParams({
		...(sortBy && { sort_by: sortBy, sort_order: sortOrder })
	});

	const res = await fetch(
		`${BACKEND_URL}/test/${params.id}/candidate-report/export?${queryParams}`,
		{ headers: { Authorization: `Bearer ${token}` } }
	);

	if (!res.ok) {
		return new Response('Failed to export responses', { status: res.status });
	}

	const headers = new Headers();
	const contentType = res.headers.get('Content-Type');
	const contentDisposition = res.headers.get('Content-Disposition');

	if (contentType) headers.set('Content-Type', contentType);
	headers.set('Content-Disposition', contentDisposition ?? 'attachment; filename="responses.csv"');

	return new Response(res.body, { headers });
};
