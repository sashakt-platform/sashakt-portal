import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import RoleForm from './RoleForm.svelte';

// Popover/Command content is portaled and relies on APIs jsdom doesn't implement.
Element.prototype.scrollIntoView ??= vi.fn();
Element.prototype.hasPointerCapture ??= vi.fn(() => false);
Element.prototype.releasePointerCapture ??= vi.fn();

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('sveltekit-superforms', () => ({
	superForm: vi.fn(
		(initial: { data?: Record<string, unknown>; errors?: Record<string, unknown> } = {}) => ({
			form: writable(initial.data ?? {}),
			errors: writable(initial.errors ?? {}),
			enhance: vi.fn(() => () => {})
		})
	)
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn()
}));

type Role = { name: string; label: string };

function createData(
	overrides: {
		action?: 'add' | 'edit';
		availableRoles?: Role[];
		formData?: Record<string, unknown>;
		formErrors?: Record<string, unknown>;
	} = {}
) {
	return {
		action: overrides.action ?? 'add',
		id: 'new',
		availableRoles: overrides.availableRoles ?? [],
		form: {
			data: {
				label: '',
				description: null,
				is_active: true,
				location_scope: null,
				allowed_roles: [],
				permissions: [],
				visible_to_roles: [],
				...overrides.formData
			},
			errors: overrides.formErrors ?? {}
		}
	};
}

