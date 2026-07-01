import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';
import { setFlash } from 'sveltekit-flash-message/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	requireLogin();
	const token = getSessionTokenCookie();

	const page = Number(url.searchParams.get('page')) || 1;
	const size = Number(url.searchParams.get('size')) || DEFAULT_PAGE_SIZE;

	const providersQueryParams = new URLSearchParams({
		page: page.toString(),
		size: size.toString()
	});

	const res = await fetch(`${BACKEND_URL}/providers/?${providersQueryParams}`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!res.ok) {
		const errorMessage = await res.json();

		setFlash(
			{
				type: 'error',
				message: `Failed to fetch providers: ${errorMessage.detail || res.statusText}`
			},
			cookies
		);

		return {
			providers: { items: [], total: 0, pages: 0 },
			totalPages: 0,
			params: { page, size }
		};
	}

	const providers = await res.json();

	return {
		providers,
		totalPages: providers.pages || 0,
		params: { page, size }
	};
};
