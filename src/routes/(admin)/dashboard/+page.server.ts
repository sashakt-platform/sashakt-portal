import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import { fail, superValidate } from 'sveltekit-superforms';
import type { PageServerLoad, Actions } from './$types';
import { basedateSchema } from './schema';
import { zod } from 'sveltekit-superforms/adapters';
import { redirect } from 'sveltekit-flash-message/server';




export const load: PageServerLoad = async ({ url }) => {

	const token = getSessionTokenCookie();
	const startDate = url.searchParams.get('start_date');
	const endDate = url.searchParams.get('end_date');

	const params = new URLSearchParams();
	if (startDate) params.append('start_date', startDate);
	if (endDate) params.append('end_date', endDate);

	interface DashboardStats {
		total_questions: number;
		total_users: number;
		total_tests: number;
	}
	interface TestSummary {
		total_test_submitted: number;
		total_test_not_submitted: number;
		not_submitted_active: number;
		not_submitted_inactive: number;
	}
	const stats: DashboardStats = {
		total_questions: 0,
		total_users: 0,
		total_tests: 0
	};
	const summary: TestSummary = {
		total_test_submitted: 0,
		total_test_not_submitted: 0,
		not_submitted_active: 0,
		not_submitted_inactive: 0,
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

	const responseSummary = await fetch(`${BACKEND_URL}/candidate/summary?${params.toString()}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (responseSummary.ok) {
		const summaryData = await responseSummary.json();
		summary.total_test_submitted = summaryData.total_test_submitted;
		summary.total_test_not_submitted = summaryData.total_test_not_submitted;
		summary.not_submitted_active = summaryData.not_submitted_active;
		summary.not_submitted_inactive = summaryData.not_submitted_inactive;
	}


	return { stats, summary }

};
export const actions: Actions = {
	applyFilter: async ({ request, cookies }) => {
		const token = getSessionTokenCookie();

		const form = await superValidate(request, zod(basedateSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}
		const dateData: any = {
			start_date: form.data.start_date,
			end_date: form.data.end_date,
		}
		const res: Response = await fetch(`${BACKEND_URL}/candidate/summary?start_date=${dateData.start_date}&end_date=${dateData.end_date}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},

		});

		if (!res.ok) {
			return fail(401, { form });
		}
		let url = '/dashboard';
		if (dateData.start_date || dateData.end_date) {
			const params = new URLSearchParams();

			if (dateData.start_date) {
				params.append("start_date", dateData.start_date);
			}
			if (dateData.end_date) {
				params.append("end_date", dateData.end_date);
			}

			url += `?${params.toString()}`;
		}

		throw redirect(303, url, { type: 'success', message: `Filter applied successfully` }, cookies);
	},
}
