import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { vi } from 'vitest';
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

		it('does not render any column other than "Role"', () => {
			render(RolesPermissionsPage, { data: makeData() } as never);
			const headers = screen.getAllByRole('columnheader');
			expect(headers).toHaveLength(1);
			expect(headers[0]).toHaveTextContent('Role');
		});

		it('renders without crashing when the roles list is empty', () => {
			render(RolesPermissionsPage, { data: makeData({ roles: [] }) } as never);
			expect(screen.getByText(/no results/i)).toBeInTheDocument();
		});
	});
});
