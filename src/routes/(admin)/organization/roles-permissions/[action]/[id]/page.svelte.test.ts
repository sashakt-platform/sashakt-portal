import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import EditRolePage from './+page.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => ({ destroy: vi.fn() }))
}));

const mockPermissionCatalog = [
	{ id: 1, name: 'create_test', description: null, is_active: true },
	{ id: 2, name: 'read_test', description: null, is_active: true },
	{ id: 3, name: 'update_test', description: null, is_active: true },
	{ id: 4, name: 'read_candidate', description: null, is_active: true }
];

function makeData(overrides: Record<string, unknown> = {}) {
	return {
		role: {
			id: 2,
			organization_id: 10,
			name: 'test_admin',
			label: 'Test Admin',
			description: 'Test Admin role',
			is_active: true,
			permissions: [2]
		},
		permissionCatalog: mockPermissionCatalog,
		...overrides
	};
}

function getHiddenPermissionValues(container: HTMLElement) {
	return Array.from(container.querySelectorAll('input[name="permissions"]'))
		.map((el) => (el as HTMLInputElement).value)
		.sort();
}

describe('Edit Role Page (+page.svelte)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Page structure', () => {
		it('renders "Edit <role label>" as the heading', () => {
			render(EditRolePage, { data: makeData() } as never);
			expect(screen.getByRole('heading', { name: 'Edit Test Admin' })).toBeInTheDocument();
		});

		it('renders a back link pointing to the roles and permission list', () => {
			render(EditRolePage, { data: makeData() } as never);
			const backLink = screen.getByRole('link', { name: /back to roles and permission/i });
			expect(backLink).toHaveAttribute('href', '/organization/roles-permissions');
		});

		it('form posts to the "save" named action', () => {
			const { container } = render(EditRolePage, { data: makeData() } as never);
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
			expect(form).toHaveAttribute('action', '?/save');
		});
	});

	describe('Hidden role fields', () => {
		it('mirrors the role name, label, description and is_active as hidden inputs', () => {
			const { container } = render(EditRolePage, { data: makeData() } as never);
			expect(container.querySelector('input[name="name"]')).toHaveValue('test_admin');
			expect(container.querySelector('input[name="label"]')).toHaveValue('Test Admin');
			expect(container.querySelector('input[name="description"]')).toHaveValue('Test Admin role');
			expect(container.querySelector('input[name="is_active"]')).toHaveValue('true');
		});

		it("starts with hidden permission inputs matching the role's current permissions", () => {
			const { container } = render(EditRolePage, { data: makeData() } as never);
			expect(getHiddenPermissionValues(container)).toEqual(['2']);
		});
	});

	describe('Permissions matrix', () => {
		it('groups permissions by resource and renders humanized module labels', () => {
			render(EditRolePage, { data: makeData() } as never);
			expect(screen.getAllByText('Test').length).toBeGreaterThanOrEqual(1);
			expect(screen.getAllByText('Candidate').length).toBeGreaterThanOrEqual(1);
		});

		it('shows a dash for actions that have no matching permission', () => {
			render(EditRolePage, { data: makeData() } as never);
			expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4);
		});

		it('checks the switch for a permission the role already has', () => {
			render(EditRolePage, { data: makeData() } as never);
			const switches = screen.getAllByRole('switch');
			const checked = switches.filter((el) => el.getAttribute('data-state') === 'checked');
			expect(checked).toHaveLength(1);
		});

		it('toggling a switch updates the hidden permission inputs', async () => {
			const { container } = render(EditRolePage, { data: makeData() } as never);
			const switches = screen.getAllByRole('switch');

			await fireEvent.click(switches[0]);

			expect(getHiddenPermissionValues(container).length).toBeGreaterThan(1);
		});

		it('toggling an already-selected permission off removes its hidden input', async () => {
			const { container } = render(EditRolePage, { data: makeData() } as never);
			const switches = screen.getAllByRole('switch');
			const checkedSwitch = switches.find((el) => el.getAttribute('data-state') === 'checked')!;

			await fireEvent.click(checkedSwitch);

			expect(getHiddenPermissionValues(container)).toEqual([]);
		});

		it('shows the fallback message when the permission catalog is empty', () => {
			render(EditRolePage, { data: makeData({ permissionCatalog: [] }) } as never);
			expect(screen.getByText(/permission catalog couldn't be loaded/i)).toBeInTheDocument();
			expect(screen.queryByRole('switch')).not.toBeInTheDocument();
		});
	});

	describe('Footer actions', () => {
		it('disables Save when nothing has been modified', () => {
			render(EditRolePage, { data: makeData() } as never);
			expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
		});

		it('enables Save once a permission is toggled', async () => {
			render(EditRolePage, { data: makeData() } as never);
			const switches = screen.getAllByRole('switch');

			await fireEvent.click(switches[0]);

			expect(screen.getByRole('button', { name: /^save$/i })).toBeEnabled();
		});

		it('renders a Cancel link back to the roles and permission list', () => {
			render(EditRolePage, { data: makeData() } as never);
			const cancelLink = screen.getByRole('button', { name: /cancel/i }).closest('a');
			expect(cancelLink).toHaveAttribute('href', '/organization/roles-permissions');
		});
	});
});
