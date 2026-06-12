import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import { page } from '$app/state';
import { goto } from '$app/navigation';
import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';
import EntityRecordList from './EntityRecordList.svelte';

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/entity/view/42') }
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));

vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => () => {})
}));

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

vi.mock('$lib/utils/permissions.js', () => ({
	canCreate: vi.fn(() => false),
	canUpdate: vi.fn(() => false),
	canDelete: vi.fn(() => false)
}));

vi.mock('$lib/components/data-table/BatchActionsToolbar.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }))
}));

vi.mock('$lib/components/DeleteDialog.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }))
}));

vi.mock('$lib/components/data-table', () => ({
	DataTable: vi.fn((_, props: any) => void props?.columns)
}));

const colRef = vi.hoisted(() => ({
	handleSort: null as ((col: string) => void) | null,
	enableSelection: undefined as boolean | undefined,
	permissions: undefined as { canEdit?: boolean; canDelete?: boolean } | undefined
}));

vi.mock('./entity-columns', () => ({
	createEntityColumns: vi.fn((...args: unknown[]) => {
		colRef.handleSort = args[3] as (col: string) => void;
		colRef.enableSelection = args[4] as boolean;
		colRef.permissions = args[5] as { canEdit?: boolean; canDelete?: boolean };
		return [];
	})
}));

const sampleItems = [
	{ id: 1, name: 'Kokan SHG', modified_date: '2026-06-01', state: null, district: null, block: null },
	{ id: 2, name: 'Pune SHG', modified_date: '2026-06-02', state: null, district: null, block: null }
];

function makeData(
	items: any[] = [],
	params: Partial<{ search: string; isActive: string; sortBy: string; sortOrder: string }> = {},
	entityType: { name: string } | null = { name: 'SHG' },
	entityTypeId = '42'
) {
	return {
		entities: { items, total: items.length, pages: items.length > 0 ? 1 : 0 },
		totalPages: items.length > 0 ? 1 : 0,
		params: {
			page: 1,
			size: 25,
			search: '',
			sortBy: '',
			sortOrder: 'asc',
			isActive: '',
			...params
		},
		entityType,
		entityTypeId,
		user: { id: 1, permissions: [] }
	};
}

