import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/svelte';
import ResponsesPage from './+page.svelte';
import type { CandidateResponse } from './columns.js';
import { formatDatePart, formatTimePart } from '$lib/utils';

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

const sampleResponses: CandidateResponse[] = [submittedCandidate, notSubmittedCandidate];

function makeData(
	items: CandidateResponse[] = sampleResponses,
	{ canDelete = false, testName = 'Sample Test' }: { canDelete?: boolean; testName?: string } = {}
) {
	return {
		testId: '1',
		testName,
		responses: { items, total: items.length, pages: items.length > 0 ? 1 : 0 },
		totalPages: items.length > 0 ? 1 : 0,
		params: { page: 1, size: 25 },
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
			expect(screen.getByRole('columnheader', { name: 'Candidate' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'Marks' })).toBeInTheDocument();
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
	describe('Table row content', () => {
		it('shows the candidate identifier', () => {
			render(ResponsesPage, { data: makeData() } as any);
			expect(screen.getByText('candidate-aaa')).toBeInTheDocument();
			expect(screen.getByText('candidate-bbb')).toBeInTheDocument();
		});

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
			expect(screen.getAllByText('—').length).toBeGreaterThan(0);
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

		it('shows "Xm Ys" time taken for a submitted candidate', () => {
			render(ResponsesPage, { data: makeData() } as any);
			expect(screen.getByText('1m 30s')).toBeInTheDocument();
		});

		it('shows a dash for time taken when the candidate has not submitted', () => {
			render(ResponsesPage, { data: makeData([notSubmittedCandidate]) } as any);
			const row = screen.getByText('candidate-bbb').closest('tr') as HTMLElement;
			expect(within(row).getAllByText('—').length).toBeGreaterThan(0);
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
