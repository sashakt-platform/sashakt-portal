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

	interface TestAttemptStatsType {
		total_test_submitted: number;
		total_test_not_submitted: number;
		not_submitted_active: number;
		not_submitted_inactive: number;
	}

	const testAttemptStats: TestAttemptStatsType = {
		total_test_submitted: 0,
		total_test_not_submitted: 0,
		not_submitted_active: 0,
		not_submitted_inactive: 0
	};

	const responseStats = await fetch(`${BACKEND_URL}/organization/aggregated_data`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (responseStats.ok) {
		const statsData = await responseStats.json();

		const { total_questions = 0, total_users = 0, total_tests = 0 } = statsData ?? {};
		Object.assign(stats, { total_questions, total_users, total_tests });
	}
	const responsePerformance = await fetch(
		`${BACKEND_URL}/candidate/overall-analytics?${queryString}`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	);

	if (responsePerformance.ok) {
		const performanceData = await responsePerformance.json();

		performance.overall_score_percent = performanceData.overall_score_percent;
		performance.overall_avg_time_minutes = performanceData.overall_avg_time_minutes;
	}

	const responseTestStats = await fetch(`${BACKEND_URL}/candidate/summary`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (responseTestStats.ok) {
		const testStatsData = await responseTestStats.json();
		const {
			total_test_submitted = 0,
			total_test_not_submitted = 0,
			not_submitted_active = 0,
			not_submitted_inactive = 0
		} = testStatsData ?? {};
		Object.assign(testAttemptStats, {
			total_test_submitted,
			total_test_not_submitted,
			not_submitted_active,
			not_submitted_inactive
		});
	}

	return { stats, testAttemptStats, performance };
};
