import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import AccountForm from './AccountForm.svelte';
import type { User } from '$lib/utils/permissions';

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

	describe('State and District Display', () => {
		const baseUser: User = {
			id: '1',
			full_name: 'Test User',
			email: 'test@example.com',
			role_id: 1,
			organization_id: 1,
			is_active: true,
			created_date: '2024-01-01T00:00:00Z',
			modified_date: '2024-01-01T00:00:00Z',
			is_deleted: false,
			states: [],
			districts: [],
			permissions: []
		};

		it('should not render State or District fields when currentUser is null', () => {
			const form = createMockForm();
			render(AccountForm, { props: { form, currentUser: null } as any });

			expect(document.getElementById('state-field')).not.toBeInTheDocument();
			expect(document.getElementById('district-field')).not.toBeInTheDocument();
		});

		it('should not render State or District fields when user has no states assigned', () => {
			const form = createMockForm();
			const currentUser: User = { ...baseUser, states: [], districts: [] };
			render(AccountForm, { props: { form, currentUser } as any });

			expect(document.getElementById('state-field')).not.toBeInTheDocument();
			expect(document.getElementById('district-field')).not.toBeInTheDocument();
		});

		it('should render State field with the correct name when user has a state assigned', () => {
			const form = createMockForm();
			const currentUser: User = {
				...baseUser,
				states: [{ id: 1, name: 'Maharashtra' }],
				districts: []
			};
			render(AccountForm, { props: { form, currentUser } as any });

			const stateInput = document.getElementById('state-field') as HTMLInputElement;
			expect(stateInput).toBeInTheDocument();
			expect(stateInput).toHaveValue('Maharashtra');
		});

		it('should render State field as disabled (read-only)', () => {
			const form = createMockForm();
			const currentUser: User = {
				...baseUser,
				states: [{ id: 1, name: 'Maharashtra' }],
				districts: []
			};
			render(AccountForm, { props: { form, currentUser } as any });

			const stateInput = document.getElementById('state-field') as HTMLInputElement;
			expect(stateInput).toBeDisabled();
		});

		it('should not render District field when user has a state but no districts', () => {
			const form = createMockForm();
			const currentUser: User = {
				...baseUser,
				states: [{ id: 1, name: 'Maharashtra' }],
				districts: []
			};
			render(AccountForm, { props: { form, currentUser } as any });

			expect(document.getElementById('district-field')).not.toBeInTheDocument();
		});

		it('should not apply two-column grid when user has state but no districts', () => {
			const form = createMockForm();
			const currentUser: User = {
				...baseUser,
				states: [{ id: 1, name: 'Maharashtra' }],
				districts: []
			};
			const { container } = render(AccountForm, { props: { form, currentUser } as any });

			const grid = container.querySelector('.grid.grid-cols-1.gap-4.md\\:grid-cols-2');
			expect(grid).not.toBeInTheDocument();
		});

		it('should render both State and District fields when user has state and districts', () => {
			const form = createMockForm();
			const currentUser: User = {
				...baseUser,
				states: [{ id: 1, name: 'Maharashtra' }],
				districts: [
					{ id: 10, name: 'Pune' },
					{ id: 11, name: 'Nashik' }
				]
			};
			render(AccountForm, { props: { form, currentUser } as any });

			expect(document.getElementById('state-field')).toBeInTheDocument();
			expect(document.getElementById('district-field')).toBeInTheDocument();
		});

		it('should display multiple districts as a comma-separated string', () => {
			const form = createMockForm();
			const currentUser: User = {
				...baseUser,
				states: [{ id: 1, name: 'Maharashtra' }],
				districts: [
					{ id: 10, name: 'Pune' },
					{ id: 11, name: 'Nashik' },
					{ id: 12, name: 'Nagpur' }
				]
			};
			render(AccountForm, { props: { form, currentUser } as any });

			const districtInput = document.getElementById('district-field') as HTMLInputElement;
			expect(districtInput).toHaveValue('Pune, Nashik, Nagpur');
		});

		it('should display a single district without a trailing comma', () => {
			const form = createMockForm();
			const currentUser: User = {
				...baseUser,
				states: [{ id: 1, name: 'Maharashtra' }],
				districts: [{ id: 10, name: 'Pune' }]
			};
			render(AccountForm, { props: { form, currentUser } as any });

			const districtInput = document.getElementById('district-field') as HTMLInputElement;
			expect(districtInput).toHaveValue('Pune');
		});

		it('should render District field as disabled (read-only)', () => {
			const form = createMockForm();
			const currentUser: User = {
				...baseUser,
				states: [{ id: 1, name: 'Maharashtra' }],
				districts: [{ id: 10, name: 'Pune' }]
			};
			render(AccountForm, { props: { form, currentUser } as any });

			const districtInput = document.getElementById('district-field') as HTMLInputElement;
			expect(districtInput).toBeDisabled();
		});

		it('should apply two-column grid layout when both state and districts are present', () => {
			const form = createMockForm();
			const currentUser: User = {
				...baseUser,
				states: [{ id: 1, name: 'Maharashtra' }],
				districts: [{ id: 10, name: 'Pune' }]
			};
			const { container } = render(AccountForm, { props: { form, currentUser } as any });

			const grid = container.querySelector('.grid.grid-cols-1.gap-4.md\\:grid-cols-2');
			expect(grid).toBeInTheDocument();
		});

		it('should render State label and District label when both are present', () => {
			const form = createMockForm();
			const currentUser: User = {
				...baseUser,
				states: [{ id: 1, name: 'Maharashtra' }],
				districts: [{ id: 10, name: 'Pune' }]
			};
			render(AccountForm, { props: { form, currentUser } as any });

			expect(screen.getByText('State')).toBeInTheDocument();
			expect(screen.getByText('District')).toBeInTheDocument();
		});
	});
});
