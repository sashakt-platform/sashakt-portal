import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within } from '@testing-library/svelte';
import QuestionListingPage from './+page.svelte';
import { setCustomNomenclature, resetNomenclature } from '$lib/test-utils/nomenclature-mock';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/questionbank'),
		searchParams: new URLSearchParams()
	}
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

const enhanceRef = vi.hoisted(() => ({ submitFactory: null as null | (() => any) }));

vi.mock('$app/forms', () => ({
	enhance: vi.fn((...args: unknown[]) => {
		enhanceRef.submitFactory = args[1] as () => any;
		return { destroy: vi.fn() };
	})
}));

vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

vi.mock('$lib/nomenclature', async () => {
	const { createNomenclatureMock } = await import('$lib/test-utils/nomenclature-mock');
	return createNomenclatureMock();
});

vi.mock('$lib/utils/permissions.js', () => ({
	canCreate: vi.fn(() => false),
	canUpdate: vi.fn(() => false),
	canDelete: vi.fn(() => false),
	hasLocation: vi.fn(() => false)
}));

const dtRef = vi.hoisted(() => ({ props: null as any }));

vi.mock('$lib/components/data-table', () => ({
	
	DataTable: vi.fn((_: unknown, props: any) => {
		dtRef.props = props;
		void props?.columns;
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	})
}));

const batchToolbarRef = vi.hoisted(() => ({ props: null as any }));

vi.mock('$lib/components/data-table/BatchActionsToolbar.svelte', () => ({
	default: vi.fn((_: unknown, props: any) => {
		batchToolbarRef.props = props;
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	})
}));

const { mockStateSelection, mockTagsSelection, mockTagTypeSelection } = vi.hoisted(() => {
	const makeMock = () =>
		vi.fn().mockImplementation(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }));
	return {
		mockStateSelection: makeMock(),
		mockTagsSelection: makeMock(),
		mockTagTypeSelection: makeMock()
	};
});

vi.mock('$lib/components/StateSelection.svelte', () => ({ default: mockStateSelection }));
vi.mock('$lib/components/TagsSelection.svelte', () => ({ default: mockTagsSelection }));
vi.mock('$lib/components/TagTypeSelection.svelte', () => ({ default: mockTagTypeSelection }));

const deleteDialogRef = vi.hoisted(() => ({ props: null as any }));

vi.mock('$lib/components/DeleteDialog.svelte', () => ({
	default: vi.fn((_: unknown, props: any) => {
		deleteDialogRef.props = props;
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	})
}));

const colRef = vi.hoisted(() => ({
	handleSort: null as null | ((columnId: string) => void),
	enableSelection: undefined as boolean | undefined,
	permissions: undefined as { canEdit?: boolean; canDelete?: boolean } | undefined
}));

vi.mock('./columns', () => ({
	createQuestionColumns: vi.fn((...args: unknown[]) => {
		colRef.handleSort = args[2] as (columnId: string) => void;
		colRef.enableSelection = args[3] as boolean;
		colRef.permissions = args[4] as { canEdit?: boolean; canDelete?: boolean };
		return [];
	})
}));

