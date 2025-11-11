import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Dashboard from './+page.svelte';

describe('Dashboard.svelte', () => {
	test('renders "No of Tests" text on the page', () => {
		render(Dashboard);
		expect(screen.getByText('No of Tests')).toBeInTheDocument();
	});
	test('does not render "No of Me" text on the page', () => {
		render(Dashboard);

		expect(screen.queryByText('No of Me')).not.toBeInTheDocument();
	});
	test('renders Dashboard heading', () => {
		render(Dashboard);
		expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
	});

	test('renders "Summary of Test Attempts" section', () => {
		render(Dashboard);
		expect(screen.getByText('Summary of Test Attempts')).toBeInTheDocument();
	});

	test('renders info icon near Dashboard title', () => {
		const { container } = render(Dashboard);
		const infoIcon = container.querySelector('svg');
		expect(infoIcon).toBeInTheDocument();
	});
	test('loads dashboard stats and displays them in correct places', async () => {
		global.fetch = vi.fn((url) => {
			if (url === '/api/dashboard/stats') {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							total_questions: 25,
							total_tests: 10,
							total_users: 5
						})
				});
			}
			if (url === '/api/dashboard/test-attempts') {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							total_test_submitted: 8,
							total_test_not_submitted: 2,
							not_submitted_active: 1,
							not_submitted_inactive: 1
						})
				});
			}

			return Promise.reject(new Error('Unknown API'));
		}) as any;

		const { findByText, container } = render(Dashboard);

		expect(await findByText('No of Questions')).toBeInTheDocument();
		expect(await findByText('No of Tests')).toBeInTheDocument();
		expect(await findByText('No of Users')).toBeInTheDocument();

		expect(await findByText('Submitted')).toBeInTheDocument();
		expect(await findByText('Non-Submitted')).toBeInTheDocument();
		expect(await findByText('Active')).toBeInTheDocument();
		expect(await findByText('Inactive')).toBeInTheDocument();

		expect(container.textContent).toContain('25');
		expect(container.textContent).toContain('10');
		expect(container.textContent).toContain('5');
		expect(container.textContent).toContain('8');
		expect(container.textContent).toContain('2');
		expect(container.textContent).toContain('1');
	});
});
