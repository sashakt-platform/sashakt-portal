import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Dashboard from './+page.svelte';
import { setCustomNomenclature, resetNomenclature } from '$lib/test-utils/nomenclature-mock';

vi.mock('$lib/nomenclature', async () => {
	const { createNomenclatureMock } = await import('$lib/test-utils/nomenclature-mock');
	return createNomenclatureMock();
});

describe('Dashboard.svelte', () => {
	afterEach(() => {
		resetNomenclature();
	});

	it('renders "No of Tests" text on the page', () => {
		render(Dashboard);
		expect(screen.getByText('No of Tests')).toBeInTheDocument();
	});
	it('does not render "No of Me" text on the page', () => {
		render(Dashboard);

		expect(screen.queryByText('No of Me')).not.toBeInTheDocument();
	});
	it('renders Dashboard heading', () => {
		render(Dashboard);
		expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
	});

	it('renders "Summary of Test Attempts" section', () => {
		render(Dashboard);
		expect(screen.getByText('Summary of Test Attempts')).toBeInTheDocument();
	});

	it('renders info icon near Dashboard title', () => {
		const { container } = render(Dashboard);
		const infoIcon = container.querySelector('svg');
		expect(infoIcon).toBeInTheDocument();
	});
	it('loads dashboard stats and displays them in correct places', async () => {
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

	// ─────────────────────────────────────────────────────────────────────────
	describe('Custom nomenclature labels', () => {
		it('renders custom dashboard heading when nomenclature is overridden', () => {
			setCustomNomenclature({ dashboard: 'Home' });
			render(Dashboard);
			expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
			expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument();
		});

		it('renders custom test label in stats box', () => {
			setCustomNomenclature({ tests: 'Exams' });
			render(Dashboard);
			expect(screen.getByText('No of Exams')).toBeInTheDocument();
			expect(screen.queryByText('No of Tests')).not.toBeInTheDocument();
		});

		it('renders custom users label in stats box', () => {
			setCustomNomenclature({ users: 'Members' });
			render(Dashboard);
			expect(screen.getByText('No of Members')).toBeInTheDocument();
			expect(screen.queryByText('No of Users')).not.toBeInTheDocument();
		});

		it('renders custom test label in test attempts summary', () => {
			setCustomNomenclature({ test: 'Exam' });
			render(Dashboard);
			expect(screen.getByText('Summary of Exam Attempts')).toBeInTheDocument();
			expect(screen.queryByText('Summary of Test Attempts')).not.toBeInTheDocument();
		});

		it('applies multiple custom nomenclature overrides simultaneously', () => {
			setCustomNomenclature({
				dashboard: 'Control Panel',
				tests: 'Assessments',
				users: 'Learners',
				test: 'Assessment'
			});
			render(Dashboard);
			expect(screen.getByRole('heading', { name: 'Control Panel' })).toBeInTheDocument();
			expect(screen.getByText('No of Assessments')).toBeInTheDocument();
			expect(screen.getByText('No of Learners')).toBeInTheDocument();
			expect(screen.getByText('Summary of Assessment Attempts')).toBeInTheDocument();
		});

		it('falls back to default when custom nomenclature is reset', () => {
			setCustomNomenclature({ dashboard: 'Home' });
			resetNomenclature();
			render(Dashboard);
			expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
		});
	});
});
