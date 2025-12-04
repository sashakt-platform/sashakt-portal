import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import UserForm from './UserForm.svelte';

// Mock StateSelection component
vi.mock('$lib/components/StateSelection.svelte', () => ({
	default: class StateSelectionMock {
		constructor() {}
	}
}));

// Mock permissions
vi.mock('$lib/utils/permissions.js', () => ({
	hasPermission: vi.fn((user, permission) => {
		if (
			permission === 'create_organization' ||
			permission === 'update_organization' ||
			permission === 'delete_organization'
		) {
			return user?.permissions?.includes(permission);
		}
		return false;
	}),
	PERMISSIONS: {
		CREATE_ORGANIZATION: 'create_organization',
		UPDATE_ORGANIZATION: 'update_organization',
		DELETE_ORGANIZATION: 'delete_organization'
	}
}));

describe('UserForm Component', () => {
	const mockRoles = [
		{ id: '1', label: 'Admin' },
		{ id: '2', label: 'State User' },
		{ id: '3', label: 'Regular User' }
	];

	const mockOrganizations = [
		{ id: '1', name: 'Organization 1' },
		{ id: '2', name: 'Organization 2' }
	];

	// Helper function to create test data
	const createTestData = (userOverrides = {}, currentUserOverrides = {}) => {
		const mockUser = {
			id: '123',
			full_name: 'John Doe',
			email: 'john@example.com',
			phone: '1234567890',
			organization_id: '1',
			role_id: '1',
			is_active: true,
			states: [],
			...userOverrides
		};

		return {
			action: 'edit',
			form: { data: mockUser, valid: false },
			roles: mockRoles,
			organizations: mockOrganizations,
			currentUser: {
				id: 1,
				permissions: ['create_organization'],
				...currentUserOverrides
			},
			user: mockUser
		};
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Edit Mode - Basic Rendering', () => {
		it('should render all form fields with proper structure', () => {
			const data = createTestData();
			const { container } = render(UserForm, { data });

			// Check form structure
			const form = container.querySelector('form');
			expect(form).toBeInTheDocument();
			expect(form).toHaveAttribute('method', 'POST');

			// Check all fields are present
			expect(screen.getByLabelText('Name')).toBeInTheDocument();
			expect(screen.getByLabelText('Email')).toBeInTheDocument();
			expect(screen.getByLabelText('Phone')).toBeInTheDocument();
			expect(screen.getByText('Is Active?')).toBeInTheDocument();
			expect(screen.getByText('Role')).toBeInTheDocument();

			// Check buttons
			expect(screen.getByRole('button', { name: /Save User/i })).toBeInTheDocument();
			const cancelLink = screen.getByRole('link', { name: /Cancel/i });
			expect(cancelLink).toBeInTheDocument();
			expect(cancelLink).toHaveAttribute('href', '/users');
		});

		it('should show password fields as optional in edit mode', () => {
			const data = createTestData();
			render(UserForm, { data });

			expect(screen.getByText(/Password \(Optional/)).toBeInTheDocument();
			expect(
				screen.getByText(/Confirm Password \(Required if password is entered\)/)
			).toBeInTheDocument();

			const passwordInputs = screen.getAllByPlaceholderText(/password/i);
			expect(passwordInputs.length).toBeGreaterThan(0);
		});
	});

	describe('Data Binding', () => {
		it('should populate input fields with user data', () => {
			const data = createTestData({
				full_name: 'Jane Smith',
				email: 'jane.smith@example.com',
				phone: '9876543210'
			});

			render(UserForm, { data });

			const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
			const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
			const phoneInput = screen.getByLabelText('Phone') as HTMLInputElement;

			expect(nameInput.value).toBe('Jane Smith');
			expect(emailInput.value).toBe('jane.smith@example.com');
			expect(phoneInput.value).toBe('9876543210');
		});

		it('should handle optional and special character data correctly', () => {
			const data = createTestData({
				full_name: "O'Brien-Smith",
				email: 'test+admin@example.co.uk',
				phone: ''
			});

			render(UserForm, { data });

			const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
			const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
			const phoneInput = screen.getByLabelText('Phone') as HTMLInputElement;

			expect(nameInput.value).toBe("O'Brien-Smith");
			expect(emailInput.value).toBe('test+admin@example.co.uk');
			expect(phoneInput.value).toBe('');
		});

		it('should display correct organization for user', () => {
			const data = createTestData({ organization_id: '2' });
			render(UserForm, { data });

			expect(screen.getByText('Organization 2')).toBeInTheDocument();
		});

		it('should reflect user active status in checkbox', () => {
			// Test active user
			const activeData = createTestData({ is_active: true });
			const { container: activeContainer } = render(UserForm, { data: activeData });
			const activeCheckbox = activeContainer.querySelector('button[role="checkbox"]');
			expect(activeCheckbox).toHaveAttribute('data-state', 'checked');

			// Test inactive user
			const inactiveData = createTestData({ is_active: false });
			const { container: inactiveContainer } = render(UserForm, { data: inactiveData });
			const inactiveCheckbox = inactiveContainer.querySelector('button[role="checkbox"]');
			expect(inactiveCheckbox).toHaveAttribute('data-state', 'unchecked');
		});

		it('should display complete user data correctly', () => {
			const data = createTestData({
				full_name: 'Complete User',
				email: 'complete@example.com',
				phone: '5551234567',
				organization_id: '1',
				role_id: '1'
			});

			render(UserForm, { data });

			const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
			const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
			const phoneInput = screen.getByLabelText('Phone') as HTMLInputElement;

			expect(nameInput.value).toBe('Complete User');
			expect(emailInput.value).toBe('complete@example.com');
			expect(phoneInput.value).toBe('5551234567');
			expect(screen.getByText('Organization 1')).toBeInTheDocument();
			expect(screen.getByText('Admin')).toBeInTheDocument();
		});
	});

	describe('Permission-Based Organization Field Visibility', () => {
		it.each([
			['create_organization', 'CREATE_ORGANIZATION'],
			['update_organization', 'UPDATE_ORGANIZATION'],
			['delete_organization', 'DELETE_ORGANIZATION']
		])('should show organization field for users with %s permission', (permission) => {
			const data = createTestData({}, { permissions: [permission] });
			render(UserForm, { data });

			expect(screen.getByText('Organization')).toBeInTheDocument();
		});

		it('should hide organization field for regular users without org permissions', () => {
			const data = createTestData(
				{},
				{
					permissions: ['create_user'],
					organization_id: '5'
				}
			);

			render(UserForm, { data });

			expect(screen.queryByText('Organization')).not.toBeInTheDocument();
		});
	});
});
