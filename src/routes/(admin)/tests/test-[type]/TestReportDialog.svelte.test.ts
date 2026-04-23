import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import TestReportDialog from './TestReportDialog.svelte';

const mockFetch = vi.fn();
global.fetch = mockFetch as typeof fetch;

const mockReportData = {
	total_test_submitted: 40,
	total_test_not_submitted: 60,
	not_submitted_active: 30,
	not_submitted_inactive: 30
};

function renderDialog(props: { open: boolean; testId: string | null }) {
	return render(TestReportDialog, { props });
}

describe('TestReportDialog', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	describe('Visibility', () => {
		it('does not render dialog content when open is false', () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => mockReportData });
			renderDialog({ open: false, testId: '1' });

			expect(screen.queryByText('Test Report')).not.toBeInTheDocument();
		});

		it('renders dialog title when open is true', () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => mockReportData });
			renderDialog({ open: true, testId: '1' });

			expect(screen.getByText('Test Report')).toBeInTheDocument();
		});

		it('renders a horizontal rule below the heading', () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => mockReportData });
			renderDialog({ open: true, testId: '1' });

			expect(document.querySelector('hr')).toBeInTheDocument();
		});
	});

	describe('Loading state', () => {
		it('shows three skeleton placeholders while fetching', async () => {
			mockFetch.mockImplementation(() => new Promise(() => {}));

			renderDialog({ open: true, testId: '1' });

			await waitFor(() => {
				expect(document.querySelectorAll('.animate-pulse').length).toBe(3);
			});
		});

		it('does not show stat labels while loading', () => {
			mockFetch.mockImplementation(() => new Promise(() => {}));
			renderDialog({ open: true, testId: '1' });

			expect(screen.queryByText('Total')).not.toBeInTheDocument();
			expect(screen.queryByText('Submitted')).not.toBeInTheDocument();
		});
	});

	describe('Success state', () => {
		it('renders all four stat row labels after fetch resolves', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => mockReportData });
			renderDialog({ open: true, testId: '1' });

			await waitFor(() => expect(screen.getByText('Total')).toBeInTheDocument());
			expect(screen.getByText('Submitted')).toBeInTheDocument();
			expect(screen.getByText('Not submitted')).toBeInTheDocument();
			expect(screen.getByText('Active')).toBeInTheDocument();
			expect(screen.getByText('Inactive')).toBeInTheDocument();
		});

		it('displays the submitted count', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => mockReportData });
			renderDialog({ open: true, testId: '1' });

			await waitFor(() => expect(screen.getByText('40 tests')).toBeInTheDocument());
		});

		it('displays the not-submitted count', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => mockReportData });
			renderDialog({ open: true, testId: '1' });

			await waitFor(() => expect(screen.getByText('60 tests')).toBeInTheDocument());
		});

		it('computes total as submitted + not_submitted', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					total_test_submitted: 25,
					total_test_not_submitted: 75,
					not_submitted_active: 50,
					not_submitted_inactive: 25
				})
			});
			renderDialog({ open: true, testId: '1' });

			await waitFor(() => expect(screen.getByText('100 tests')).toBeInTheDocument());
		});

		it('displays active and inactive sub-counts', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					total_test_submitted: 10,
					total_test_not_submitted: 20,
					not_submitted_active: 12,
					not_submitted_inactive: 8
				})
			});
			renderDialog({ open: true, testId: '1' });

			await waitFor(() => expect(screen.getByText('12 tests')).toBeInTheDocument());
			expect(screen.getByText('8 tests')).toBeInTheDocument();
		});

		it('handles all-zero response without crashing', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					total_test_submitted: 0,
					total_test_not_submitted: 0,
					not_submitted_active: 0,
					not_submitted_inactive: 0
				})
			});
			renderDialog({ open: true, testId: '1' });

			await waitFor(() => {
				expect(screen.getAllByText('0 tests').length).toBeGreaterThanOrEqual(1);
			});
		});

		it('renders a divider line inside the Not submitted card', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => mockReportData });
			renderDialog({ open: true, testId: '1' });

			await waitFor(() => expect(screen.getByText('Not submitted')).toBeInTheDocument());
			expect(document.querySelectorAll('hr').length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('Error state', () => {
		it('shows error message when fetch rejects', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));
			renderDialog({ open: true, testId: '1' });

			await waitFor(() => {
				expect(screen.getByText('Failed to load report. Please try again.')).toBeInTheDocument();
			});
		});

		it('shows error message when response is not ok', async () => {
			mockFetch.mockResolvedValue({ ok: false, status: 500 });
			renderDialog({ open: true, testId: '1' });

			await waitFor(() => {
				expect(screen.getByText('Failed to load report. Please try again.')).toBeInTheDocument();
			});
		});

		it('does not show stat labels when in error state', async () => {
			mockFetch.mockRejectedValue(new Error('fail'));
			renderDialog({ open: true, testId: '1' });

			await waitFor(() =>
				expect(screen.getByText('Failed to load report. Please try again.')).toBeInTheDocument()
			);
			expect(screen.queryByText('Total')).not.toBeInTheDocument();
		});

		it('does not show loading skeletons when in error state', async () => {
			mockFetch.mockRejectedValue(new Error('fail'));
			renderDialog({ open: true, testId: '1' });

			await waitFor(() =>
				expect(screen.getByText('Failed to load report. Please try again.')).toBeInTheDocument()
			);
			expect(document.querySelectorAll('.animate-pulse').length).toBe(0);
		});
	});

	describe('Fetch behaviour', () => {
		it('calls fetch with the correct API path and test_id', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => mockReportData });
			renderDialog({ open: true, testId: '42' });

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith('/api/test-report?test_id=42');
			});
		});

		it('encodes special characters in testId', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => mockReportData });
			renderDialog({ open: true, testId: 'test/id&value' });

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith('/api/test-report?test_id=test%2Fid%26value');
			});
		});

		it('does not call fetch when open is false', async () => {
			renderDialog({ open: false, testId: '1' });
			await new Promise((r) => setTimeout(r, 0));
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it('does not call fetch when testId is null', async () => {
			renderDialog({ open: true, testId: null });
			await new Promise((r) => setTimeout(r, 0));
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it('calls fetch exactly once per open', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => mockReportData });
			renderDialog({ open: true, testId: '1' });

			await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
		});
	});
});
