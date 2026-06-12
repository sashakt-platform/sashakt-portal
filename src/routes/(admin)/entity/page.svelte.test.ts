import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen,  } from '@testing-library/svelte';
import EntityListingPage from './+page.svelte';
import { canCreate, } from '$lib/utils/permissions.js';

import { page } from '$app/state';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/entity')
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
	params: Partial<{ search: string; isActive: string; sortBy: string; sortOrder: string }> = {}
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
		user: { id: 1, permissions: [] }
	};
}

const sampleItems = [
	{ id: 1, name: 'CLF', description: 'Community Level Federation', modified_date: '2026-06-01', total_records: 5 },
	{ id: 2, name: 'SHG', description: 'Self Help Group', modified_date: '2026-06-02', total_records: 3 }
];

describe('Entity Listing Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(page as any).url = new URL('http://localhost/entity');
	});

	
	describe('Page title', () => {
		it('renders "Entities" as the page title', () => {
			render(EntityListingPage, { data: makeData(sampleItems) } as any);
			expect(screen.getByText('Entities')).toBeInTheDocument();
		});
	});


	describe('Empty state', () => {
		it('shows empty state heading when no items, no search, and no status filter', () => {
			render(EntityListingPage, { data: makeData([]) } as any);
			expect(screen.getByText('No entities yet')).toBeInTheDocument();
		});

		it('shows descriptive text in the empty state', () => {
			render(EntityListingPage, { data: makeData([]) } as any);
			expect(screen.getByText(/Create your first entity/i)).toBeInTheDocument();
		});

		it('shows "Create Entity" button inside empty state when user has create permission', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(EntityListingPage, { data: makeData([]) } as any);
			expect(screen.getAllByRole('link', { name: /create entity/i }).length).toBeGreaterThan(0);
		});

		it('does not show create button inside empty state when user lacks create permission', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(EntityListingPage, { data: makeData([]) } as any);
			expect(screen.queryByRole('link', { name: /create entity/i })).not.toBeInTheDocument();
		});

		it('does not show empty state when items exist', () => {
			render(EntityListingPage, { data: makeData(sampleItems) } as any);
			expect(screen.queryByText('No entities yet')).not.toBeInTheDocument();
		});

		it('does not show empty state when search is set even with 0 results', () => {
			render(EntityListingPage, { data: makeData([], { search: 'xyz' }) } as any);
			expect(screen.queryByText('No entities yet')).not.toBeInTheDocument();
		});

		it('does not show empty state when isActive filter is set even with 0 results', () => {
			render(EntityListingPage, { data: makeData([], { isActive: 'true' }) } as any);
			expect(screen.queryByText('No entities yet')).not.toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Create button (header)', () => {
		it('shows "Create Entity" header button when user has permission and items exist', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(EntityListingPage, { data: makeData(sampleItems) } as any);
			expect(screen.getByRole('link', { name: /create entity/i })).toBeInTheDocument();
		});

		it('does not show "Create Entity" header button when user lacks permission', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(EntityListingPage, { data: makeData(sampleItems) } as any);
			expect(screen.queryByRole('link', { name: /create entity/i })).not.toBeInTheDocument();
		});

		it('create button links to /entity/add/new', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(EntityListingPage, { data: makeData(sampleItems) } as any);
			const link = screen.getByRole('link', { name: /create entity/i });
			expect(link).toHaveAttribute('href', '/entity/add/new');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Search input', () => {
		it('renders search input with placeholder "Search entities..."', () => {
			render(EntityListingPage, { data: makeData(sampleItems) } as any);
			expect(screen.getByPlaceholderText('Search entities...')).toBeInTheDocument();
		});

		it('reflects the current search value from params', () => {
			render(EntityListingPage, { data: makeData(sampleItems, { search: 'CLF' }) } as any);
			expect(screen.getByPlaceholderText('Search entities...')).toHaveValue('CLF');
		});

		it('shows empty value when search param is empty', () => {
			render(EntityListingPage, { data: makeData(sampleItems, { search: '' }) } as any);
			expect(screen.getByPlaceholderText('Search entities...')).toHaveValue('');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Status filter', () => {
		it('renders a "Status" button when no filter is active', () => {
			render(EntityListingPage, { data: makeData(sampleItems, { isActive: '' }) } as any);
			expect(screen.getByRole('button', { name: /status/i })).toBeInTheDocument();
		});

		it('renders "Active" label when isActive is "true"', () => {
			render(EntityListingPage, { data: makeData(sampleItems, { isActive: 'true' }) } as any);
			expect(screen.getByRole('button', { name: /active/i })).toBeInTheDocument();
		});

		it('renders "Inactive" label when isActive is "false"', () => {
			render(EntityListingPage, { data: makeData(sampleItems, { isActive: 'false' }) } as any);
			expect(screen.getByRole('button', { name: /inactive/i })).toBeInTheDocument();
		});
	});


	
});
