import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import RolesPermissionsPage from './+page.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$lib/utils/permissions.js', () => ({
	canCreate: vi.fn()
}));

// Mock the matrix so this test only exercises the parent shell
vi.mock('./PermissionMatrix.svelte', () => ({
	default: function MockPermissionMatrix() {
		return { $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() };
	}
}));

function makeData(overrides: Record<string, unknown> = {}) {
	return {
		roles: [],
		permissions: [],
		user: { id: 1, permissions: [] },
		...overrides
	};
}

describe('Roles and Permissions Page (+page.svelte)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const permissions = await import('$lib/utils/permissions.js');
		vi.mocked(permissions.canCreate).mockReturnValue(false);
	});

	describe('Page structure', () => {
		it('renders the "Roles and Permission" heading', () => {
			render(RolesPermissionsPage, { data: makeData() } as never);
			expect(screen.getByRole('heading', { name: 'Roles and Permission' })).toBeInTheDocument();
		});
	});

	describe('Create Role button', () => {
		it('shows the Create Role button when the user has create permission', async () => {
			const permissions = await import('$lib/utils/permissions.js');
			vi.mocked(permissions.canCreate).mockReturnValue(true);

			render(RolesPermissionsPage, { data: makeData() } as never);
			expect(screen.getByText(/create role/i)).toBeInTheDocument();
		});

		it('hides the Create Role button when the user lacks create permission', async () => {
			const permissions = await import('$lib/utils/permissions.js');
			vi.mocked(permissions.canCreate).mockReturnValue(false);

			render(RolesPermissionsPage, { data: makeData() } as never);
			expect(screen.queryByText(/create role/i)).not.toBeInTheDocument();
		});

		it('links the Create Role button to the add route', async () => {
			const permissions = await import('$lib/utils/permissions.js');
			vi.mocked(permissions.canCreate).mockReturnValue(true);

			render(RolesPermissionsPage, { data: makeData() } as never);
			const link = screen.getByRole('link', { name: /create role/i });
			expect(link).toHaveAttribute('href', '/organization/roles-permissions/add/new');
		});

		it('checks create permission for the "role" entity', async () => {
			const permissions = await import('$lib/utils/permissions.js');
			vi.mocked(permissions.canCreate).mockReturnValue(true);

			render(RolesPermissionsPage, { data: makeData() } as never);
			expect(permissions.canCreate).toHaveBeenCalledWith(expect.anything(), 'role');
		});
	});
});
