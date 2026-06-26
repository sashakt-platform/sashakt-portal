import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import UsersListingPage from './+page.svelte';
import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { setCustomNomenclature, resetNomenclature } from '$lib/test-utils/nomenclature-mock';

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/users')
	}
}));

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => () => {})
}));

vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

vi.mock('$lib/utils/permissions.js', () => ({
	canCreate: vi.fn(() => false),
	canUpdate: vi.fn(() => false),
	canDelete: vi.fn(() => false)
}));

vi.mock('$lib/nomenclature', async () => {
	const { createNomenclatureMock } = await import('$lib/test-utils/nomenclature-mock');
	return createNomenclatureMock();
});

vi.mock('$lib/components/data-table/BatchActionsToolbar.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }))
}));

const sampleUsers = [
	{
		id: 1,
		full_name: 'Alice Smith',
		email: 'alice@example.com',
		phone: '1111111111',
		role_label: 'Admin',
		modified_date: '2026-06-01'
	},
	{
		id: 2,
		full_name: 'Bob Jones',
		email: 'bob@example.com',
		phone: '2222222222',
		role_label: 'Viewer',
		modified_date: '2026-06-02'
	}
];

function makeData(
	items: any[] = sampleUsers,
	params: Partial<{
		search: string;
		sortBy: string;
		sortOrder: string;
		page: number;
		size: number;
	}> = {}
) {
	return {
		users: { items, total: items.length, pages: items.length > 0 ? 1 : 0 },
		totalPages: items.length > 0 ? 1 : 0,
		params: {
			page: 1,
			size: 25,
			search: '',
			sortBy: '',
			sortOrder: 'asc',
			...params
		},
		user: { id: 1, permissions: [] }
	};
}