describe('EntityRecordList', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(page as any).url = new URL('http://localhost/entity/view/42');
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Page title', () => {
		it('shows the entity type name as the title', () => {
			render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(screen.getByText('SHG')).toBeInTheDocument();
		});

		it('falls back to "Entity" when entityType is null', () => {
			render(EntityRecordList, { data: makeData(sampleItems, {}, null) } as any);
			expect(screen.getByText('Entity')).toBeInTheDocument();
		});

		it('uses the entity type name from data', () => {
			render(EntityRecordList, { data: makeData(sampleItems, {}, { name: 'CLF' }) } as any);
			expect(screen.getByText('CLF')).toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Add Record button', () => {
		it('shows the add button when user has create permission', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(screen.getByRole('link', { name: /add shg record/i })).toBeInTheDocument();
		});

		it('does NOT show the add button when user lacks create permission', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(screen.queryByRole('link', { name: /add.*record/i })).not.toBeInTheDocument();
		});

		it('add button links to /entity/view/{entityTypeId}/add/new', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(screen.getByRole('link', { name: /add shg record/i })).toHaveAttribute(
				'href',
				'/entity/view/42/add/new'
			);
		});

		it('add button label uses the entity type name', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(EntityRecordList, {
				data: makeData(sampleItems, {}, { name: 'CLF' }, '99')
			} as any);
			expect(screen.getByRole('link', { name: /add clf record/i })).toBeInTheDocument();
		});

		it('add button uses the correct entityTypeId in the href', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(EntityRecordList, {
				data: makeData(sampleItems, {}, { name: 'SHG' }, '99')
			} as any);
			expect(screen.getByRole('link', { name: /add shg record/i })).toHaveAttribute(
				'href',
				'/entity/view/99/add/new'
			);
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Search input', () => {
		it('renders the search input with placeholder "Search records..."', () => {
			render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(screen.getByPlaceholderText('Search records...')).toBeInTheDocument();
		});

		it('reflects the current search value from params', () => {
			render(EntityRecordList, { data: makeData(sampleItems, { search: 'Kokan' }) } as any);
			expect(screen.getByPlaceholderText('Search records...')).toHaveValue('Kokan');
		});

		it('shows an empty value when no search is active', () => {
			render(EntityRecordList, { data: makeData(sampleItems, { search: '' }) } as any);
			expect(screen.getByPlaceholderText('Search records...')).toHaveValue('');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Status filter', () => {
		it('renders "Status" button when no filter is active', () => {
			render(EntityRecordList, { data: makeData(sampleItems, { isActive: '' }) } as any);
			expect(screen.getByRole('button', { name: /status/i })).toBeInTheDocument();
		});

		it('renders "Active" label when isActive is "true"', () => {
			render(EntityRecordList, { data: makeData(sampleItems, { isActive: 'true' }) } as any);
			expect(screen.getByRole('button', { name: /active/i })).toBeInTheDocument();
		});

		it('renders "Inactive" label when isActive is "false"', () => {
			render(EntityRecordList, { data: makeData(sampleItems, { isActive: 'false' }) } as any);
			expect(screen.getByRole('button', { name: /inactive/i })).toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Batch delete form', () => {
		it('renders the hidden batch delete form', () => {
			const { container } = render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(container.querySelector('#batch-delete-records-form')).toBeInTheDocument();
		});

		it('form has method POST', () => {
			const { container } = render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(container.querySelector('#batch-delete-records-form')).toHaveAttribute(
				'method',
				'POST'
			);
		});

		it('form has action ?/batchDeleteRecords', () => {
			const { container } = render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(container.querySelector('#batch-delete-records-form')).toHaveAttribute(
				'action',
				'?/batchDeleteRecords'
			);
		});

		it('form contains a hidden input for entityRecordIds', () => {
			const { container } = render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(
				container.querySelector('input[name="entityRecordIds"]')
			).toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('enableSelection passed to columns', () => {
		it('passes enableSelection=true when items exist', () => {
			render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(colRef.enableSelection).toBe(true);
		});

		it('passes enableSelection=false when no items', () => {
			render(EntityRecordList, { data: makeData([]) } as any);
			expect(colRef.enableSelection).toBe(false);
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Permissions passed to columns', () => {
		it('passes canEdit=true when user has update permission', () => {
			vi.mocked(canUpdate).mockReturnValue(true);
			render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(colRef.permissions?.canEdit).toBe(true);
		});

		it('passes canEdit=false when user lacks update permission', () => {
			vi.mocked(canUpdate).mockReturnValue(false);
			render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(colRef.permissions?.canEdit).toBe(false);
		});

		it('passes canDelete=true when user has delete permission', () => {
			vi.mocked(canDelete).mockReturnValue(true);
			render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(colRef.permissions?.canDelete).toBe(true);
		});

		it('passes canDelete=false when user lacks delete permission', () => {
			vi.mocked(canDelete).mockReturnValue(false);
			render(EntityRecordList, { data: makeData(sampleItems) } as any);
			expect(colRef.permissions?.canDelete).toBe(false);
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Sorting (handleSort)', () => {
		async function renderAndCaptureSort(sortByParam = '', sortOrderParam = 'asc') {
			colRef.handleSort = null;
			render(EntityRecordList, {
				data: makeData(sampleItems, { sortBy: sortByParam, sortOrder: sortOrderParam })
			} as any);
			await waitFor(() => {
				if (!colRef.handleSort) throw new Error('handleSort not captured');
			});
		}

		function parsedGotoUrl(): URLSearchParams {
			const [calledPath] = vi.mocked(goto).mock.calls[0] as [string, unknown];
			return new URL('http://localhost' + calledPath).searchParams;
		}

		it('sets sortBy to the clicked column', async () => {
			await renderAndCaptureSort();
			colRef.handleSort!('name');
			expect(parsedGotoUrl().get('sortBy')).toBe('name');
		});

		it('defaults sortOrder to asc when sorting a new column', async () => {
			await renderAndCaptureSort('', 'asc');
			colRef.handleSort!('name');
			expect(parsedGotoUrl().get('sortOrder')).toBe('asc');
		});

		it('toggles sortOrder to desc when clicking the already-sorted-asc column', async () => {
			await renderAndCaptureSort('name', 'asc');
			colRef.handleSort!('name');
			expect(parsedGotoUrl().get('sortOrder')).toBe('desc');
		});

		it('toggles sortOrder back to asc when clicking the already-sorted-desc column', async () => {
			await renderAndCaptureSort('name', 'desc');
			colRef.handleSort!('name');
			expect(parsedGotoUrl().get('sortOrder')).toBe('asc');
		});

		it('resets page to 1 on every sort', async () => {
			await renderAndCaptureSort();
			colRef.handleSort!('name');
			expect(parsedGotoUrl().get('page')).toBe('1');
		});

		it('calls goto with replaceState: false', async () => {
			await renderAndCaptureSort();
			colRef.handleSort!('name');
			const [, opts] = vi.mocked(goto).mock.calls[0] as [string, { replaceState: boolean }];
			expect(opts.replaceState).toBe(false);
		});

		it('asc → desc does NOT toggle when a different column is clicked', async () => {
			await renderAndCaptureSort('name', 'asc');
			colRef.handleSort!('modified_date');
			expect(parsedGotoUrl().get('sortOrder')).toBe('asc');
		});
	});
});
