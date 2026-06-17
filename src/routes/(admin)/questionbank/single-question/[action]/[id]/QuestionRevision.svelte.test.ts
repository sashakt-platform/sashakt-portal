import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import QuestionRevision from './QuestionRevision.svelte';

function makeRevision(overrides: Record<string, unknown> = {}) {
	return {
		id: 'rev-1',
		created_date: '2024-03-15T09:30:00Z',
		created_by_id: { full_name: 'Alice Smith' },
		...overrides
	};
}

async function openDialog() {
	await fireEvent.click(screen.getByRole('button', { name: /revision history/i }));
}

describe('QuestionRevision', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Revision History button', () => {
		it('renders the Revision History button', () => {
			render(QuestionRevision, { props: { data: { questionRevisions: [] } } });
			expect(screen.getByRole('button', { name: /revision history/i })).toBeInTheDocument();
		});

		it('dialog is not open before button is clicked', () => {
			render(QuestionRevision, { props: { data: { questionRevisions: [] } } });
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('opens the dialog when button is clicked', async () => {
			render(QuestionRevision, { props: { data: { questionRevisions: [] } } });
			await openDialog();
			expect(await screen.findByRole('dialog')).toBeInTheDocument();
		});
	});

	describe('Dialog header', () => {
		it('shows "Revision History" as the dialog title', async () => {
			render(QuestionRevision, { props: { data: { questionRevisions: [makeRevision()] } } });
			await openDialog();
			const dialog = await screen.findByRole('dialog');
			expect(within(dialog).getByText('Revision History')).toBeInTheDocument();
		});
	});

	describe('Empty state', () => {
		it('shows "No revisions found." when revisions array is empty', async () => {
			render(QuestionRevision, { props: { data: { questionRevisions: [] } } });
			await openDialog();
			expect(await screen.findByText('No revisions found.')).toBeInTheDocument();
		});

		it('shows "No revisions found." when questionRevisions is undefined', async () => {
			render(QuestionRevision, { props: { data: {} } });
			await openDialog();
			expect(await screen.findByText('No revisions found.')).toBeInTheDocument();
		});

		it('shows "No revisions found." when data is undefined', async () => {
			render(QuestionRevision, { props: { data: undefined } });
			await openDialog();
			expect(await screen.findByText('No revisions found.')).toBeInTheDocument();
		});

		it('does not show revision entries when there are no revisions', async () => {
			render(QuestionRevision, { props: { data: { questionRevisions: [] } } });
			await openDialog();
			await waitFor(() => {
				expect(screen.queryByText(/Revision #/)).not.toBeInTheDocument();
			});
		});
	});

	describe('Single revision', () => {
		it('shows "Revision #1" for a single revision', async () => {
			render(QuestionRevision, { props: { data: { questionRevisions: [makeRevision()] } } });
			await openDialog();
			expect(await screen.findByText('Revision #1')).toBeInTheDocument();
		});

		it('shows the author full name', async () => {
			render(QuestionRevision, { props: { data: { questionRevisions: [makeRevision()] } } });
			await openDialog();
			expect(await screen.findByText('Alice Smith')).toBeInTheDocument();
		});

		it('does not show author name when created_by_id is null', async () => {
			render(QuestionRevision, {
				props: { data: { questionRevisions: [makeRevision({ created_by_id: null })] } }
			});
			await openDialog();
			await screen.findByText('Revision #1');
			expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
		});

		it('does not show author name when full_name is absent', async () => {
			render(QuestionRevision, {
				props: { data: { questionRevisions: [makeRevision({ created_by_id: {} })] } }
			});
			await openDialog();
			await screen.findByText('Revision #1');
			expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
		});

		it('shows formatted date for the revision', async () => {
			const created_date = '2024-03-15T09:30:00Z';
			const expectedDate = new Date(created_date).toLocaleDateString('en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			});
			render(QuestionRevision, {
				props: { data: { questionRevisions: [makeRevision({ created_date })] } }
			});
			await openDialog();
			expect(await screen.findByText(expectedDate)).toBeInTheDocument();
		});

		it('shows formatted time for the revision', async () => {
			const created_date = '2024-03-15T09:30:00Z';
			const expectedTime = new Date(created_date).toLocaleTimeString('en-GB', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});
			render(QuestionRevision, {
				props: { data: { questionRevisions: [makeRevision({ created_date })] } }
			});
			await openDialog();
			expect(await screen.findByText(expectedTime)).toBeInTheDocument();
		});

		it('does not render a connector line for a single revision', async () => {
			render(QuestionRevision, {
				props: { data: { questionRevisions: [makeRevision()] } }
			});
			await openDialog();
			await screen.findByText('Revision #1');
			expect(document.body.querySelectorAll('.bg-border.w-px.flex-1')).toHaveLength(0);
		});
	});

	describe('Multiple revisions', () => {
		const revisions = [
			makeRevision({ id: 'r1', created_date: '2024-01-10T08:00:00Z', created_by_id: { full_name: 'Alice' } }),
			makeRevision({ id: 'r2', created_date: '2024-02-20T12:00:00Z', created_by_id: { full_name: 'Bob' } }),
			makeRevision({ id: 'r3', created_date: '2024-03-30T16:00:00Z', created_by_id: null })
		];

		it('shows all revision entries', async () => {
			render(QuestionRevision, { props: { data: { questionRevisions: revisions } } });
			await openDialog();
			expect(await screen.findByText('Revision #3')).toBeInTheDocument();
			expect(screen.getByText('Revision #2')).toBeInTheDocument();
			expect(screen.getByText('Revision #1')).toBeInTheDocument();
		});

		it('numbers revisions in descending order (first in array = highest number)', async () => {
			render(QuestionRevision, { props: { data: { questionRevisions: revisions } } });
			await openDialog();
			const allRevisionLabels = (await screen.findAllByText(/^Revision #\d+$/)).map(
				(el) => el.textContent
			);
			expect(allRevisionLabels).toEqual(['Revision #3', 'Revision #2', 'Revision #1']);
		});

		it('shows author names for revisions that have them', async () => {
			render(QuestionRevision, { props: { data: { questionRevisions: revisions } } });
			await openDialog();
			expect(await screen.findByText('Alice')).toBeInTheDocument();
			expect(screen.getByText('Bob')).toBeInTheDocument();
		});

		it('renders connector lines between revisions but not after the last one', async () => {
			render(QuestionRevision, {
				props: { data: { questionRevisions: revisions } }
			});
			await openDialog();
			await screen.findByText('Revision #3');
			expect(document.body.querySelectorAll('.bg-border.w-px.flex-1')).toHaveLength(revisions.length - 1);
		});

		it('renders a timeline dot for every revision', async () => {
			render(QuestionRevision, {
				props: { data: { questionRevisions: revisions } }
			});
			await openDialog();
			await screen.findByText('Revision #3');
			expect(document.body.querySelectorAll('.bg-primary.mt-1\\.5.h-3.w-3')).toHaveLength(
				revisions.length
			);
		});
	});

	describe('Revision uses created_date as fallback key', () => {
		it('renders correctly when revision has no id (uses created_date as key)', async () => {
			const revision = { created_date: '2024-05-01T10:00:00Z', created_by_id: null };
			render(QuestionRevision, { props: { data: { questionRevisions: [revision] } } });
			await openDialog();
			expect(await screen.findByText('Revision #1')).toBeInTheDocument();
		});
	});
});