describe('Users Listing Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(page as any).url = new URL('http://localhost/users');
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Page title', () => {
		it('renders "Users" as the page title', () => {
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByText('Users')).toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Create button', () => {
		it('shows "Create user" button when user has create permission', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByRole('link', { name: /create user/i })).toBeInTheDocument();
		});

		it('does not show "Create user" button when user lacks permission', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.queryByRole('link', { name: /create user/i })).not.toBeInTheDocument();
		});

		it('create button links to /users/add/new', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(UsersListingPage, { data: makeData() } as any);
			const link = screen.getByRole('link', { name: /create user/i });
			expect(link).toHaveAttribute('href', '/users/add/new');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Search input', () => {
		it('renders search input with correct placeholder', () => {
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
		});

		it('reflects the current search value from params', () => {
			render(UsersListingPage, { data: makeData(sampleUsers, { search: 'Alice' }) } as any);
			expect(screen.getByPlaceholderText('Search users...')).toHaveValue('Alice');
		});

		it('shows empty value when search param is empty', () => {
			render(UsersListingPage, { data: makeData(sampleUsers, { search: '' }) } as any);
			expect(screen.getByPlaceholderText('Search users...')).toHaveValue('');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Table data', () => {
		it('renders user full names', () => {
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByText('Alice Smith')).toBeInTheDocument();
			expect(screen.getByText('Bob Jones')).toBeInTheDocument();
		});

		it('renders user emails', () => {
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByText('alice@example.com')).toBeInTheDocument();
			expect(screen.getByText('bob@example.com')).toBeInTheDocument();
		});

		it('renders user phone numbers', () => {
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByText('1111111111')).toBeInTheDocument();
			expect(screen.getByText('2222222222')).toBeInTheDocument();
		});

		it('renders user role labels', () => {
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByText('Admin')).toBeInTheDocument();
			expect(screen.getByText('Viewer')).toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Sorting', () => {
		it('calls goto with sortBy=full_name when Name column header is clicked', async () => {
			render(UsersListingPage, { data: makeData() } as any);
			const nameHeader = screen.getByText('Name').closest('button');
			expect(nameHeader).toBeTruthy();
			await fireEvent.click(nameHeader!);
			expect(goto).toHaveBeenCalled();
			const calledUrl = vi.mocked(goto).mock.calls[0][0].toString();
			expect(calledUrl).toContain('sortBy=full_name');
			expect(calledUrl).toContain('sortOrder=asc');
			expect(calledUrl).toContain('page=1');
		});

		it('toggles sort order to desc when same sorted column is clicked again', async () => {
			render(UsersListingPage, {
				data: makeData(sampleUsers, { sortBy: 'full_name', sortOrder: 'asc' })
			} as any);
			const nameHeader = screen.getByText('Name').closest('button');
			await fireEvent.click(nameHeader!);
			const calledUrl = vi.mocked(goto).mock.calls[0][0].toString();
			expect(calledUrl).toContain('sortOrder=desc');
		});

		it('calls goto with sortBy=email when Email column header is clicked', async () => {
			render(UsersListingPage, { data: makeData() } as any);
			const emailHeader = screen.getByText('Email').closest('button');
			expect(emailHeader).toBeTruthy();
			await fireEvent.click(emailHeader!);
			expect(goto).toHaveBeenCalled();
			const calledUrl = vi.mocked(goto).mock.calls[0][0].toString();
			expect(calledUrl).toContain('sortBy=email');
		});

		it('calls goto with sortBy=role_label when Role column header is clicked', async () => {
			render(UsersListingPage, { data: makeData() } as any);
			const roleHeader = screen.getByText('Role').closest('button');
			expect(roleHeader).toBeTruthy();
			await fireEvent.click(roleHeader!);
			expect(goto).toHaveBeenCalled();
			const calledUrl = vi.mocked(goto).mock.calls[0][0].toString();
			expect(calledUrl).toContain('sortBy=role_label');
		});

		it('resets to page 1 when sort column changes', async () => {
			render(UsersListingPage, { data: makeData(sampleUsers, { page: 5 }) } as any);
			const nameHeader = screen.getByText('Name').closest('button');
			await fireEvent.click(nameHeader!);
			const calledUrl = vi.mocked(goto).mock.calls[0][0].toString();
			expect(calledUrl).toContain('page=1');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Empty state', () => {
		it('renders without error when users list is empty', () => {
			render(UsersListingPage, { data: makeData([]) } as any);
			expect(screen.getByText('Users')).toBeInTheDocument();
		});

		it('does not show user data when items list is empty', () => {
			render(UsersListingPage, { data: makeData([]) } as any);
			expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Batch delete hidden form', () => {
		it('renders the hidden batch-delete-users-form in the DOM', () => {
			render(UsersListingPage, { data: makeData() } as any);
			const form = document.getElementById('batch-delete-users-form');
			expect(form).toBeInTheDocument();
		});

		it('batch-delete-users-form targets the batchDelete action', () => {
			render(UsersListingPage, { data: makeData() } as any);
			const form = document.getElementById('batch-delete-users-form') as HTMLFormElement;
			expect(form.getAttribute('action')).toBe('?/batchDelete');
			expect(form.getAttribute('method')).toBe('POST');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Pagination', () => {
		it('shows Previous and Next pagination buttons', () => {
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByText('Previous')).toBeInTheDocument();
			expect(screen.getByText('Next')).toBeInTheDocument();
		});

		it('disables Previous button on the first page', () => {
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByText('Previous')).toBeDisabled();
		});

		it('shows rows info text', () => {
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByText(/Showing 1 to/)).toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Column permissions', () => {
		it('passes canEdit=true to columns when user has update permission', () => {
			vi.mocked(canUpdate).mockReturnValue(true);
			render(UsersListingPage, { data: makeData() } as any);
			expect(canUpdate).toHaveBeenCalledWith(expect.anything(), 'user');
		});

		it('passes canDelete=true to columns when user has delete permission', () => {
			vi.mocked(canDelete).mockReturnValue(true);
			render(UsersListingPage, { data: makeData() } as any);
			expect(canDelete).toHaveBeenCalledWith(expect.anything(), 'user');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Custom nomenclature labels', () => {
		afterEach(() => {
			resetNomenclature();
		});

		it('renders custom page title when nomenclature overrides users', () => {
			setCustomNomenclature({ users: 'Members', user: 'Member' });
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByText('Members')).toBeInTheDocument();
			expect(screen.queryByText('Users')).not.toBeInTheDocument();
		});

		it('renders custom create button label', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			setCustomNomenclature({ user: 'Participant' });
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByRole('link', { name: /create participant/i })).toBeInTheDocument();
		});

		it('renders custom search placeholder', () => {
			setCustomNomenclature({ users: 'Learners' });
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByPlaceholderText('Search learners...')).toBeInTheDocument();
		});

		it('applies multiple custom nomenclature overrides together', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			setCustomNomenclature({ users: 'Participants', user: 'Participant' });
			render(UsersListingPage, { data: makeData() } as any);
			expect(screen.getByText('Participants')).toBeInTheDocument();
			expect(screen.getByRole('link', { name: /create participant/i })).toBeInTheDocument();
			expect(screen.getByPlaceholderText('Search participants...')).toBeInTheDocument();
		});
	});
});
