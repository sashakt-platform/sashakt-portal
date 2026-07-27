import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import RolesPermissionsPage from './+page.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/organization/roles-permissions') }
}));

vi.mock('$lib/utils/permissions.js', () => ({
	canUpdate: vi.fn()
}));

const mockRoles = [
	{ id: 1, label: 'Super Admin' },
	{ id: 2, label: 'System Admin' },
	{ id: 3, label: 'State Admin' }
];

function makeData(overrides: Record<string, unknown> = {}) {
	return {
		roles: mockRoles,
		user: { id: 1, organization_id: 10, permissions: [] },
		...overrides
	};
}

describe('Roles and Permission Page (+page.svelte)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const permissions = await import('$lib/utils/permissions.js');
		vi.mocked(permissions.canUpdate).mockReturnValue(true);
	});

	describe('Page structure', () => {
		it('renders the "Roles and Permission" heading', () => {
			render(RolesPermissionsPage, { data: makeData() } as never);
			expect(screen.getByRole('heading', { name: /roles and permission/i })).toBeInTheDocument();
		});
	});

	describe('Data table content', () => {
		it('renders a "Role" column header', () => {
			render(RolesPermissionsPage, { data: makeData() } as never);
			expect(screen.getByText('Role')).toBeInTheDocument();
		});

		it('renders each role name', () => {
			render(RolesPermissionsPage, { data: makeData() } as never);
			expect(screen.getByText('Super Admin')).toBeInTheDocument();
			expect(screen.getByText('System Admin')).toBeInTheDocument();
			expect(screen.getByText('State Admin')).toBeInTheDocument();
		});

		it('does not render any column other than "Role" and the row actions', () => {
			render(RolesPermissionsPage, { data: makeData() } as never);
			const headers = screen.getAllByRole('columnheader');
			expect(headers).toHaveLength(2);
			expect(headers[0]).toHaveTextContent('Role');
		});

		it('renders without crashing when the roles list is empty', () => {
			render(RolesPermissionsPage, { data: makeData({ roles: [] }) } as never);
			expect(screen.getByText(/no results/i)).toBeInTheDocument();
		});
	});

	describe('Row edit action', () => {
		it('shows an Edit action for each row when the user has update permission', async () => {
			const permissions = await import('$lib/utils/permissions.js');
			vi.mocked(permissions.canUpdate).mockReturnValue(true);

			render(RolesPermissionsPage, { data: makeData() } as never);
			expect(screen.getAllByText('Edit')).toHaveLength(mockRoles.length);
		});

		it('links the Edit action to the [action]/[id] edit route for that role', async () => {
			const permissions = await import('$lib/utils/permissions.js');
			vi.mocked(permissions.canUpdate).mockReturnValue(true);

			render(RolesPermissionsPage, { data: makeData() } as never);
			const links = screen.getAllByText('Edit').map((el) => el.closest('a'));
			expect(links[0]).toHaveAttribute('href', '/organization/roles-permissions/edit/1');
			expect(links[1]).toHaveAttribute('href', '/organization/roles-permissions/edit/2');
			expect(links[2]).toHaveAttribute('href', '/organization/roles-permissions/edit/3');
		});

		it('hides the Edit action for each row when the user lacks update permission', async () => {
			const permissions = await import('$lib/utils/permissions.js');
			vi.mocked(permissions.canUpdate).mockReturnValue(false);

			render(RolesPermissionsPage, { data: makeData() } as never);
			expect(screen.queryByText('Edit')).not.toBeInTheDocument();
		});
	});
});
