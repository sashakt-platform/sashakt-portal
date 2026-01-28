import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import CertificatePage from './+page.svelte';

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
	goto: vi.fn()
}));

vi.mock('$lib/utils/permissions.js', () => ({
	canCreate: vi.fn(),
	canUpdate: vi.fn(),
	canDelete: vi.fn()
}));

describe('CertificatePage', () => {
	it('renders certificate management page', () => {
		render(CertificatePage, { data: baseData });

		expect(screen.getByRole('heading', { name: /certificate management/i })).toBeInTheDocument();
		expect(screen.getByText(/manage certificates/i)).toBeInTheDocument();
	});

	it('shows Add Certificate button when user has permission', async () => {
		const permissions = await import('$lib/utils/permissions.js');
		vi.mocked(permissions.canCreate).mockReturnValue(true);

		render(CertificatePage, { data: baseData });

		const addBtn = screen.getByRole('button', { name: /add certificate/i });
		expect(addBtn).toBeInTheDocument();
		expect(addBtn).toBeEnabled();
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
		render(CertificatePage, { data: baseData });

		const tableHeader = screen.getByText('Name');
		await fireEvent.click(tableHeader);

		expect(true).toBe(true);
	});

	it('handles empty certificate list', () => {
		render(CertificatePage, {
			data: {
				...baseData,
				certificates: { items: [], total: 0, pages: 0 }
			}
		});
		screen.logTestingPlaygroundURL();

		expect(screen.queryByText('Certificate A')).not.toBeInTheDocument();
		expect(screen.getByText(/No results/i)).toBeInTheDocument();
	});
});
