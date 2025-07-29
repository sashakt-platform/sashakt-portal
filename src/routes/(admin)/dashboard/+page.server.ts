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

	return { stats };
};
