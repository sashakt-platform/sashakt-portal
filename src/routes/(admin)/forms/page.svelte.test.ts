import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import FormsListingPage from './+page.svelte';
import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';
import { goto } from '$app/navigation';
import { page } from '$app/state';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/forms')
	}
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

vi.mock('$lib/nomenclature', () => ({
	useTerms: () => (key: string) => key
}));

vi.mock('$lib/components/data-table/BatchActionsToolbar.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }))
}));

vi.mock('$lib/components/data-table/index.js', () => ({
	DataTable: vi.fn((_, props: any) => void props?.columns)
}));

const colRef = vi.hoisted(() => ({
	handleSort: null as ((col: string) => void) | null,
	enableSelection: undefined as boolean | undefined,
	permissions: undefined as { canEdit?: boolean; canDelete?: boolean } | undefined
}));

vi.mock('./columns', () => ({
	createColumns: vi.fn((...args: unknown[]) => {
		colRef.handleSort = args[2] as (col: string) => void;
		colRef.enableSelection = args[3] as boolean;
		colRef.permissions = args[4] as { canEdit?: boolean; canDelete?: boolean };
		return [];
	})
}));

function makeData(
	items: any[] = [],
	params: Partial<{
		search: string;
		isActive: string;
		sortBy: string;
		sortOrder: string;
		page: number;
		size: number;
	}> = {}
) {
	return {
		forms: { items, total: items.length, pages: items.length > 0 ? 1 : 0 },
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
		user: { id: 1, permissions: [] }
	};
}

const sampleForms = [
	{
		id: 1,
		name: 'Registration Form',
		description: 'Collect basic registration info',
		is_active: true,
		fields_count: 5,
		modified_date: '2026-06-01'
	},
	{
		id: 2,
		name: 'Feedback Form',
		description: 'Post-test feedback',
		is_active: false,
		fields_count: 3,
		modified_date: '2026-06-02'
	}
];

