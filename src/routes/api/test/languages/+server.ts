import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';
import { DEFAULT_LANGUAGE } from '$lib/constants';

export const GET: RequestHandler = async () => {
	const token = getSessionTokenCookie();

	try {
		const response = await fetch(`${BACKEND_URL}/test/localization`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			return json(data);
		}

		return json([DEFAULT_LANGUAGE]);
	} catch (error) {
		console.error('Failed to fetch supported language list', error);
		return json([DEFAULT_LANGUAGE]);
	}
};
