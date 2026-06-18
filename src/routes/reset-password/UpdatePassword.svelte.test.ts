import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import UpdatePassword from './UpdatePassword.svelte';

const createTestData = (
	overrides: { password?: string; confirm_password?: string; token?: string } = {}
) => ({
	id: 'updatePasswordForm',
	valid: false,
	posted: false,
	errors: {},
	data: {
		password: '',
		confirm_password: '',
		token: 'test-reset-token',
		...overrides
	}
});

describe('UpdatePassword', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render the form', () => {
			const { container } = render(UpdatePassword, { data: createTestData() });
			const form = container.querySelector('form');
			expect(form).toBeInTheDocument();
		});

		it('should render the New Password label', () => {
			render(UpdatePassword, { data: createTestData() });
			expect(screen.getByText('New Password')).toBeInTheDocument();
		});

		it('should render the Confirm Password label', () => {
			render(UpdatePassword, { data: createTestData() });
			expect(screen.getByText('Confirm Password')).toBeInTheDocument();
		});

		it('should render the Update button', () => {
			render(UpdatePassword, { data: createTestData() });
			expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
		});

		it('should render two password input fields', () => {
			const { container } = render(UpdatePassword, { data: createTestData() });
			const passwordInputs = container.querySelectorAll('input[type="password"]');
			expect(passwordInputs.length).toBe(2);
		});
	});

	describe('Form Attributes', () => {
		it('should have POST method', () => {
			const { container } = render(UpdatePassword, { data: createTestData() });
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
		});

		it('should have action ?/update', () => {
			const { container } = render(UpdatePassword, { data: createTestData() });
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('action', '?/update');
		});
	});

	describe('Hidden Token Field', () => {
		it('should have a hidden token input', () => {
			const { container } = render(UpdatePassword, { data: createTestData() });
			const hiddenInput = container.querySelector('input[type="hidden"][name="token"]');
			expect(hiddenInput).toBeInTheDocument();
		});

		it('should set token value from form data', () => {
			const { container } = render(UpdatePassword, {
				data: createTestData({ token: 'my-secret-token' })
			});
			const hiddenInput = container.querySelector(
				'input[type="hidden"][name="token"]'
			) as HTMLInputElement;
			expect(hiddenInput.value).toBe('my-secret-token');
		});
	});

	describe('Password Input', () => {
		it('should have a password input with name "password"', () => {
			const { container } = render(UpdatePassword, { data: createTestData() });
			const input = container.querySelector('input[name="password"]');
			expect(input).toBeInTheDocument();
			expect(input).toHaveAttribute('type', 'password');
		});

		it('should start empty', () => {
			const { container } = render(UpdatePassword, { data: createTestData() });
			const input = container.querySelector('input[name="password"]') as HTMLInputElement;
			expect(input.value).toBe('');
		});

		it('should display pre-filled value', () => {
			const { container } = render(UpdatePassword, {
				data: createTestData({ password: 'newpass123' })
			});
			const input = container.querySelector('input[name="password"]') as HTMLInputElement;
			expect(input.value).toBe('newpass123');
		});
	});

	describe('Confirm Password Input', () => {
		it('should have a confirm password input with name "confirm_password"', () => {
			const { container } = render(UpdatePassword, { data: createTestData() });
			const input = container.querySelector('input[name="confirm_password"]');
			expect(input).toBeInTheDocument();
			expect(input).toHaveAttribute('type', 'password');
		});

		it('should start empty', () => {
			const { container } = render(UpdatePassword, { data: createTestData() });
			const input = container.querySelector(
				'input[name="confirm_password"]'
			) as HTMLInputElement;
			expect(input.value).toBe('');
		});

		it('should display pre-filled value', () => {
			const { container } = render(UpdatePassword, {
				data: createTestData({ confirm_password: 'newpass123' })
			});
			const input = container.querySelector(
				'input[name="confirm_password"]'
			) as HTMLInputElement;
			expect(input.value).toBe('newpass123');
		});
	});

	describe('User Interaction', () => {
		it('should allow typing in password field', async () => {
			const { container } = render(UpdatePassword, { data: createTestData() });
			const input = container.querySelector('input[name="password"]') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'securepass' } });
			expect(input.value).toBe('securepass');
		});

		it('should allow typing in confirm password field', async () => {
			const { container } = render(UpdatePassword, { data: createTestData() });
			const input = container.querySelector(
				'input[name="confirm_password"]'
			) as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'securepass' } });
			expect(input.value).toBe('securepass');
		});
	});

	describe('Data Binding', () => {
		it('should populate both password fields with provided data', () => {
			const { container } = render(UpdatePassword, {
				data: createTestData({ password: 'mypassword', confirm_password: 'mypassword' })
			});

			const passwordInput = container.querySelector(
				'input[name="password"]'
			) as HTMLInputElement;
			const confirmInput = container.querySelector(
				'input[name="confirm_password"]'
			) as HTMLInputElement;

			expect(passwordInput.value).toBe('mypassword');
			expect(confirmInput.value).toBe('mypassword');
		});
	});

	describe('Update Button', () => {
		it('should be a submit button', () => {
			render(UpdatePassword, { data: createTestData() });
			const button = screen.getByRole('button', { name: 'Update' });
			expect(button).toHaveAttribute('type', 'submit');
		});

		it('should have full width styling', () => {
			render(UpdatePassword, { data: createTestData() });
			const button = screen.getByRole('button', { name: 'Update' });
			expect(button).toHaveClass('w-full');
		});
	});

	describe('Success Message', () => {
		it('should not show a message when there is none', () => {
			const { container } = render(UpdatePassword, { data: createTestData() });
			const successDiv = container.querySelector('.text-success');
			expect(successDiv).not.toBeInTheDocument();
		});
	});
});
