import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/svelte';
import ResponsesPage from './+page.svelte';
import type { CandidateResponse } from './columns.js';
import { formatDatePart, formatTimePart } from '$lib/utils';
import { toast } from 'svelte-sonner';

vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => ({ destroy: vi.fn() }))
}));

vi.mock('$app/navigation', () => ({
	invalidateAll: vi.fn(),
	goto: vi.fn()
}));

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/tests/test-standard/1/responses?page=1') }
}));

vi.mock('svelte-sonner', () => ({
	toast: { error: vi.fn(), success: vi.fn() }
}));

const submittedCandidate: CandidateResponse = {
	candidate_id: 1,
	candidate_uuid: 'candidate-aaa',
	status: 'submitted',
	start_time: '2026-06-01T10:00:00Z',
	end_time: '2026-06-01T10:30:00Z',
	time_taken_seconds: 90,
	result: {
		correct_answer: 8,
		incorrect_answer: 2,
		mandatory_not_attempted: 0,
		optional_not_attempted: 0,
		total_questions: 10,
		marks_obtained: 8,
		marks_maximum: 10,
		certificate_download_url: null
	}
};

const notSubmittedCandidate: CandidateResponse = {
	candidate_id: 2,
	candidate_uuid: 'candidate-bbb',
	status: 'not_submitted',
	start_time: null,
	end_time: null,
	time_taken_seconds: null,
	result: null
};

const candidateWithCertificate: CandidateResponse = {
	candidate_id: 3,
	candidate_uuid: 'candidate-ccc',
	status: 'submitted',
	start_time: '2026-06-01T10:00:00Z',
	end_time: '2026-06-01T10:30:00Z',
	time_taken_seconds: 90,
	result: {
		correct_answer: 9,
		incorrect_answer: 1,
		mandatory_not_attempted: 0,
		optional_not_attempted: 0,
		total_questions: 10,
		marks_obtained: 9,
		marks_maximum: 10,
		certificate_download_url: 'https://example.com/certificates/candidate-ccc.pdf'
	}
};

const candidateWithFormResponse: CandidateResponse = {
	candidate_id: 4,
	candidate_uuid: 'candidate-ddd',
	status: 'submitted',
	start_time: '2026-06-01T10:00:00Z',
	end_time: '2026-06-01T10:30:00Z',
	time_taken_seconds: 90,
	result: {
		correct_answer: 7,
		incorrect_answer: 3,
		mandatory_not_attempted: 0,
		optional_not_attempted: 0,
		total_questions: 10,
		marks_obtained: 7,
		marks_maximum: 10,
		certificate_download_url: null
	},
	form_response: { feedback: 'Great experience', full_name: 'Jane Doe', middle_name: 'N/A' }
};

const sampleResponses: CandidateResponse[] = [submittedCandidate, notSubmittedCandidate];

function makeData(
	items: CandidateResponse[] = sampleResponses,
	{
		canDelete = false,
		testName = 'Sample Test',
		params = {}
	}: { canDelete?: boolean; testName?: string; params?: Record<string, unknown> } = {}
) {
	return {
		testId: '1',
		testName,
		responses: { items, total: items.length, pages: items.length > 0 ? 1 : 0 },
		totalPages: items.length > 0 ? 1 : 0,
		params: { page: 1, size: 25, ...params },
		user: { id: 1, permissions: canDelete ? ['delete_candidate'] : [] }
	};
}