describe('RoleForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Header / mode', () => {
		it('shows "Create Role" heading in add mode', () => {
			render(RoleForm, { data: createData({ action: 'add' }) });
			expect(screen.getByText('Create Role')).toBeInTheDocument();
		});

		it('shows "Edit Role" heading in edit mode', () => {
			render(RoleForm, { data: createData({ action: 'edit' }) });
			expect(screen.getByText('Edit Role')).toBeInTheDocument();
		});

		it('links the back button to the roles-permissions listing', () => {
			render(RoleForm, { data: createData() });
			expect(screen.getByLabelText('Back to roles and permissions')).toHaveAttribute(
				'href',
				'/organization/roles-permissions'
			);
		});
	});

	describe('Save button', () => {
		it('is disabled when the label is empty', () => {
			render(RoleForm, { data: createData({ formData: { label: '' } }) });
			expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
		});

		it('is disabled when the label is only whitespace', () => {
			render(RoleForm, { data: createData({ formData: { label: '   ' } }) });
			expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
		});

		it('is enabled when the label has content', () => {
			render(RoleForm, { data: createData({ formData: { label: 'State Admin' } }) });
			expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
		});

		it('becomes enabled once a label is typed in', async () => {
			render(RoleForm, { data: createData({ formData: { label: '' } }) });

			const saveButton = screen.getByRole('button', { name: 'Save' });
			expect(saveButton).toBeDisabled();

			await fireEvent.input(screen.getByLabelText('Role Name'), {
				target: { value: 'District Admin' }
			});

			expect(saveButton).toBeEnabled();
		});
	});

	describe('Role Name / Description fields', () => {
		it('populates Role Name from initial data', () => {
			render(RoleForm, { data: createData({ formData: { label: 'State Admin' } }) });
			expect(screen.getByLabelText('Role Name')).toHaveValue('State Admin');
		});

		it('populates Description from initial data', () => {
			render(RoleForm, { data: createData({ formData: { description: 'Manages states' } }) });
			expect(screen.getByLabelText('Description')).toHaveValue('Manages states');
		});

		it('shows a validation error for the label field when present', () => {
			render(RoleForm, {
				data: createData({ formErrors: { label: 'Display label is required' } })
			});
			expect(screen.getByText('Display label is required')).toBeInTheDocument();
		});

		it('does not show a label error when there is none', () => {
			render(RoleForm, { data: createData() });
			expect(screen.queryByText('Display label is required')).not.toBeInTheDocument();
		});
	});

	describe('Location Scope', () => {
		it('shows "None (organization-wide)" when location_scope is null', () => {
			render(RoleForm, { data: createData({ formData: { location_scope: null } }) });
			expect(screen.getByText('None (organization-wide)')).toBeInTheDocument();
		});

		it('shows "State" when location_scope is state', () => {
			const { container } = render(RoleForm, {
				data: createData({ formData: { location_scope: 'state' } })
			});
			expect(container.querySelector('#location_scope')).toBeTruthy();
			expect(screen.getByText('State')).toBeInTheDocument();
		});

		it('shows "District" when location_scope is district', () => {
			render(RoleForm, { data: createData({ formData: { location_scope: 'district' } }) });
			expect(screen.getByText('District')).toBeInTheDocument();
		});
	});

	describe('Roles This Role Can Create (allowed_roles)', () => {
		const availableRoles: Role[] = [
			{ name: 'state_admin', label: 'State Admin' },
			{ name: 'district_admin', label: 'District Admin' }
		];

		it('shows placeholder text when no roles are selected', () => {
			render(RoleForm, { data: createData({ availableRoles, formData: { allowed_roles: [] } }) });
			expect(screen.getByText('Select valid roles')).toBeInTheDocument();
		});

		it('shows a badge with the resolved label for a selected role', () => {
			render(RoleForm, {
				data: createData({ availableRoles, formData: { allowed_roles: ['state_admin'] } })
			});
			expect(screen.getByText('State Admin')).toBeInTheDocument();
			expect(screen.queryByText('Select valid roles')).not.toBeInTheDocument();
		});

		it('falls back to the raw role name when it is not in availableRoles', () => {
			render(RoleForm, {
				data: createData({ availableRoles: [], formData: { allowed_roles: ['custom_role'] } })
			});
			expect(screen.getByText('custom_role')).toBeInTheDocument();
		});

		it('adds a role as a badge after selecting it from the picker', async () => {
			const { container } = render(RoleForm, {
				data: createData({ availableRoles, formData: { allowed_roles: [] } })
			});

			const trigger = container.querySelector('#allowed_roles') as HTMLElement;
			await fireEvent.click(trigger);

			const option = await screen.findByText('State Admin');
			await fireEvent.click(option);

			expect(within(trigger).getByText('State Admin')).toBeInTheDocument();
			expect(screen.queryByText('Select valid roles')).not.toBeInTheDocument();
		});
	});

	describe('Roles That Can Create This Role (visible_to_roles)', () => {
		const availableRoles: Role[] = [
			{ name: 'system_admin', label: 'System Admin' },
			{ name: 'state_admin', label: 'State Admin' },
			{ name: 'district_admin', label: 'District Admin' }
		];

		it('automatically includes System Admin even when omitted from initial data', () => {
			render(RoleForm, {
				data: createData({ availableRoles, formData: { visible_to_roles: [] } })
			});
			expect(screen.getByText('System Admin')).toBeInTheDocument();
		});

		it('does not duplicate System Admin when it is already present', () => {
			render(RoleForm, {
				data: createData({ availableRoles, formData: { visible_to_roles: ['system_admin'] } })
			});
			expect(screen.getAllByText('System Admin')).toHaveLength(1);
		});

		it('shows badges for additional roles alongside System Admin', () => {
			render(RoleForm, {
				data: createData({ availableRoles, formData: { visible_to_roles: ['state_admin'] } })
			});
			expect(screen.getByText('System Admin')).toBeInTheDocument();
			expect(screen.getByText('State Admin')).toBeInTheDocument();
		});

		it('marks System Admin as required and prevents removing it', async () => {
			const { container } = render(RoleForm, {
				data: createData({ availableRoles, formData: { visible_to_roles: ['system_admin'] } })
			});

			const trigger = container.querySelector('#visible_to_roles') as HTMLElement;
			await fireEvent.click(trigger);

			expect(await screen.findByText('Required')).toBeInTheDocument();

			const systemAdminEntries = screen.getAllByText('System Admin');

			expect(systemAdminEntries).toHaveLength(2);

			await fireEvent.click(systemAdminEntries[systemAdminEntries.length - 1]);

			expect(screen.getAllByText('System Admin').length).toBeGreaterThanOrEqual(1);
		});

		it('adds a newly selected role as a badge', async () => {
			const { container } = render(RoleForm, {
				data: createData({ availableRoles, formData: { visible_to_roles: ['system_admin'] } })
			});

			const trigger = container.querySelector('#visible_to_roles') as HTMLElement;
			await fireEvent.click(trigger);

			const option = await screen.findByText('District Admin');
			await fireEvent.click(option);

			expect(within(trigger).getByText('District Admin')).toBeInTheDocument();
		});
	});

	describe('Role Status switch', () => {
		it('shows "Active" and a checked switch when is_active is true', () => {
			render(RoleForm, { data: createData({ formData: { is_active: true } }) });
			expect(screen.getByText('Active')).toBeInTheDocument();
			expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked');
		});

		it('shows "Inactive" and an unchecked switch when is_active is false', () => {
			render(RoleForm, { data: createData({ formData: { is_active: false } }) });
			expect(screen.getByText('Inactive')).toBeInTheDocument();
			expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked');
		});

		it('toggles from Active to Inactive when clicked', async () => {
			render(RoleForm, { data: createData({ formData: { is_active: true } }) });

			await fireEvent.click(screen.getByRole('switch'));

			expect(screen.getByText('Inactive')).toBeInTheDocument();
			expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked');
		});
	});

	describe('Field tooltips', () => {
		it('renders the "Location Scope" label alongside its help tooltip trigger', () => {
			render(RoleForm, { data: createData() });

			expect(screen.getByText('Location Scope')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'About Location Scope' })).toBeInTheDocument();
		});

		it('renders the "Roles This Role Can Create" label alongside its help tooltip trigger', () => {
			render(RoleForm, { data: createData() });

			expect(screen.getByText('Roles This Role Can Create')).toBeInTheDocument();
			expect(
				screen.getByRole('button', { name: 'About Roles This Role Can Create' })
			).toBeInTheDocument();
		});

		it('renders the "Roles That Can Create This Role" label alongside its help tooltip trigger', () => {
			render(RoleForm, { data: createData() });

			expect(screen.getByText('Roles That Can Create This Role')).toBeInTheDocument();
			expect(
				screen.getByRole('button', { name: 'About Roles That Can Create This Role' })
			).toBeInTheDocument();
		});

		it('does not render the superseded field labels', () => {
			render(RoleForm, { data: createData() });

			expect(screen.queryByText('Location Level')).not.toBeInTheDocument();
			expect(screen.queryByText('Can Manage These Roles')).not.toBeInTheDocument();
			expect(screen.queryByText('Visible To These Admin Roles')).not.toBeInTheDocument();
		});

		it('renders exactly one tooltip trigger per relabeled field', () => {
			const { container } = render(RoleForm, { data: createData() });

			const triggers = container.querySelectorAll('[data-slot="tooltip-trigger"]');
			expect(triggers).toHaveLength(3);
		});
	});
});
