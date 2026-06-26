import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import CertificateFormPage from './+page.svelte';
import { superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { createCertificateSchema, editCertificateSchema } from './schema.js';
import { setCustomNomenclature, resetNomenclature } from '$lib/test-utils/nomenclature-mock';

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
		},
		enhance: () => ({})
	}))
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn()
}));

vi.mock('./schema.js', () => ({
	createCertificateSchema: 'createSchema',
	editCertificateSchema: 'editSchema',
	certificateSchema: 'createSchema'
}));

vi.mock('$lib/nomenclature', async () => {
	const { createNomenclatureMock } = await import('$lib/test-utils/nomenclature-mock');
	return createNomenclatureMock();
});

function makeFormStore(values: Record<string, unknown>, errors: Record<string, string> = {}) {
	vi.mocked(superForm).mockImplementationOnce(() => ({
		form: {
			subscribe: (fn: (v: unknown) => void) => { fn(values); return () => {}; },
			set: () => {},
			update: () => {}
		},
		errors: {
			subscribe: (fn: (v: unknown) => void) => { fn(errors); return () => {}; },
			set: () => {},
			update: () => {}
		},
		enhance: () => ({})
	}));
}

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

	it('renders field labels', () => {
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByText('Certificate Name')).toBeInTheDocument();
		expect(screen.getByText('Description')).toBeInTheDocument();
		expect(screen.getByText('Certificate URL')).toBeInTheDocument();
		expect(screen.getByText('Certificate Status')).toBeInTheDocument();
	});

	it('renders back link to certificate list', () => {
		const { container } = render(CertificateFormPage, { data: addModeData });
		const backLink = container.querySelector('a[href="/certificate"]');
		expect(backLink).toBeInTheDocument();
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
		const { container } = render(CertificateFormPage, { data: editModeData });
		const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
		const urlInput = container.querySelector('input[name="url"]') as HTMLInputElement;
		expect(nameInput).toBeInTheDocument();
		expect(nameInput).toHaveValue('Test');
		expect(urlInput).toBeInTheDocument();
		expect(urlInput).toHaveValue('https://example.com');
	});

	it('disables Save when name is empty but URL is present', () => {
		makeFormStore({ name: '', url: 'https://example.com', description: '', is_active: true });
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
	});

	it('disables Save when URL is empty but name is present', () => {
		makeFormStore({ name: 'My Cert', url: '', description: '', is_active: true });
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
	});

	it('disables Save when name is whitespace only', () => {
		makeFormStore({ name: '   ', url: 'https://example.com', description: '', is_active: true });
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
	});

	// --- is_active status text ---

	it('shows "Active" status text when is_active is true', () => {
		makeFormStore({ name: 'Cert', url: 'https://x.com', description: '', is_active: true });
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByText('Active')).toBeInTheDocument();
	});

	it('shows "Inactive" status text when is_active is false', () => {
		makeFormStore({ name: 'Cert', url: 'https://x.com', description: '', is_active: false });
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByText('Inactive')).toBeInTheDocument();
	});

	// --- validation error messages ---

	it('shows name error message when errors.name is set', () => {
		makeFormStore(
			{ name: '', url: '', description: '', is_active: true },
			{ name: 'Certificate name is required' }
		);
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByText('Certificate name is required')).toBeInTheDocument();
	});

	it('shows URL error message when errors.url is set', () => {
		makeFormStore(
			{ name: 'Cert', url: 'not-a-url', description: '', is_active: true },
			{ url: 'Please enter a valid URL' }
		);
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
	});

	// --- section heading & description field ---

	it('renders "Certificate Details" section heading', () => {
		render(CertificateFormPage, { data: addModeData });
		expect(screen.getByText('Certificate Details')).toBeInTheDocument();
	});

	it('renders description textarea', () => {
		const { container } = render(CertificateFormPage, { data: addModeData });
		expect(container.querySelector('textarea[name="description"]')).toBeInTheDocument();
	});

	it('pre-populates description textarea in edit mode', () => {
		const dataWithDesc = {
			...editModeData,
			certificate: { name: 'Test', description: 'Some desc', url: 'https://example.com', is_active: true }
		};
		makeFormStore({ name: 'Test', description: 'Some desc', url: 'https://example.com', is_active: true });
		const { container } = render(CertificateFormPage, { data: dataWithDesc });
		const textarea = container.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
		expect(textarea).toHaveValue('Some desc');
	});

	// --- correct validator selected ---

	it('passes createCertificateSchema to zod4Client in add mode', () => {
		render(CertificateFormPage, { data: addModeData });
		expect(vi.mocked(zod4Client)).toHaveBeenCalledWith(createCertificateSchema);
	});

	it('passes editCertificateSchema to zod4Client in edit mode', () => {
		render(CertificateFormPage, { data: editModeData });
		expect(vi.mocked(zod4Client)).toHaveBeenCalledWith(editCertificateSchema);
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Custom nomenclature labels', () => {
		afterEach(() => {
			resetNomenclature();
		});

		it('renders custom heading in add mode when certificate is overridden', () => {
			setCustomNomenclature({ certificate: 'Award' });
			render(CertificateFormPage, { data: addModeData });
			expect(screen.getByRole('heading', { name: /create award/i })).toBeInTheDocument();
			expect(screen.queryByRole('heading', { name: /create certificate/i })).not.toBeInTheDocument();
		});

		it('renders custom heading in edit mode when certificate is overridden', () => {
			setCustomNomenclature({ certificate: 'Award' });
			render(CertificateFormPage, { data: editModeData });
			expect(screen.getByRole('heading', { name: /edit award/i })).toBeInTheDocument();
		});

		it('renders custom field labels when certificate is overridden', () => {
			setCustomNomenclature({ certificate: 'Award' });
			render(CertificateFormPage, { data: addModeData });
			expect(screen.getByText('Award Name')).toBeInTheDocument();
			expect(screen.getByText('Award URL')).toBeInTheDocument();
			expect(screen.getByText('Award Status')).toBeInTheDocument();
		});

		it('renders custom section heading when certificate is overridden', () => {
			setCustomNomenclature({ certificate: 'Award' });
			render(CertificateFormPage, { data: addModeData });
			expect(screen.getByText('Award Details')).toBeInTheDocument();
			expect(screen.queryByText('Certificate Details')).not.toBeInTheDocument();
		});

		it('renders custom back link label when certificates is overridden', () => {
			setCustomNomenclature({ certificates: 'Awards' });
			const { container } = render(CertificateFormPage, { data: addModeData });
			const backLink = container.querySelector('a[aria-label="Back to awards"]');
			expect(backLink).toBeInTheDocument();
		});

		it('falls back to defaults when no custom nomenclature is set', () => {
			render(CertificateFormPage, { data: addModeData });
			expect(screen.getByRole('heading', { name: /create certificate/i })).toBeInTheDocument();
			expect(screen.getByText('Certificate Details')).toBeInTheDocument();
		});
	});
});