import { canCreate, canUpdate, canDelete, hasLocation } from '$lib/utils/permissions.js';
import { goto, invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import { type Question } from './columns';

const baseData = (
	items: Partial<Question>[] = [],
	paramsOverride: Partial<{
		search: string;
		sortBy: string;
		sortOrder: string;
		page: number;
		size: number;
	}> = {}
) =>
	({
		questions: { items, total: items.length, pages: items.length > 0 ? 1 : 0 },
		params: { page: 1, size: 25, search: '', sortBy: '', sortOrder: 'asc', ...paramsOverride },
		user: { id: 1, permissions: [] }
	}) as any;

describe('Question Bank Listing Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(canCreate).mockReturnValue(false);
		vi.mocked(canUpdate).mockReturnValue(false);
		vi.mocked(canDelete).mockReturnValue(false);
		vi.mocked(hasLocation).mockReturnValue(false);
		(page as any).url = new URL('http://localhost/questionbank');
		colRef.handleSort = null;
		colRef.enableSelection = undefined;
		colRef.permissions = undefined;
		dtRef.props = null;
		batchToolbarRef.props = null;
		deleteDialogRef.props = null;
		enhanceRef.submitFactory = null;
		resetNomenclature();
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Page title', () => {
		it('should show "Question Bank" title', () => {
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(screen.getByText('Question Bank')).toBeInTheDocument();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Empty state', () => {
		it('should show empty state when no items are present', () => {
			render(QuestionListingPage, { data: baseData([]) });
			expect(screen.getByText('Create your first question')).toBeInTheDocument();
		});

		it('should not show empty state when items are present', () => {
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(screen.queryByText('Create your first question')).not.toBeInTheDocument();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Filter visibility (location-based)', () => {
		it('should show state filter when user has no location assigned', () => {
			vi.mocked(hasLocation).mockReturnValue(false);
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(mockStateSelection).toHaveBeenCalled();
		});

		it('should hide state filter when user has a state assigned', () => {
			vi.mocked(hasLocation).mockReturnValue(true);
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(mockStateSelection).not.toHaveBeenCalled();
		});

		it('should hide state filter when user has districts assigned', () => {
			vi.mocked(hasLocation).mockReturnValue(true);
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(mockStateSelection).not.toHaveBeenCalled();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Header action buttons (canCreate)', () => {
		it('shows "Create Question" and "Bulk Upload" buttons when user has create permission', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(screen.getByRole('link', { name: /create question/i })).toBeInTheDocument();
			expect(screen.getByRole('link', { name: /bulk upload/i })).toBeInTheDocument();
		});

		it('hides "Create Question" and "Bulk Upload" buttons when user lacks create permission', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(screen.queryByRole('link', { name: /create question/i })).not.toBeInTheDocument();
			expect(screen.queryByRole('link', { name: /bulk upload/i })).not.toBeInTheDocument();
		});

		it('"Create Question" link points to /questionbank/single-question/add/new', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(screen.getByRole('link', { name: /create question/i })).toHaveAttribute(
				'href',
				'/questionbank/single-question/add/new'
			);
		});

		it('"Bulk Upload" link points to /questionbank/import', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(screen.getByRole('link', { name: /bulk upload/i })).toHaveAttribute(
				'href',
				'/questionbank/import'
			);
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Empty state CTA cards (canCreate)', () => {
		function emptyStateRegion() {
			return screen.getByText('Create your first question').closest('div') as HTMLElement;
		}

		it('shows "Create Question" and "Bulk Upload" CTA cards when user has create permission', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(QuestionListingPage, { data: baseData([]) });
			const region = within(emptyStateRegion());
			expect(region.getByRole('link', { name: /create question/i })).toBeInTheDocument();
			expect(region.getByRole('link', { name: /bulk upload/i })).toBeInTheDocument();
		});

		it('hides CTA cards when user lacks create permission', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(QuestionListingPage, { data: baseData([]) });
			const region = within(emptyStateRegion());
			expect(region.queryByRole('link', { name: /create question/i })).not.toBeInTheDocument();
			expect(region.queryByRole('link', { name: /bulk upload/i })).not.toBeInTheDocument();
		});

		it('shows descriptive helper text for each CTA card', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(QuestionListingPage, { data: baseData([]) });
			expect(screen.getByText('Create questions from scratch.')).toBeInTheDocument();
			expect(screen.getByText('Upload multiple questions at once.')).toBeInTheDocument();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Active filters suppress the empty state', () => {
		it('hides empty state when search is active even with 0 results', () => {
			render(QuestionListingPage, { data: baseData([], { search: 'xyz' }) });
			expect(screen.queryByText('Create your first question')).not.toBeInTheDocument();
		});

		it('hides empty state when tag_ids filter is active even with 0 results', () => {
			(page as any).url = new URL('http://localhost/questionbank?tag_ids=5');
			render(QuestionListingPage, { data: baseData([]) });
			expect(screen.queryByText('Create your first question')).not.toBeInTheDocument();
		});

		it('hides empty state when state_ids filter is active even with 0 results', () => {
			(page as any).url = new URL('http://localhost/questionbank?state_ids=12');
			render(QuestionListingPage, { data: baseData([]) });
			expect(screen.queryByText('Create your first question')).not.toBeInTheDocument();
		});

		it('hides empty state when tag_type_ids filter is active even with 0 results', () => {
			(page as any).url = new URL('http://localhost/questionbank?tag_type_ids=3');
			render(QuestionListingPage, { data: baseData([]) });
			expect(screen.queryByText('Create your first question')).not.toBeInTheDocument();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('createQuestionColumns wiring', () => {
		it('passes canEdit=true when user can update questions', async () => {
			vi.mocked(canUpdate).mockReturnValue(true);
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			await waitFor(() => {
				if (!colRef.permissions) throw new Error('permissions not captured yet');
			});
			expect(colRef.permissions?.canEdit).toBe(true);
		});

		it('passes canEdit=false when user cannot update questions', async () => {
			vi.mocked(canUpdate).mockReturnValue(false);
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			await waitFor(() => {
				if (colRef.permissions === undefined) throw new Error('permissions not captured yet');
			});
			expect(colRef.permissions?.canEdit).toBe(false);
		});

		it('passes canDelete=true when user can delete questions', async () => {
			vi.mocked(canDelete).mockReturnValue(true);
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			await waitFor(() => {
				if (!colRef.permissions) throw new Error('permissions not captured yet');
			});
			expect(colRef.permissions?.canDelete).toBe(true);
		});

		it('passes canDelete=false when user cannot delete questions', async () => {
			vi.mocked(canDelete).mockReturnValue(false);
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			await waitFor(() => {
				if (colRef.permissions === undefined) throw new Error('permissions not captured yet');
			});
			expect(colRef.permissions?.canDelete).toBe(false);
		});

		it('passes enableSelection=true when items are present', async () => {
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			await waitFor(() => {
				if (colRef.enableSelection === undefined)
					throw new Error('enableSelection not captured yet');
			});
			expect(colRef.enableSelection).toBe(true);
		});

		it('passes enableSelection=true when there are 0 results but an active filter', async () => {
			(page as any).url = new URL('http://localhost/questionbank?tag_ids=5');
			render(QuestionListingPage, { data: baseData([]) });
			await waitFor(() => {
				if (colRef.enableSelection === undefined)
					throw new Error('enableSelection not captured yet');
			});
			expect(colRef.enableSelection).toBe(true);
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Sorting behavior (handleSort)', () => {
		async function renderAndCaptureSort(sortBy = '', sortOrder = 'asc') {
			render(QuestionListingPage, { data: baseData([{ id: '1' }], { sortBy, sortOrder }) });
			await waitFor(() => {
				if (!colRef.handleSort) throw new Error('handleSort not captured yet');
			});
		}

		it('sets sortBy and sortOrder=asc when clicking an unsorted column', async () => {
			await renderAndCaptureSort();
			colRef.handleSort!('question_text');
			const url = new URL(vi.mocked(goto).mock.calls[0][0] as string);
			expect(url.searchParams.get('sortBy')).toBe('question_text');
			expect(url.searchParams.get('sortOrder')).toBe('asc');
		});

		it('resets page to 1 on every sort change', async () => {
			await renderAndCaptureSort();
			colRef.handleSort!('question_text');
			const url = new URL(vi.mocked(goto).mock.calls[0][0] as string);
			expect(url.searchParams.get('page')).toBe('1');
		});

		it('toggles sortOrder from asc to desc when clicking the already-active column', async () => {
			await renderAndCaptureSort('question_text', 'asc');
			colRef.handleSort!('question_text');
			const url = new URL(vi.mocked(goto).mock.calls[0][0] as string);
			expect(url.searchParams.get('sortOrder')).toBe('desc');
		});

		it('toggles sortOrder from desc to asc when clicking the already-active column again', async () => {
			await renderAndCaptureSort('question_text', 'desc');
			colRef.handleSort!('question_text');
			const url = new URL(vi.mocked(goto).mock.calls[0][0] as string);
			expect(url.searchParams.get('sortOrder')).toBe('asc');
		});

		it('resets sortOrder to asc when switching to a different column', async () => {
			await renderAndCaptureSort('question_text', 'desc');
			colRef.handleSort!('modified_date');
			const url = new URL(vi.mocked(goto).mock.calls[0][0] as string);
			expect(url.searchParams.get('sortBy')).toBe('modified_date');
			expect(url.searchParams.get('sortOrder')).toBe('asc');
		});

		it('calls goto with replaceState: false', async () => {
			await renderAndCaptureSort();
			colRef.handleSort!('question_text');
			expect(goto).toHaveBeenCalledWith(expect.any(String), { replaceState: false });
		});

		it('calls goto exactly once per sort action', async () => {
			await renderAndCaptureSort();
			colRef.handleSort!('question_text');
			expect(goto).toHaveBeenCalledOnce();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Selection and batch actions', () => {
		async function renderWithItems() {
			render(QuestionListingPage, { data: baseData([{ id: '1' }, { id: '2' }]) });
			await waitFor(() => {
				if (!dtRef.props) throw new Error('DataTable props not captured yet');
				if (!batchToolbarRef.props) throw new Error('BatchActionsToolbar props not captured yet');
			});
		}

		it('updates the hidden questionIds input when selection changes', async () => {
			await renderWithItems();
			dtRef.props.onSelectionChange([{ id: '1' }, { id: '2' }], ['1', '2']);

			await waitFor(() => {
				const hiddenInput = document.querySelector(
					'#batch-delete-form input[name="questionIds"]'
				) as HTMLInputElement;
				expect(hiddenInput.value).toBe(JSON.stringify(['1', '2']));
			});
		});

		it('passes the selected count through to the batch toolbar', async () => {
			await renderWithItems();
			dtRef.props.onSelectionChange([{ id: '1' }], ['1']);

			await waitFor(() => {
				expect(batchToolbarRef.props.selectedCount).toBe(1);
			});
		});

		it('passes the selected rows and row ids through to the batch toolbar', async () => {
			await renderWithItems();
			dtRef.props.onSelectionChange([{ id: '1' }], ['1']);

			await waitFor(() => {
				expect(batchToolbarRef.props.selectedRows).toEqual([{ id: '1' }]);
				expect(batchToolbarRef.props.selectedRowIds).toEqual(['1']);
			});
		});

		it('enables batch delete mode (DeleteDialog) when the "delete" batch action is triggered', async () => {
			await renderWithItems();
			dtRef.props.onSelectionChange([{ id: '1' }], ['1']);
			await waitFor(() => expect(batchToolbarRef.props.selectedCount).toBe(1));

			batchToolbarRef.props.onAction('delete');

			await waitFor(() => {
				expect(deleteDialogRef.props.batchMode).toBe(true);
			});
		});

		it('passes selectedCount and selectedItems to DeleteDialog in batch mode', async () => {
			await renderWithItems();
			dtRef.props.onSelectionChange([{ id: '1' }, { id: '2' }], ['1', '2']);
			await waitFor(() => expect(batchToolbarRef.props.selectedCount).toBe(2));

			batchToolbarRef.props.onAction('delete');

			await waitFor(() => {
				expect(deleteDialogRef.props.selectedCount).toBe(2);
				expect(deleteDialogRef.props.selectedItems).toEqual([{ id: '1' }, { id: '2' }]);
			});
		});

		it('submits the hidden batch-delete form when batch delete is confirmed', async () => {
			const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
			const requestSubmitSpy = vi.fn();
			HTMLFormElement.prototype.requestSubmit = requestSubmitSpy;
			try {
				await renderWithItems();
				dtRef.props.onSelectionChange([{ id: '1' }], ['1']);
				await waitFor(() => expect(batchToolbarRef.props.selectedCount).toBe(1));
				batchToolbarRef.props.onAction('delete');
				await waitFor(() => expect(deleteDialogRef.props.batchMode).toBe(true));

				deleteDialogRef.props.onBatchConfirm();

				expect(requestSubmitSpy).toHaveBeenCalledOnce();
			} finally {
				HTMLFormElement.prototype.requestSubmit = originalRequestSubmit;
			}
		});

		it('cancelling the batch delete dialog turns off batch delete mode', async () => {
			await renderWithItems();
			dtRef.props.onSelectionChange([{ id: '1' }], ['1']);
			await waitFor(() => expect(batchToolbarRef.props.selectedCount).toBe(1));
			batchToolbarRef.props.onAction('delete');
			await waitFor(() => expect(deleteDialogRef.props.batchMode).toBe(true));

			deleteDialogRef.props.onBatchCancel();

			await waitFor(() => {
				expect(deleteDialogRef.props.batchMode).toBe(false);
			});
		});

		it('clearing the selection resets selectedCount and batch delete mode', async () => {
			await renderWithItems();
			dtRef.props.onSelectionChange([{ id: '1' }], ['1']);
			await waitFor(() => expect(batchToolbarRef.props.selectedCount).toBe(1));
			batchToolbarRef.props.onAction('delete');
			await waitFor(() => expect(deleteDialogRef.props.batchMode).toBe(true));

			batchToolbarRef.props.onClearSelection();

			await waitFor(() => {
				expect(batchToolbarRef.props.selectedCount).toBe(0);
				expect(deleteDialogRef.props.batchMode).toBe(false);
			});
		});

		it('briefly sets clearSelection on the table when clearing selection, then resets it', async () => {
			await renderWithItems();
			dtRef.props.onSelectionChange([{ id: '1' }], ['1']);
			await waitFor(() => expect(batchToolbarRef.props.selectedCount).toBe(1));

			vi.useFakeTimers();
			try {
				batchToolbarRef.props.onClearSelection();
				expect(dtRef.props.clearSelection).toBe(true);

				vi.advanceTimersByTime(0);
				expect(dtRef.props.clearSelection).toBe(false);
			} finally {
				vi.useRealTimers();
			}
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Batch delete form (use:enhance)', () => {
		it('calls invalidateAll after a successful batch delete submission', async () => {
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			await waitFor(() => {
				if (!enhanceRef.submitFactory) throw new Error('enhance submit function not captured yet');
			});

			const submitHandler = enhanceRef.submitFactory!();
			await submitHandler({ result: { type: 'success' } });

			expect(invalidateAll).toHaveBeenCalled();
		});

		it('logs an error to the console when batch delete fails', async () => {
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			await waitFor(() => {
				if (!enhanceRef.submitFactory) throw new Error('enhance submit function not captured yet');
			});

			const submitHandler = enhanceRef.submitFactory!();
			await submitHandler({ result: { type: 'failure' } });

			expect(errorSpy).toHaveBeenCalledWith('Batch delete failed');
			errorSpy.mockRestore();
		});

	});

	// ────────────────────────────────────────────────────────────────────────
	describe('DataTable prop wiring', () => {
		it('passes pagination and data props derived from data.questions/data.params', async () => {
			const items = [{ id: '1' }, { id: '2' }];
			render(QuestionListingPage, {
				data: {
					questions: { items, total: 42, pages: 5 },
					params: { page: 3, size: 10, search: '', sortBy: '', sortOrder: 'asc' },
					user: { id: 1, permissions: [] }
				}
			});

			await waitFor(() => {
				if (!dtRef.props) throw new Error('DataTable props not captured yet');
			});

			expect(dtRef.props.data).toEqual(items);
			expect(dtRef.props.totalItems).toBe(42);
			expect(dtRef.props.totalPages).toBe(5);
			expect(dtRef.props.currentPage).toBe(3);
			expect(dtRef.props.pageSize).toBe(10);
		});

		it('falls back to DEFAULT_PAGE_SIZE when params.size is not provided', async () => {
			render(QuestionListingPage, {
				data: {
					questions: { items: [{ id: '1' }], total: 1, pages: 1 },
					params: { page: 1, search: '', sortBy: '', sortOrder: 'asc' },
					user: { id: 1, permissions: [] }
				}
			});

			await waitFor(() => {
				if (!dtRef.props) throw new Error('DataTable props not captured yet');
			});

			expect(dtRef.props.pageSize).toBe(25);
		});

		it('derives row ids from row.id via getRowId', async () => {
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			await waitFor(() => {
				if (!dtRef.props) throw new Error('DataTable props not captured yet');
			});

			expect(dtRef.props.getRowId({ id: '99' })).toBe('99');
		});

		it('passes enableSelection=true to the table when items are present', async () => {
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			await waitFor(() => {
				if (!dtRef.props) throw new Error('DataTable props not captured yet');
			});

			expect(dtRef.props.enableSelection).toBe(true);
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Filter components', () => {
		it('renders the search input reflecting the current search param', () => {
			render(QuestionListingPage, {
				data: baseData([{ id: '1' }], { search: 'photosynthesis' })
			});
			expect(screen.getByPlaceholderText('Search questions')).toHaveValue('photosynthesis');
		});

		it('renders the TagTypeSelection filter', () => {
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(mockTagTypeSelection).toHaveBeenCalled();
		});

		it('renders the TagsSelection filter', () => {
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(mockTagsSelection).toHaveBeenCalled();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Custom nomenclature labels', () => {
		it('renders custom page title when question_bank is overridden', () => {
			setCustomNomenclature({ question_bank: 'Knowledge Base' });
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
			expect(screen.queryByText('Question Bank')).not.toBeInTheDocument();
		});

		it('falls back to default "Question Bank" when no custom nomenclature is set', () => {
			render(QuestionListingPage, { data: baseData([{ id: '1' }]) });
			expect(screen.getByText('Question Bank')).toBeInTheDocument();
		});
	});
});
