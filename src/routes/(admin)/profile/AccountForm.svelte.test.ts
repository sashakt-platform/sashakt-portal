import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import AccountForm from './AccountForm.svelte';

function makeStore(initial: unknown) {
	let value = initial;
	const subscribers = new Set<(v: unknown) => void>();
	return {
		subscribe: (fn: (v: unknown) => void) => {
			fn(value);
			subscribers.add(fn);
			return () => subscribers.delete(fn);
		},
		set: (v: unknown) => {
			value = v;
			subscribers.forEach((fn) => fn(value));
		},
		update: (fn: (v: unknown) => unknown) => {
			value = fn(value);
			subscribers.forEach((fn) => fn(value));
		}
	};
}

function createMockForm(data: Record<string, unknown> = {}) {
	const defaults = {
		full_name: '',
		email: '',
		phone: '',
		role_label: '',
		...data
	};

	return {
		form: makeStore(defaults),
		enhance: () => () => {},
		submit: vi.fn(),
		validate: vi.fn(),
		reset: vi.fn(),
		errors: makeStore({}),
		constraints: makeStore({}),
		message: makeStore(undefined),
		tainted: makeStore(undefined),
		submitting: makeStore(false),
		delayed: makeStore(false),
		timeout: makeStore(false),
		posted: makeStore(false),
		allErrors: makeStore([]),
		fields: {},
		options: {}
	};
}

vi.mock('sveltekit-superforms', async () => {
	const actual = await vi.importActual('sveltekit-superforms');
	return {
		...actual,
		superForm: vi.fn()
	};
});

describe('AccountForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render the "My Profile" heading', () => {
			const form = createMockForm();
			render(AccountForm, { props: { form } });

			expect(screen.getByText('My Profile')).toBeInTheDocument();
		});

		it('should render the Name label', () => {
			const form = createMockForm();
			render(AccountForm, { props: { form } });

			expect(screen.getByText('Name')).toBeInTheDocument();
		});

		it('should render the Email label', () => {
			const form = createMockForm();
			render(AccountForm, { props: { form } });

			expect(screen.getByText('Email')).toBeInTheDocument();
		});

		it('should render the Phone number label', () => {
			const form = createMockForm();
			render(AccountForm, { props: { form } });

			expect(screen.getByText('Phone number')).toBeInTheDocument();
		});

		it('should render the Role label', () => {
			const form = createMockForm();
			render(AccountForm, { props: { form } });

			expect(screen.getByText('Role')).toBeInTheDocument();
		});

		it('should render the organisation admin note for role field', () => {
			const form = createMockForm();
			render(AccountForm, { props: { form } });

			expect(screen.getByText('(Managed by your organisation admin)')).toBeInTheDocument();
		});
	});

	describe('Form Fields', () => {
		it('should render name input with provided value', () => {
			const form = createMockForm({ full_name: 'John Doe' });
			render(AccountForm, { props: { form } });

			const nameInput = screen.getByRole('textbox', { name: 'Name' });
			expect(nameInput).toHaveValue('John Doe');
		});

		it('should render email input with provided value', () => {
			const form = createMockForm({ email: 'john@example.com' });
			render(AccountForm, { props: { form } });

			const emailInput = screen.getByRole('textbox', { name: 'Email' });
			expect(emailInput).toHaveValue('john@example.com');
		});

		it('should render phone input with provided value', () => {
			const form = createMockForm({ phone: '9876543210' });
			render(AccountForm, { props: { form } });

			const phoneInput = screen.getByRole('textbox', { name: 'Phone number' });
			expect(phoneInput).toHaveValue('9876543210');
		});

		it('should render email input with type email', () => {
			const form = createMockForm();
			render(AccountForm, { props: { form } });

			const emailInput = screen.getByRole('textbox', { name: 'Email' });
			expect(emailInput).toHaveAttribute('type', 'email');
		});

		it('should render phone input with type tel', () => {
			const form = createMockForm();
			render(AccountForm, { props: { form } });

			const phoneInput = screen.getByRole('textbox', { name: 'Phone number' });
			expect(phoneInput).toHaveAttribute('type', 'tel');
		});
	});

	describe('Role Field', () => {
		it('should render role input as disabled', () => {
			const form = createMockForm({ role_label: 'Admin' });
			render(AccountForm, { props: { form } });

			const roleInput = document.getElementById('role-field') as HTMLInputElement;
			expect(roleInput).toBeInTheDocument();
			expect(roleInput).toBeDisabled();
		});

		it('should display role_label value in role input', () => {
			const form = createMockForm({ role_label: 'State Admin' });
			render(AccountForm, { props: { form } });

			const roleInput = document.getElementById('role-field') as HTMLInputElement;
			expect(roleInput).toHaveValue('State Admin');
		});

		it('should display empty string when role_label is null', () => {
			const form = createMockForm({ role_label: null });
			render(AccountForm, { props: { form } });

			const roleInput = document.getElementById('role-field') as HTMLInputElement;
			expect(roleInput).toHaveValue('');
		});

		it('should display empty string when role_label is undefined', () => {
			const form = createMockForm({ role_label: undefined });
			render(AccountForm, { props: { form } });

			const roleInput = document.getElementById('role-field') as HTMLInputElement;
			expect(roleInput).toHaveValue('');
		});
	});

	describe('Empty State', () => {
		it('should render with empty form values', () => {
			const form = createMockForm();
			render(AccountForm, { props: { form } });

			const nameInput = screen.getByRole('textbox', { name: 'Name' });
			const emailInput = screen.getByRole('textbox', { name: 'Email' });
			const phoneInput = screen.getByRole('textbox', { name: 'Phone number' });

			expect(nameInput).toHaveValue('');
			expect(emailInput).toHaveValue('');
			expect(phoneInput).toHaveValue('');
		});
	});

	describe('Layout and Structure', () => {
		it('should have a card container with border', () => {
			const form = createMockForm();
			const { container } = render(AccountForm, { props: { form } });

			const card = container.querySelector('.rounded-xl.border.shadow-sm');
			expect(card).toBeInTheDocument();
		});

		it('should have a header section with border-b', () => {
			const form = createMockForm();
			const { container } = render(AccountForm, { props: { form } });

			const header = container.querySelector('.border-b');
			expect(header).toBeInTheDocument();
		});
	});
});
