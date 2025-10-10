import { json } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const token = getSessionTokenCookie();

	const statesList = url.searchParams.getAll('state_ids') || [];
	const stateParams =
		statesList.length > 0 ? statesList.map((state) => `state_ids=${state}`).join('&') : '';

	const tagtypeIdsList = url.searchParams.getAll('tag_type_ids') || [];
	const tagtypeParams =
		tagtypeIdsList.length > 0
			? tagtypeIdsList.map((tagtypeId) => `tag_type_ids=${tagtypeId}`).join('&')
			: '';

	const districtIdsList = url.searchParams.getAll('district_ids') || [];
	const districtParams =
		districtIdsList.length > 0
			? districtIdsList.map((districtId) => `district_ids=${districtId}`).join('&')
			: '';

	const queryString = [stateParams, tagtypeParams, districtParams].filter(Boolean).join('&');

	try {
		const response = await fetch(`${BACKEND_URL}/candidate/overall-analytics?${queryString}`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			const { overall_score_percent = 0, overall_avg_time_minutes = 0 } = data ?? {};

			return json({
				overall_score_percent,
				overall_avg_time_minutes
			});
		}

		return json({
			overall_score_percent: 0,
			overall_avg_time_minutes: 0
		});
	} catch (error) {
		console.error('Failed to fetch analytics stats:', error);
		return json({
			overall_score_percent: 0,
			overall_avg_time_minutes: 0
		});
	}
};
