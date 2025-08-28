import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = getSessionTokenCookie();
	const tagIdsList = url.searchParams.getAll('tag_ids') || [];
	const tagParams =
		tagIdsList.length > 0 ? tagIdsList.map((tagId) => `tag_ids=${tagId}`).join('&') : '';
	const statesList = url.searchParams.getAll('state_ids') || [];
	const stateParams =
		statesList.length > 0 ? statesList.map((state) => `state_ids=${state}`).join('&') : '';

	const queryString = [tagParams, stateParams].filter(Boolean).join('&');


	interface DashboardPerformance {
		overall_score_percent: number;
		overall_avg_time_minutes: number;
	}
	const performance: DashboardPerformance = {
		overall_score_percent: 0,
		overall_avg_time_minutes: 0
	};
	interface DashboardStats {
		total_questions: number;
		total_users: number;
		total_tests: number;
	}

	const stats: DashboardStats = {
		total_questions: 0,
		total_users: 0,
		total_tests: 0
	};

	const responseStats = await fetch(`${BACKEND_URL}/organization/aggregated_data`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (responseStats.ok) {
		const statsData = await responseStats.json();
		stats.total_questions = statsData.total_questions;
		stats.total_users = statsData.total_users;
		stats.total_tests = statsData.total_tests;
	}
	const responsePerformance = await fetch(`${BACKEND_URL}/candidate/overall-analytics?${queryString}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (responsePerformance.ok) {
		const performanceData = await responsePerformance.json();

		performance.overall_score_percent = performanceData.overall_score_percent;
		performance.overall_avg_time_minutes = performanceData.overall_avg_time_minutes;
	}

	return { stats, performance };
};
