import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import OrganisationFormPage from './+page.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/organisations/add/new')
	}
}));

vi.mock('svelte-sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn() }
}));

vi.mock('sveltekit-superforms', () => ({
	superForm: vi.fn((data) => {
		const formValues = data?.data ?? {
			name: '',
			shortcode: '',
			description: '',
			is_active: true,
			logo: ''
		};
		return {
			form: {
				subscribe: (fn) => {
					fn(formValues);
					return () => {};
				},
				set: () => {},
				update: () => {}
			},
			errors: {
				subscribe: (fn) => {
					fn({});
					return () => {};
				},
				set: () => {},
				update: () => {}
			},
			enhance: vi.fn(),
			submitting: {
				subscribe: (fn) => {
					fn(false);
					return () => {};
				}
			}
		};
	})
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn()
}));

const addModeData = {
	form: {
		data: { name: '', shortcode: '', description: '', is_active: true, logo: '' }
	},
	action: 'add',
	organisation: null
};

const editModeData = {
	form: {
		data: {
			name: 'Acme Corp',
			shortcode: 'acme',
			description: 'A test organisation',
			is_active: true,
			logo: ''
		}
	},
	action: 'edit',
	organisation: { id: 1, name: 'Acme Corp', shortcode: 'acme', is_active: true }
};

describe('OrganisationFormPage', () => {
	describe('Page title', () => {
		it('renders "Add Organisation" heading in add mode', () => {
			render(OrganisationFormPage, { data: addModeData });
			expect(screen.getByRole('heading', { name: /add organisation/i })).toBeInTheDocument();
		});

		it('renders "Edit Organisation" heading in edit mode', () => {
			render(OrganisationFormPage, { data: editModeData });
			expect(screen.getByRole('heading', { name: /edit organisation/i })).toBeInTheDocument();
		});
	});

	describe('Field labels', () => {
		it('renders all field labels', () => {
			render(OrganisationFormPage, { data: addModeData });
			expect(screen.getByText('Name')).toBeInTheDocument();
			expect(screen.getByText('Shortcode')).toBeInTheDocument();
			expect(screen.getByText('Description')).toBeInTheDocument();
			expect(screen.getByText('Status')).toBeInTheDocument();
			expect(screen.getByText('Logo')).toBeInTheDocument();
		});
	});

	describe('Navigation', () => {
		it('renders back link to organisations list', () => {
			const { container } = render(OrganisationFormPage, { data: addModeData });
			const backLink = container.querySelector('a[href="/organisations"]');
			expect(backLink).toBeInTheDocument();
		});

		it('renders Cancel button linking to organisations list', () => {
			render(OrganisationFormPage, { data: addModeData });
			expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
		});
	});

	describe('Form structure', () => {
		it('form has correct POST method and action', () => {
			const { container } = render(OrganisationFormPage, { data: addModeData });
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
			expect(form).toHaveAttribute('action', '?/save');
		});

		it('renders Save button', () => {
			render(OrganisationFormPage, { data: addModeData });
			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
		});

		it('renders "Copy Portal URL" button', () => {
			render(OrganisationFormPage, { data: addModeData });
			expect(screen.getByText(/copy portal url/i)).toBeInTheDocument();
		});

		it('renders logo file input that accepts images', () => {
			const { container } = render(OrganisationFormPage, { data: addModeData });
			const fileInput = container.querySelector('input[type="file"]');
			expect(fileInput).toBeInTheDocument();
			expect(fileInput).toHaveAttribute('accept', 'image/*');
		});
	});

	describe('Save button state', () => {
		it('disables Save button when name and shortcode are empty in add mode', () => {
			render(OrganisationFormPage, { data: addModeData });
			expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
		});

		it('enables Save button when name and shortcode are pre-filled in edit mode', () => {
			render(OrganisationFormPage, { data: editModeData });
			expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
		});
	});

	describe('Edit mode pre-fill', () => {
		it('pre-fills name and shortcode inputs from organisation data', () => {
			const { container } = render(OrganisationFormPage, { data: editModeData });
			const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
			const shortcodeInput = container.querySelector('input[name="shortcode"]') as HTMLInputElement;
			expect(nameInput).toHaveValue('Acme Corp');
			expect(shortcodeInput).toHaveValue('acme');
		});

		it('pre-fills description textarea from organisation data', () => {
			const { container } = render(OrganisationFormPage, { data: editModeData });
			const textarea = container.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
			expect(textarea).toHaveValue('A test organisation');
		});
	});

	describe('Status display', () => {
		it('shows "Active" status label when is_active is true', () => {
			render(OrganisationFormPage, { data: editModeData });
			expect(screen.getByText('Active')).toBeInTheDocument();
		});

		it('shows "Browse files" when no logo is selected', () => {
			render(OrganisationFormPage, { data: addModeData });
			expect(screen.getByText('Browse files')).toBeInTheDocument();
		});
	});
});
