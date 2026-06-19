import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import LoginForm from './LoginForm.svelte';

const createTestData = (overrides: { username?: string; password?: string } = {}) => ({
	form: {
		id: 'loginForm',
		valid: false,
		posted: false,
		errors: {},
		data: {
			username: '',
			password: '',
			...overrides
		}
	}
});

describe('LoginForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render the login form', () => {
			const { container } = render(LoginForm, { data: createTestData() });
			const form = container.querySelector('form');
			expect(form).toBeInTheDocument();
		});

		it('should render the Email label', () => {
			render(LoginForm, { data: createTestData() });
			expect(screen.getByText('Email')).toBeInTheDocument();
		});

		it('should render the Password label', () => {
			render(LoginForm, { data: createTestData() });
			expect(screen.getByText('Password')).toBeInTheDocument();
		});

		it('should render the Login button', () => {
			render(LoginForm, { data: createTestData() });
			expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
		});

		it('should render email and password input fields', () => {
			const { container } = render(LoginForm, { data: createTestData() });
			const inputs = container.querySelectorAll('input');
			expect(inputs.length).toBe(2);
		});
	});

	describe('Form Attributes', () => {
		it('should have POST method', () => {
			const { container } = render(LoginForm, { data: createTestData() });
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
		});

		it('should have correct action attribute', () => {
			const { container } = render(LoginForm, { data: createTestData() });
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('action', '?/login');
		});
	});

	describe('Email Input', () => {
		it('should have autocomplete set to email', () => {
			const { container } = render(LoginForm, { data: createTestData() });
			const emailInput = container.querySelector('input[autocomplete="email"]');
			expect(emailInput).toBeInTheDocument();
		});

		it('should display pre-filled email value', () => {
			const data = createTestData({ username: 'test@example.com' });
			const { container } = render(LoginForm, { data });
			const emailInput = container.querySelector('input[autocomplete="email"]') as HTMLInputElement;
			expect(emailInput.value).toBe('test@example.com');
		});

		it('should start empty with empty form data', () => {
			const { container } = render(LoginForm, { data: createTestData() });
			const emailInput = container.querySelector('input[autocomplete="email"]') as HTMLInputElement;
			expect(emailInput.value).toBe('');
		});
	});

	describe('Password Input', () => {
		it('should have type password', () => {
			const { container } = render(LoginForm, { data: createTestData() });
			const passwordInput = container.querySelector('input[type="password"]');
			expect(passwordInput).toBeInTheDocument();
		});

		it('should display pre-filled password value', () => {
			const data = createTestData({ password: 'password123' });
			const { container } = render(LoginForm, { data });
			const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;
			expect(passwordInput.value).toBe('password123');
		});

		it('should start empty with empty form data', () => {
			const { container } = render(LoginForm, { data: createTestData() });
			const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;
			expect(passwordInput.value).toBe('');
		});
	});

	describe('Data Binding', () => {
		it('should populate both fields with provided data', () => {
			const data = createTestData({ username: 'jane@example.com', password: 'securepass' });
			const { container } = render(LoginForm, { data });

			const emailInput = container.querySelector('input[autocomplete="email"]') as HTMLInputElement;
			const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;

			expect(emailInput.value).toBe('jane@example.com');
			expect(passwordInput.value).toBe('securepass');
		});

		it('should handle special characters in email', () => {
			const data = createTestData({ username: 'test+admin@example.co.uk' });
			const { container } = render(LoginForm, { data });

			const emailInput = container.querySelector('input[autocomplete="email"]') as HTMLInputElement;
			expect(emailInput.value).toBe('test+admin@example.co.uk');
		});
	});

	describe('User Interaction', () => {
		it('should allow typing in email field', async () => {
			const { container } = render(LoginForm, { data: createTestData() });
			const emailInput = container.querySelector('input[autocomplete="email"]') as HTMLInputElement;

			await fireEvent.input(emailInput, { target: { value: 'user@test.com' } });
			expect(emailInput.value).toBe('user@test.com');
		});

		it('should allow typing in password field', async () => {
			const { container } = render(LoginForm, { data: createTestData() });
			const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;

			await fireEvent.input(passwordInput, { target: { value: 'mypassword' } });
			expect(passwordInput.value).toBe('mypassword');
		});
	});

	describe('Login Button', () => {
		it('should be a submit button', () => {
			render(LoginForm, { data: createTestData() });
			const button = screen.getByRole('button', { name: 'Login' });
			expect(button).toHaveAttribute('type', 'submit');
		});

		it('should have full width styling', () => {
			render(LoginForm, { data: createTestData() });
			const button = screen.getByRole('button', { name: 'Login' });
			expect(button).toHaveClass('w-full');
		});
	});
});