describe('Candidate Responses page (UI)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Page load', () => {
		it('shows the test name as the page title', () => {
			render(ResponsesPage, {
				data: makeData(sampleResponses, { testName: 'Algebra Basics' })
			} as any);
			expect(screen.getByText('Algebra Basics')).toBeInTheDocument();
		});

		it('shows all table column headers', () => {
			render(ResponsesPage, { data: makeData() } as any);
			expect(screen.getByRole('columnheader', { name: 'Marks' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'Start Time' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'End Time' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'Time Taken' })).toBeInTheDocument();
		});

		it('shows "No responses found." when there are no candidates', () => {
			render(ResponsesPage, { data: makeData([]) } as any);
			expect(screen.getByText('No responses found.')).toBeInTheDocument();
		});

		it('shows a back link to the test session listing', () => {
			render(ResponsesPage, { data: makeData() } as any);
			expect(screen.getByRole('link', { name: 'Go back' })).toHaveAttribute(
				'href',
				'/tests/test-session'
			);
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Export button (headerActions)', () => {
		it('shows the Export button when there are responses', () => {
			render(ResponsesPage, { data: makeData(sampleResponses) } as any);
			expect(screen.getByRole('link', { name: /Export/ })).toBeInTheDocument();
		});

		it('does not show the Export button when there are no responses', () => {
			render(ResponsesPage, { data: makeData([]) } as any);
			expect(screen.queryByRole('link', { name: /Export/ })).not.toBeInTheDocument();
			expect(screen.queryByText('Export')).not.toBeInTheDocument();
		});

		it('shows the Export button again once responses come back after being empty', async () => {
			const { rerender } = render(ResponsesPage, { data: makeData([]) } as any);
			expect(screen.queryByRole('link', { name: /Export/ })).not.toBeInTheDocument();

			await rerender({ data: makeData(sampleResponses) } as any);

			expect(screen.getByRole('link', { name: /Export/ })).toBeInTheDocument();
		});

		it('renders the Export link with a download attribute', () => {
			render(ResponsesPage, { data: makeData(sampleResponses) } as any);
			expect(screen.getByRole('link', { name: /Export/ })).toHaveAttribute('download');
		});

		it('points the Export link at the export endpoint for the current test', () => {
			render(ResponsesPage, { data: makeData(sampleResponses) } as any);
			const href = screen.getByRole('link', { name: /Export/ }).getAttribute('href');
			expect(href).toContain('/tests/test-standard/1/responses/export');
		});

		it('includes the current sortBy and sortOrder in the Export link', () => {
			render(ResponsesPage, {
				data: makeData(sampleResponses, { params: { sortBy: 'marks', sortOrder: 'desc' } })
			} as any);

			const href = screen.getByRole('link', { name: /Export/ }).getAttribute('href');
			expect(href).toContain('sortBy=marks');
			expect(href).toContain('sortOrder=desc');
		});

		it('defaults sortOrder to asc and sortBy to empty in the Export link when unsorted', () => {
			render(ResponsesPage, { data: makeData(sampleResponses) } as any);

			const href = screen.getByRole('link', { name: /Export/ }).getAttribute('href');
			expect(href).toContain('sortBy=');
			expect(href).toContain('sortOrder=asc');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Table row content', () => {
		it('shows a "Submitted" badge for submitted candidates', () => {
			render(ResponsesPage, { data: makeData() } as any);
			expect(screen.getByText('Submitted')).toBeInTheDocument();
		});

		it('shows a "Not Submitted" badge for candidates who have not submitted', () => {
			render(ResponsesPage, { data: makeData() } as any);
			expect(screen.getByText('Not Submitted')).toBeInTheDocument();
		});

		it('shows "obtained / maximum" marks for a submitted candidate', () => {
			render(ResponsesPage, { data: makeData() } as any);
			expect(screen.getByText('8 / 10')).toBeInTheDocument();
		});

		it('shows a dash for marks when the candidate has no result', () => {
			render(ResponsesPage, { data: makeData([notSubmittedCandidate]) } as any);
			const row = screen.getByText('Not Submitted').closest('tr') as HTMLElement;
			const cells = within(row).getAllByRole('cell');
			expect(cells[0]).toHaveTextContent('—');
		});

		it('shows formatted start/end time for a submitted candidate', () => {
			render(ResponsesPage, { data: makeData() } as any);
			expect(
				screen.getAllByText(formatDatePart(submittedCandidate.start_time!)).length
			).toBeGreaterThan(0);
			expect(
				screen.getAllByText(formatTimePart(submittedCandidate.start_time!)).length
			).toBeGreaterThan(0);
		});

		it('shows a dash (not "Invalid Date") for start/end time when the candidate has not submitted', () => {
			render(ResponsesPage, { data: makeData([notSubmittedCandidate]) } as any);
			expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument();
			const row = screen.getByText('Not Submitted').closest('tr') as HTMLElement;
			const cells = within(row).getAllByRole('cell');
			expect(cells[2]).toHaveTextContent('—');
			expect(cells[3]).toHaveTextContent('—');
		});

		it('shows "Xm Ys" time taken for a submitted candidate', () => {
			render(ResponsesPage, { data: makeData() } as any);
			expect(screen.getByText('1m 30s')).toBeInTheDocument();
		});

		it('shows a dash for time taken when the candidate has not submitted', () => {
			render(ResponsesPage, { data: makeData([notSubmittedCandidate]) } as any);
			const row = screen.getByText('Not Submitted').closest('tr') as HTMLElement;
			const cells = within(row).getAllByRole('cell');
			expect(cells[4]).toHaveTextContent('—');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Delete button — user has delete permission', () => {
		it('shows a delete button on each row', () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: true }) } as any);
			expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(
				sampleResponses.length
			);
		});

		it('opens a confirmation dialog when the row delete button is clicked', async () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: true }) } as any);

			const [firstDeleteButton] = screen.getAllByRole('button', { name: 'Delete' });
			await fireEvent.click(firstDeleteButton);

			expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
			expect(screen.getByText('Delete Candidate?')).toBeInTheDocument();
		});

		it('confirming the dialog posts to the delete endpoint for the clicked candidate', async () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: true }) } as any);

			const [, secondDeleteButton] = screen.getAllByRole('button', { name: 'Delete' });
			await fireEvent.click(secondDeleteButton);
			const dialog = await screen.findByRole('alertdialog');

			const confirmForm = within(dialog)
				.getByRole('button', { name: 'Delete' })
				.closest('form') as HTMLFormElement;
			expect(confirmForm).toHaveAttribute(
				'action',
				`?/deleteCandidate&candidate_id=${sampleResponses[1].candidate_id}`
			);
		});

		it('closes the dialog without deleting when Cancel is clicked', async () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: true }) } as any);

			const [firstDeleteButton] = screen.getAllByRole('button', { name: 'Delete' });
			await fireEvent.click(firstDeleteButton);
			const dialog = await screen.findByRole('alertdialog');

			await fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

			await waitFor(() => {
				expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
			});
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Download Certificate button', () => {
		const originalCreateObjectURL = window.URL.createObjectURL;
		const originalRevokeObjectURL = window.URL.revokeObjectURL;

		beforeEach(() => {
			window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
			window.URL.revokeObjectURL = vi.fn();
		});

		afterEach(() => {
			window.URL.createObjectURL = originalCreateObjectURL;
			window.URL.revokeObjectURL = originalRevokeObjectURL;
			vi.unstubAllGlobals();
		});

		it('shows no download button for a candidate with no certificate_download_url', () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: true }) } as any);
			expect(
				screen.queryByRole('button', { name: 'Download Certificate' })
			).not.toBeInTheDocument();
		});

		it('shows a download button when certificate_download_url is set', () => {
			render(ResponsesPage, {
				data: makeData([candidateWithCertificate], { canDelete: true })
			} as any);
			expect(
				screen.getByRole('button', { name: 'Download Certificate' })
			).toBeInTheDocument();
		});

		it('fetches the certificate through the download proxy and triggers a browser download on click', async () => {
			const blob = new Blob(['pdf-bytes'], { type: 'image/png' });
			const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) });
			vi.stubGlobal('fetch', fetchMock);

			render(ResponsesPage, {
				data: makeData([candidateWithCertificate], { canDelete: true })
			} as any);
			await fireEvent.click(screen.getByRole('button', { name: 'Download Certificate' }));

			await waitFor(() => {
				expect(fetchMock).toHaveBeenCalledWith('/api/download-certificate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						certificate_download_url: candidateWithCertificate.result!.certificate_download_url
					})
				});
			});
			await waitFor(() => {
				expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
			});
			expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
		});

		it('shows an error toast and does not throw when the download proxy fails', async () => {
			const fetchMock = vi.fn().mockResolvedValue({ ok: false });
			vi.stubGlobal('fetch', fetchMock);

			render(ResponsesPage, {
				data: makeData([candidateWithCertificate], { canDelete: true })
			} as any);
			await fireEvent.click(screen.getByRole('button', { name: 'Download Certificate' }));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith('Failed to download certificate');
			});
			expect(window.URL.createObjectURL).not.toHaveBeenCalled();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Show Responses button', () => {
		it('shows no "Show Responses" button for a candidate with no form_response', () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: true }) } as any);
			expect(
				screen.queryByRole('button', { name: 'Show Responses' })
			).not.toBeInTheDocument();
		});

		it('shows a "Show Responses" button when form_response is set', () => {
			render(ResponsesPage, {
				data: makeData([candidateWithFormResponse], { canDelete: true })
			} as any);
			expect(screen.getByRole('button', { name: 'Show Responses' })).toBeInTheDocument();
		});

		it("opens a dialog listing the candidate's answers, humanized, skipping N/A fields", async () => {
			render(ResponsesPage, {
				data: makeData([candidateWithFormResponse], { canDelete: true })
			} as any);

			await fireEvent.click(screen.getByRole('button', { name: 'Show Responses' }));

			const dialog = await screen.findByRole('dialog');
			expect(within(dialog).getByText('Form Responses')).toBeInTheDocument();
			expect(within(dialog).getByText('Feedback')).toBeInTheDocument();
			expect(within(dialog).getByText('Great experience')).toBeInTheDocument();
			expect(within(dialog).getByText('Full Name')).toBeInTheDocument();
			expect(within(dialog).getByText('Jane Doe')).toBeInTheDocument();
			expect(within(dialog).queryByText('Middle Name')).not.toBeInTheDocument();
			expect(within(dialog).queryByText('N/A')).not.toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Delete button — user lacks delete permission', () => {
		it('shows no delete buttons on any row', () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: false }) } as any);
			expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
		});

		it('shows no row/select-all checkboxes', () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: false }) } as any);
			expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
		});

		it('shows no batch actions toolbar, even conceptually (nothing to select)', () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: false }) } as any);
			expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Row selection and batch delete — user has delete permission', () => {
		it('shows a checkbox for every row plus a select-all checkbox', () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: true }) } as any);
			expect(screen.getAllByRole('checkbox')).toHaveLength(sampleResponses.length + 1);
		});

		it('shows the batch actions toolbar with a live count after selecting a row', async () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: true }) } as any);

			const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Select row' });
			await fireEvent.click(rowCheckboxes[0]);

			expect(await screen.findByText(/1 candidate selected/)).toBeInTheDocument();
		});

		it('updates the count when a second row is selected', async () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: true }) } as any);

			const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Select row' });
			await fireEvent.click(rowCheckboxes[0]);
			await fireEvent.click(rowCheckboxes[1]);

			expect(await screen.findByText(/2 candidates selected/)).toBeInTheDocument();
		});

		it('opens a batch confirmation dialog naming the selected count when toolbar Delete is clicked', async () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: true }) } as any);

			const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Select row' });
			await fireEvent.click(rowCheckboxes[0]);
			const toolbar = (await screen.findByText(/1 candidate selected/)).closest(
				'.bg-accent'
			) as HTMLElement;

			await fireEvent.click(within(toolbar).getByRole('button', { name: 'Delete' }));

			expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
			expect(screen.getByText('Delete 1 Candidate?')).toBeInTheDocument();
		});

		it('keeps the selection and closes the dialog when batch Cancel is clicked', async () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: true }) } as any);

			const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Select row' });
			await fireEvent.click(rowCheckboxes[0]);
			const toolbar = (await screen.findByText(/1 candidate selected/)).closest(
				'.bg-accent'
			) as HTMLElement;
			await fireEvent.click(within(toolbar).getByRole('button', { name: 'Delete' }));
			const dialog = await screen.findByRole('alertdialog');

			await fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

			await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
			expect(screen.getByText(/1 candidate selected/)).toBeInTheDocument();
		});

		it('clears the selection and hides the toolbar when "Clear selection" is clicked', async () => {
			render(ResponsesPage, { data: makeData(sampleResponses, { canDelete: true }) } as any);

			const rowCheckboxes = screen.getAllByRole('checkbox', { name: 'Select row' });
			await fireEvent.click(rowCheckboxes[0]);
			await screen.findByText(/1 candidate selected/);

			await fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

			await waitFor(() => {
				expect(screen.queryByText(/candidates? selected/)).not.toBeInTheDocument();
			});
			expect(screen.getByText(/0 of 2 selected/)).toBeInTheDocument();
		});
	});
});
