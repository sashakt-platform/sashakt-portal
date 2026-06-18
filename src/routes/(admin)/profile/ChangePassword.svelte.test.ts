import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import ChangePassword from './ChangePassword.svelte';

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
		current_password: '',
		new_password: '',
		confirm_password: '',
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

describe('ChangePassword', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render the "My Password" heading', () => {
			const form = createMockForm();
			render(ChangePassword, { props: { form } });

			expect(screen.getByText('My Password')).toBeInTheDocument();
		});

		it('should render the Current password label', () => {
			const form = createMockForm();
			render(ChangePassword, { props: { form } });

			expect(screen.getByText('Current password')).toBeInTheDocument();
		});

		it('should render the New password label', () => {
			const form = createMockForm();
			render(ChangePassword, { props: { form } });

			expect(screen.getByText('New password')).toBeInTheDocument();
		});

		it('should render the Re-enter password label', () => {
			const form = createMockForm();
			render(ChangePassword, { props: { form } });

			expect(screen.getByText('Re-enter password')).toBeInTheDocument();
		});
	});

	describe('Password Input Types', () => {
		it('should render all three inputs as password type by default', () => {
			const form = createMockForm();
			const { container } = render(ChangePassword, { props: { form } });

			const inputs = container.querySelectorAll('input[type="password"]');
			expect(inputs).toHaveLength(3);
		});

		it('should render no text-type inputs by default', () => {
			const form = createMockForm();
			const { container } = render(ChangePassword, { props: { form } });

			const textInputs = container.querySelectorAll('input[type="text"]');
			expect(textInputs).toHaveLength(0);
		});
	});

	describe('Password Visibility Toggle', () => {
		it('should render three toggle buttons', () => {
			const form = createMockForm();
			render(ChangePassword, { props: { form } });

			const buttons = screen.getAllByRole('button');
			expect(buttons).toHaveLength(3);
		});

		it('should toggle current password visibility on button click', async () => {
			const form = createMockForm();
			const { container } = render(ChangePassword, { props: { form } });

			const inputs = container.querySelectorAll('input');
			const currentInput = inputs[0];
			expect(currentInput).toHaveAttribute('type', 'password');

			const buttons = screen.getAllByRole('button');
			await fireEvent.click(buttons[0]);
			await tick();

			expect(currentInput).toHaveAttribute('type', 'text');
		});

		it('should toggle new password visibility on button click', async () => {
			const form = createMockForm();
			const { container } = render(ChangePassword, { props: { form } });

			const inputs = container.querySelectorAll('input');
			const newInput = inputs[1];
			expect(newInput).toHaveAttribute('type', 'password');

			const buttons = screen.getAllByRole('button');
			await fireEvent.click(buttons[1]);
			await tick();

			expect(newInput).toHaveAttribute('type', 'text');
		});

		it('should toggle confirm password visibility on button click', async () => {
			const form = createMockForm();
			const { container } = render(ChangePassword, { props: { form } });

			const inputs = container.querySelectorAll('input');
			const confirmInput = inputs[2];
			expect(confirmInput).toHaveAttribute('type', 'password');

			const buttons = screen.getAllByRole('button');
			await fireEvent.click(buttons[2]);
			await tick();

			expect(confirmInput).toHaveAttribute('type', 'text');
		});

		it('should toggle back to password type on second click', async () => {
			const form = createMockForm();
			const { container } = render(ChangePassword, { props: { form } });

			const inputs = container.querySelectorAll('input');
			const currentInput = inputs[0];
			const buttons = screen.getAllByRole('button');

			await fireEvent.click(buttons[0]);
			await tick();
			expect(currentInput).toHaveAttribute('type', 'text');

			await fireEvent.click(buttons[0]);
			await tick();
			expect(currentInput).toHaveAttribute('type', 'password');
		});

		it('should toggle each field independently', async () => {
			const form = createMockForm();
			const { container } = render(ChangePassword, { props: { form } });

			const inputs = container.querySelectorAll('input');
			const buttons = screen.getAllByRole('button');

			await fireEvent.click(buttons[0]);
			await tick();

			expect(inputs[0]).toHaveAttribute('type', 'text');
			expect(inputs[1]).toHaveAttribute('type', 'password');
			expect(inputs[2]).toHaveAttribute('type', 'password');
		});
	});

	describe('Form Fields', () => {
		it('should render current password input with provided value', () => {
			const form = createMockForm({ current_password: 'oldpass123' });
			const { container } = render(ChangePassword, { props: { form } });

			const inputs = container.querySelectorAll('input');
			expect(inputs[0]).toHaveValue('oldpass123');
		});

		it('should render new password input with provided value', () => {
			const form = createMockForm({ new_password: 'newpass456' });
			const { container } = render(ChangePassword, { props: { form } });

			const inputs = container.querySelectorAll('input');
			expect(inputs[1]).toHaveValue('newpass456');
		});

		it('should render confirm password input with provided value', () => {
			const form = createMockForm({ confirm_password: 'newpass456' });
			const { container } = render(ChangePassword, { props: { form } });

			const inputs = container.querySelectorAll('input');
			expect(inputs[2]).toHaveValue('newpass456');
		});

		it('should render all inputs empty by default', () => {
			const form = createMockForm();
			const { container } = render(ChangePassword, { props: { form } });

			const inputs = container.querySelectorAll('input');
			expect(inputs[0]).toHaveValue('');
			expect(inputs[1]).toHaveValue('');
			expect(inputs[2]).toHaveValue('');
		});
	});

	describe('Layout and Structure', () => {
		it('should have a card container with border', () => {
			const form = createMockForm();
			const { container } = render(ChangePassword, { props: { form } });

			const card = container.querySelector('.rounded-xl.border.shadow-sm');
			expect(card).toBeInTheDocument();
		});

		it('should have a header section with border-b', () => {
			const form = createMockForm();
			const { container } = render(ChangePassword, { props: { form } });

			const header = container.querySelector('.border-b');
			expect(header).toBeInTheDocument();
		});

		it('should have toggle buttons of type button (not submit)', () => {
			const form = createMockForm();
			render(ChangePassword, { props: { form } });

			const buttons = screen.getAllByRole('button');
			buttons.forEach((button) => {
				expect(button).toHaveAttribute('type', 'button');
			});
		});
	});
});
