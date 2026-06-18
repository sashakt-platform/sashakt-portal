import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import UserCreateEditPage from './+page.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$lib/nomenclature', () => ({
	useTerms: () => (key: string) => key
}));

vi.mock('./UserForm.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({
		$$set: vi.fn(),
		$destroy: vi.fn(),
		$on: vi.fn()
	}))
}));

function makeData(action: 'add' | 'edit' = 'add', overrides: Record<string, any> = {}) {
	return {
		action,
		id: action === 'edit' ? '1' : 'new',
		form: {},
		user: action === 'edit' ? { id: 1, full_name: 'Alice', email: 'alice@example.com' } : null,
		currentUser: { id: 1, permissions: [] },
		roles: [],
		organizations: [],
		...overrides
	};
}

describe('User Create / Edit Page (+page.svelte)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Page title', () => {
		it('shows "Create user" heading when action is "add"', () => {
			render(UserCreateEditPage, { data: makeData('add') } as any);
			expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Create user');
		});

		it('shows "Edit user" heading when action is "edit"', () => {
			render(UserCreateEditPage, { data: makeData('edit') } as any);
			expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Edit user');
		});

		it('title switches between modes based on data.action', () => {
			const { unmount } = render(UserCreateEditPage, { data: makeData('add') } as any);
			expect(screen.getByRole('heading', { level: 2 }).textContent?.trim()).toBe('Create user');
			unmount();

			render(UserCreateEditPage, { data: makeData('edit') } as any);
			expect(screen.getByRole('heading', { level: 2 }).textContent?.trim()).toBe('Edit user');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Back button', () => {
		it('renders a back navigation link', () => {
			render(UserCreateEditPage, { data: makeData() } as any);
			expect(screen.getByRole('link', { name: /back to users/i })).toBeInTheDocument();
		});

		it('back link points to /users', () => {
			render(UserCreateEditPage, { data: makeData() } as any);
			const link = screen.getByRole('link', { name: /back to users/i });
			expect(link).toHaveAttribute('href', '/users');
		});

		it('back link has correct aria-label', () => {
			render(UserCreateEditPage, { data: makeData() } as any);
			const link = screen.getByRole('link', { name: /back to users/i });
			expect(link).toHaveAttribute('aria-label', 'Back to users');
		});

		it('back link is present in both create and edit modes', () => {
			const { unmount } = render(UserCreateEditPage, { data: makeData('add') } as any);
			expect(screen.getByRole('link', { name: /back to users/i })).toBeInTheDocument();
			unmount();

			render(UserCreateEditPage, { data: makeData('edit') } as any);
			expect(screen.getByRole('link', { name: /back to users/i })).toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Save button', () => {
		it('renders a Save button', () => {
			render(UserCreateEditPage, { data: makeData() } as any);
			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
		});

		it('Save button has type="submit"', () => {
			render(UserCreateEditPage, { data: makeData() } as any);
			const btn = screen.getByRole('button', { name: /save/i });
			expect(btn).toHaveAttribute('type', 'submit');
		});

		it('Save button is wired to the user-form via form attribute', () => {
			render(UserCreateEditPage, { data: makeData() } as any);
			const btn = screen.getByRole('button', { name: /save/i });
			expect(btn).toHaveAttribute('form', 'user-form');
		});

		it('Save button is present in both create and edit modes', () => {
			const { unmount } = render(UserCreateEditPage, { data: makeData('add') } as any);
			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
			unmount();

			render(UserCreateEditPage, { data: makeData('edit') } as any);
			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
		});
	});

	
});
