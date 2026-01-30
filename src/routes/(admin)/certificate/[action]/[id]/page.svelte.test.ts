import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import CertificateFormPage from './+page.svelte';

vi.mock('sveltekit-superforms', () => ({
	superForm: vi.fn((data) => ({
		form: {
			subscribe: (fn) => {
				fn(
					data?.name !== undefined ? data : { name: '', description: '', url: '', is_active: true }
				);
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
		}
	}))
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn()
}));

const addModeData = {
	form: { valid: false, data: { name: '', description: '', url: '', is_active: true } },
	action: 'add',
	certificate: null,
	currentUser: { organization_id: 123 }
};

const editModeData = {
	...addModeData,
	action: 'edit',
	certificate: { name: 'Test', description: '', url: 'https://example.com', is_active: true }
};

describe('CertificateFormPage', () => {
	it('renders "Create Certificate" heading in add mode', () => {
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByRole('heading', { name: /create certificate/i })).toBeInTheDocument();
	});

	it('renders "Edit Certificate" heading in edit mode', () => {
		render(CertificateFormPage, { data: editModeData });
		expect(screen.getByRole('heading', { name: /edit certificate/i })).toBeInTheDocument();
	});

	it('renders all form fields', () => {
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByPlaceholderText('Enter certificate name')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText('Enter certificate URL (e.g., https://example.com)')
		).toBeInTheDocument();
		expect(screen.getByText('Is Active?')).toBeInTheDocument();
	});

	it('renders field labels', () => {
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByText('Name')).toBeInTheDocument();
		expect(screen.getByText('Description')).toBeInTheDocument();
		expect(screen.getByText('URL')).toBeInTheDocument();
	});

	it('renders Cancel button linking to certificate list', () => {
		const { container } = render(CertificateFormPage, { data: addModeData });
		const cancelLink = container.querySelector('a[href="/certificate/"]');
		expect(cancelLink).toBeInTheDocument();
		expect(cancelLink).toHaveTextContent('Cancel');
	});

	it('renders Save button', () => {
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
	});

	it('disables Save button when name and url are empty', () => {
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
	});

	it('enables Save button when name and url are provided', () => {
		render(CertificateFormPage, { data: editModeData });
		expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
	});

	it('form has correct POST method and action', () => {
		const { container } = render(CertificateFormPage, { data: addModeData });
		const form = container.querySelector('form');
		expect(form).toHaveAttribute('method', 'POST');
		expect(form).toHaveAttribute('action', '?/save');
	});

	it('populates form fields in edit mode', () => {
		render(CertificateFormPage, { data: editModeData });
		expect(screen.getByPlaceholderText('Enter certificate name')).toHaveValue('Test');
		expect(
			screen.getByPlaceholderText('Enter certificate URL (e.g., https://example.com)')
		).toHaveValue('https://example.com');
	});
});