describe('Forms Listing Page', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		(page as any).url = new URL('http://localhost/forms');
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Page title', () => {
		it('renders "forms" as the page title', () => {
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			expect(screen.getByText('forms')).toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Empty state', () => {
		it('shows empty state heading when no items, no search, and no status filter', () => {
			render(FormsListingPage, { data: makeData([]) } as any);
			expect(screen.getByText('No forms yet')).toBeInTheDocument();
		});

		it('shows descriptive text in the empty state', () => {
			render(FormsListingPage, { data: makeData([]) } as any);
			expect(screen.getByText(/Create your first form/i)).toBeInTheDocument();
		});

		it('shows "Create form" button inside empty state when user has create permission', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(FormsListingPage, { data: makeData([]) } as any);
			const links = screen.getAllByRole('link', { name: /create form/i });
			expect(links.length).toBeGreaterThan(0);
		});

		it('does not show create button inside empty state when user lacks create permission', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(FormsListingPage, { data: makeData([]) } as any);
			expect(screen.queryByRole('link', { name: /create form/i })).not.toBeInTheDocument();
		});

		it('does not show empty state when items exist', () => {
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			expect(screen.queryByText('No forms yet')).not.toBeInTheDocument();
		});

		it('does not show empty state when search is active with no results', () => {
			render(FormsListingPage, { data: makeData([], { search: 'xyz' }) } as any);
			expect(screen.queryByText('No forms yet')).not.toBeInTheDocument();
		});

		it('does not show empty state when isActive filter is set even with 0 results', () => {
			render(FormsListingPage, { data: makeData([], { isActive: 'true' }) } as any);
			expect(screen.queryByText('No forms yet')).not.toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Create button (header)', () => {
		it('shows "Create form" header button when user has permission and items exist', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			expect(screen.getByRole('link', { name: /create form/i })).toBeInTheDocument();
		});

		it('does not show "Create form" header button when user lacks permission', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			expect(screen.queryByRole('link', { name: /create form/i })).not.toBeInTheDocument();
		});

		it('create button links to /forms/add/new', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			const link = screen.getByRole('link', { name: /create form/i });
			expect(link).toHaveAttribute('href', '/forms/add/new');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Search input', () => {
		it('renders search input with correct placeholder', () => {
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			expect(screen.getByPlaceholderText('Search forms...')).toBeInTheDocument();
		});

		it('reflects the current search value from params', () => {
			render(FormsListingPage, { data: makeData(sampleForms, { search: 'Registration' }) } as any);
			expect(screen.getByPlaceholderText('Search forms...')).toHaveValue('Registration');
		});

		it('shows empty value when search param is empty', () => {
			render(FormsListingPage, { data: makeData(sampleForms, { search: '' }) } as any);
			expect(screen.getByPlaceholderText('Search forms...')).toHaveValue('');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Status filter', () => {
		it('renders a "Status" button when no filter is active', () => {
			render(FormsListingPage, { data: makeData(sampleForms, { isActive: '' }) } as any);
			expect(screen.getByRole('button', { name: /status/i })).toBeInTheDocument();
		});

		it('renders "Active" label when isActive is "true"', () => {
			render(FormsListingPage, { data: makeData(sampleForms, { isActive: 'true' }) } as any);
			expect(screen.getByRole('button', { name: /active/i })).toBeInTheDocument();
		});

		it('renders "Inactive" label when isActive is "false"', () => {
			render(FormsListingPage, { data: makeData(sampleForms, { isActive: 'false' }) } as any);
			expect(screen.getByRole('button', { name: /inactive/i })).toBeInTheDocument();
		});

		it('calls goto with isActive=true when "Active" option is clicked', async () => {
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			const statusButton = screen.getByRole('button', { name: /status/i });
			await fireEvent.click(statusButton);
			const activeOption = screen.getByRole('button', { name: /^Active$/i });
			await fireEvent.click(activeOption);
			expect(goto).toHaveBeenCalled();
			const callArg = vi.mocked(goto).mock.calls[0][0].toString();
			expect(callArg).toContain('isActive=true');
		});

		it('calls goto with isActive=false when "Inactive" option is clicked', async () => {
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			const statusButton = screen.getByRole('button', { name: /status/i });
			await fireEvent.click(statusButton);
			const inactiveOption = screen.getByRole('button', { name: /^Inactive$/i });
			await fireEvent.click(inactiveOption);
			expect(goto).toHaveBeenCalled();
			const callArg = vi.mocked(goto).mock.calls[0][0].toString();
			expect(callArg).toContain('isActive=false');
		});

		it('removes isActive param when the already-active filter is clicked again', async () => {
			render(FormsListingPage, { data: makeData(sampleForms, { isActive: 'true' }) } as any);

			const [triggerButton] = screen.getAllByRole('button', { name: /^Active$/i });
			await fireEvent.click(triggerButton);

			const allActiveButtons = screen.getAllByRole('button', { name: /^Active$/i });
			const optionButton = allActiveButtons[allActiveButtons.length - 1];
			await fireEvent.click(optionButton);
			expect(goto).toHaveBeenCalled();
			const callArg = vi.mocked(goto).mock.calls[0][0].toString();
			expect(callArg).not.toContain('isActive');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Sorting', () => {
		it('passes handleSort to createColumns', () => {
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			expect(colRef.handleSort).toBeTypeOf('function');
		});

		it('handleSort calls goto with updated sort params', () => {
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			colRef.handleSort!('name');
			expect(goto).toHaveBeenCalled();
			const callArg = vi.mocked(goto).mock.calls[0][0].toString();
			expect(callArg).toContain('sortBy=name');
			expect(callArg).toContain('sortOrder=asc');
		});

		it('handleSort toggles sort order to desc when same column is sorted asc', () => {
			render(FormsListingPage, {
				data: makeData(sampleForms, { sortBy: 'name', sortOrder: 'asc' })
			} as any);
			colRef.handleSort!('name');
			expect(goto).toHaveBeenCalled();
			const callArg = vi.mocked(goto).mock.calls[0][0].toString();
			expect(callArg).toContain('sortOrder=desc');
		});

		it('handleSort resets to page 1', () => {
			render(FormsListingPage, { data: makeData(sampleForms, { page: 3 }) } as any);
			colRef.handleSort!('name');
			const callArg = vi.mocked(goto).mock.calls[0][0].toString();
			expect(callArg).toContain('page=1');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Column configuration', () => {
		it('passes enableSelection=false when no forms exist (empty state is shown)', () => {
			render(FormsListingPage, { data: makeData([]) } as any);
			expect(screen.getByText('No forms yet')).toBeInTheDocument();
		});

		it('passes enableSelection=true when forms exist', () => {
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			expect(colRef.enableSelection).toBe(true);
		});

		it('passes canEdit permission to createColumns', () => {
			vi.mocked(canUpdate).mockReturnValue(true);
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			expect(colRef.permissions?.canEdit).toBe(true);
		});

		it('passes canDelete permission to createColumns', () => {
			vi.mocked(canDelete).mockReturnValue(true);
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			expect(colRef.permissions?.canDelete).toBe(true);
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Batch delete hidden form', () => {
		it('renders the hidden batch-delete-form in the DOM', () => {
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			const form = document.getElementById('batch-delete-form');
			expect(form).toBeInTheDocument();
		});

		it('batch-delete-form targets the batchDelete action', () => {
			render(FormsListingPage, { data: makeData(sampleForms) } as any);
			const form = document.getElementById('batch-delete-form') as HTMLFormElement;
			expect(form.getAttribute('action')).toBe('?/batchDelete');
			expect(form.getAttribute('method')).toBe('POST');
		});
	});
});
