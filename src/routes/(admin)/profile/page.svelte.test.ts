import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import ProfilePage from './+page.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn()
}));

function storeOf<T>(value: T) {
	const subscribers = new Set<(v: T) => void>();
	let current = value;
	return {
		subscribe: (fn: (v: T) => void) => {
			fn(current);
			subscribers.add(fn);
			return () => subscribers.delete(fn);
		},
		set: (v: T) => {
			current = v;
			subscribers.forEach((fn) => fn(current));
		},
		update: (fn: (v: T) => T) => {
			current = fn(current);
			subscribers.forEach((fn) => fn(current));
		}
	};
}

type FormValues = Record<string, unknown>;
let formStore: ReturnType<typeof storeOf<FormValues>>;

vi.mock('sveltekit-superforms', () => ({
	superForm: vi.fn((data: FormValues) => {
		const values = {
			full_name: '',
			email: '',
			phone: '',
			role_label: '',
			current_password: '',
			new_password: '',
			confirm_password: '',
			...data
		};
		formStore = storeOf(values);
		return {
			form: formStore,
			errors: storeOf({}),
			constraints: storeOf({}),
			tainted: storeOf(undefined),
			allErrors: storeOf([]),
			posted: storeOf(false),
			message: storeOf(undefined),
			submitting: storeOf(false),
			delayed: storeOf(false),
			timeout: storeOf(false),
			enhance: () => () => {}
		};
	})
}));

const baseData = {
	form: {
		full_name: '',
		email: '',
		phone: '',
		role_label: '',
		current_password: '',
		new_password: '',
		confirm_password: ''
	},
	currentUser: null
};

const userProfileData = {
	...baseData,
	currentUser: {
		full_name: 'Jane Smith',
		email: 'jane@example.com',
		phone: '9876543210',
		role_label: 'State Admin',
		current_password: '',
		new_password: '',
		confirm_password: ''
	}
};

describe('Profile Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Page Heading', () => {
		it('should display user full_name when currentUser is present', () => {
			render(ProfilePage, { data: userProfileData });

			expect(
				screen.getByRole('heading', { name: 'Jane Smith' })
			).toBeInTheDocument();
		});

		it('should display "My Profile" when currentUser is null', () => {
			render(ProfilePage, { data: baseData });

			const heading = screen.getByRole('heading', { level: 1 });
			expect(heading).toHaveTextContent('My Profile');
		});
	});

	describe('Action Buttons', () => {
		it('should render the Cancel button', () => {
			render(ProfilePage, { data: userProfileData });

			expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
		});

		it('should render the Save button', () => {
			render(ProfilePage, { data: userProfileData });

			expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
		});

		it('should render Cancel as a link to /tests/test-session', () => {
			render(ProfilePage, { data: userProfileData });

			const cancelLink = screen.getByRole('link', { name: 'Cancel' });
			expect(cancelLink).toHaveAttribute('href', '/tests/test-session');
		});
	});

	describe('Save Button State', () => {
		it('should be disabled when no fields have changed', () => {
			render(ProfilePage, { data: userProfileData });

			expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
		});

		it('should be enabled when full_name changes', async () => {
			render(ProfilePage, { data: userProfileData });

			formStore.update((f) => ({ ...f, full_name: 'Updated Name' }));
			await tick();

			expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
		});

		it('should be enabled when email changes', async () => {
			render(ProfilePage, { data: userProfileData });

			formStore.update((f) => ({ ...f, email: 'new@example.com' }));
			await tick();

			expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
		});

		it('should be enabled when phone changes', async () => {
			render(ProfilePage, { data: userProfileData });

			formStore.update((f) => ({ ...f, phone: '1234567890' }));
			await tick();

			expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
		});

		it('should be enabled when new_password is set', async () => {
			render(ProfilePage, { data: userProfileData });

			formStore.update((f) => ({ ...f, new_password: 'newpass123' }));
			await tick();

			expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
		});

		it('should remain disabled when values are set back to initial', async () => {
			render(ProfilePage, { data: userProfileData });

			formStore.update((f) => ({ ...f, full_name: 'Changed' }));
			await tick();
			expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();

			formStore.update((f) => ({ ...f, full_name: 'Jane Smith' }));
			await tick();
			expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
		});
	});

	describe('Form Structure', () => {
		it('should render a form with id "profile-form"', () => {
			const { container } = render(ProfilePage, { data: userProfileData });

			const form = container.querySelector('form#profile-form');
			expect(form).toBeInTheDocument();
		});

		it('should have method POST on the form', () => {
			const { container } = render(ProfilePage, { data: userProfileData });

			const form = container.querySelector('form#profile-form');
			expect(form).toHaveAttribute('method', 'POST');
		});

		it('should have action ?/save on the form', () => {
			const { container } = render(ProfilePage, { data: userProfileData });

			const form = container.querySelector('form#profile-form');
			expect(form).toHaveAttribute('action', '?/save');
		});

		it('should have Save button linked to profile-form', () => {
			render(ProfilePage, { data: userProfileData });

			const saveBtn = screen.getByRole('button', { name: 'Save' });
			expect(saveBtn).toHaveAttribute('form', 'profile-form');
		});

		it('should have Save button with type submit', () => {
			render(ProfilePage, { data: userProfileData });

			const saveBtn = screen.getByRole('button', { name: 'Save' });
			expect(saveBtn).toHaveAttribute('type', 'submit');
		});
	});

	describe('Child Components', () => {
		it('should render AccountForm (My Profile section)', () => {
			render(ProfilePage, { data: userProfileData });

			expect(screen.getByText('My Profile')).toBeInTheDocument();
		});

		it('should render ChangePassword (My Password section)', () => {
			render(ProfilePage, { data: userProfileData });

			expect(screen.getByText('My Password')).toBeInTheDocument();
		});
	});
});
