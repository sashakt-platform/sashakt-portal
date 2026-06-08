import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const token = getSessionTokenCookie();

	const res = await fetch(`${BACKEND_URL}/questions/bulk-upload/template`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!res.ok) {
		return new Response('Failed to fetch template', { status: 500 });
	}

	const headers = new Headers();
	const contentType = res.headers.get('Content-Type');
	const contentDisposition = res.headers.get('Content-Disposition');

	if (contentType) headers.set('Content-Type', contentType);
	headers.set(
		'Content-Disposition',
		contentDisposition ?? 'attachment; filename="template.csv"'
	);

	return new Response(res.body, { headers });
};
