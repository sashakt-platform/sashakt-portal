import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const token = getSessionTokenCookie();
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
		Object.assign(stats, statsData);
	}

	const responseTestStats = await fetch(`${BACKEND_URL}/candidate/summary`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (responseTestStats.ok) {
		const testStatsData = await responseTestStats.json();
		Object.assign(testAttemptStats, testStatsData);
	}

	return { stats, testAttemptStats };
};
