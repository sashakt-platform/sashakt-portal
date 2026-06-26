import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import CertificatePage from './+page.svelte';
import { setCustomNomenclature, resetNomenclature } from '$lib/test-utils/nomenclature-mock';

const baseData = {
	certificates: {
		items: [
			{ id: 1, name: 'Certificate A' },
			{ id: 2, name: 'Certificate B' }
		],
		total: 2,
		pages: 1,
		totalPages: 1
	},
	params: { page: 1, size: 10, search: '', sortBy: '', sortOrder: 'asc' },
	user: { organization_id: 123, roles: ['admin'] }
};

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));

vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => () => {})
}));

vi.mock('$lib/utils/permissions.js', () => ({
	canCreate: vi.fn(),
	canUpdate: vi.fn(),
	canDelete: vi.fn()
}));

vi.mock('$lib/nomenclature', async () => {
	const { createNomenclatureMock } = await import('$lib/test-utils/nomenclature-mock');
	return createNomenclatureMock();
});

describe('CertificatePage', () => {
	it('renders certificate management page', () => {
		render(CertificatePage, { data: baseData });

		expect(screen.getByRole('heading', { name: /Certificates/i })).toBeInTheDocument();
	});

	it('shows Add Certificate button when user has permission', async () => {
		const permissions = await import('$lib/utils/permissions.js');
		vi.mocked(permissions.canCreate).mockReturnValue(true);

		render(CertificatePage, { data: baseData });

		const createBtn = screen.getByText(/Create Certificate/i);
		expect(createBtn).toBeInTheDocument();
	});
	it('does NOT show Add Certificate button when user does not have permission', async () => {
		const permissions = await import('$lib/utils/permissions.js');
		vi.mocked(permissions.canCreate).mockReturnValue(false);

		render(CertificatePage, { data: baseData });

		const addBtn = screen.queryByRole('button', { name: /add certificate/i });
		expect(addBtn).not.toBeInTheDocument();
	});

	it('renders data table with certificates', () => {
		render(CertificatePage, { data: baseData });

		expect(screen.getByText('Certificate A')).toBeInTheDocument();
		expect(screen.getByText('Certificate B')).toBeInTheDocument();
	});

	it('filters certificates on search input', async () => {
		render(CertificatePage, { data: baseData });

		const searchInput = screen.getByPlaceholderText('Search certificates...') as HTMLInputElement;
		await fireEvent.input(searchInput, { target: { value: 'Certificate B' } });

		expect(searchInput.value).toBe('Certificate B');
	});

	it('sorts certificates on column click', async () => {
		const { goto } = await import('$app/navigation');
		render(CertificatePage, { data: baseData });

		const tableHeader = screen.getByText('NAME');
		await fireEvent.click(tableHeader);

		expect(goto).toHaveBeenCalledOnce();
		const calledUrl = (goto as ReturnType<typeof vi.fn>).mock.calls[0][0] as URL;
		expect(calledUrl.searchParams.get('sortBy')).toBe('name');
		expect(calledUrl.searchParams.get('sortOrder')).toBe('asc');
		expect(calledUrl.searchParams.get('page')).toBe('1');
	});

	it('handles empty certificate list', () => {
		render(CertificatePage, {
			data: {
				...baseData,
				certificates: { items: [], total: 0, pages: 0 }
			}
		});
		expect(screen.queryByText('Certificate A')).not.toBeInTheDocument();
		expect(screen.getByText(/No certificates yet/i)).toBeInTheDocument();
	});
});

describe('CertificatePage – bulk delete feature', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('mounts a hidden batch-delete form in the DOM', () => {
		const { container } = render(CertificatePage, { data: baseData });
		expect(container.querySelector('#batch-delete-form')).toBeInTheDocument();
	});

	it('hidden batch-delete form posts to the batchDelete action', () => {
		const { container } = render(CertificatePage, { data: baseData });
		const form = container.querySelector('#batch-delete-form') as HTMLFormElement;
		expect(form.getAttribute('action')).toBe('?/batchDelete');
		expect(form.getAttribute('method')).toBe('POST');
	});

	it('includes a hidden certificateIds input inside the batch-delete form', () => {
		const { container } = render(CertificatePage, { data: baseData });
		const input = container.querySelector('#batch-delete-form input[name="certificateIds"]');
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute('type', 'hidden');
	});

	it('renders a "Select all" checkbox and one per-row checkbox when certificates exist', () => {
		render(CertificatePage, { data: baseData });
		expect(screen.getByLabelText('Select all')).toBeInTheDocument();
		expect(screen.getAllByLabelText('Select row')).toHaveLength(2);
	});

	it('does not render selection checkboxes when the certificate list is empty', () => {
		render(CertificatePage, {
			data: {
				...baseData,
				certificates: { items: [], total: 0, pages: 0 }
			}
		});
		expect(screen.queryByLabelText('Select all')).not.toBeInTheDocument();
		expect(screen.queryAllByLabelText('Select row')).toHaveLength(0);
	});

	it('shows the search filter when no certificates are selected', () => {
		render(CertificatePage, { data: baseData });
		expect(screen.getByPlaceholderText('Search certificates...')).toBeInTheDocument();
	});

	it('initial certificateIds value is an empty JSON array', () => {
		const { container } = render(CertificatePage, { data: baseData });
		const input = container.querySelector(
			'#batch-delete-form input[name="certificateIds"]'
		) as HTMLInputElement;
		expect(input.value).toBe('[]');
	});
});

describe('CertificatePage – Custom nomenclature labels', () => {
	afterEach(() => {
		resetNomenclature();
	});

	it('renders custom page heading when certificates is overridden', () => {
		setCustomNomenclature({ certificates: 'Awards' });
		render(CertificatePage, { data: baseData });
		expect(screen.getByRole('heading', { name: /Awards/i })).toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: /Certificates/i })).not.toBeInTheDocument();
	});

	it('renders custom create button label when certificate is overridden', async () => {
		setCustomNomenclature({ certificate: 'Award' });
		const permissions = await import('$lib/utils/permissions.js');
		vi.mocked(permissions.canCreate).mockReturnValue(true);
		render(CertificatePage, { data: baseData });
		expect(screen.getByText(/Create Award/i)).toBeInTheDocument();
	});

	it('renders custom empty state text when certificates/certificate are overridden', () => {
		setCustomNomenclature({ certificates: 'Awards', certificate: 'Award' });
		render(CertificatePage, {
			data: {
				...baseData,
				certificates: { items: [], total: 0, pages: 0 }
			}
		});
		expect(screen.getByText(/No awards yet/i)).toBeInTheDocument();
	});

	it('renders custom search placeholder when certificates is overridden', () => {
		setCustomNomenclature({ certificates: 'Awards' });
		render(CertificatePage, { data: baseData });
		expect(screen.getByPlaceholderText('Search awards...')).toBeInTheDocument();
	});

	it('renders custom test label in empty state description', () => {
		setCustomNomenclature({ certificates: 'Awards', certificate: 'Award', test: 'Exam' });
		render(CertificatePage, {
			data: {
				...baseData,
				certificates: { items: [], total: 0, pages: 0 }
			}
		});
		expect(screen.getByText(/complete a exam/i)).toBeInTheDocument();
	});

	it('falls back to defaults when no custom nomenclature is set', () => {
		render(CertificatePage, { data: baseData });
		expect(screen.getByRole('heading', { name: /Certificates/i })).toBeInTheDocument();
	});
});
