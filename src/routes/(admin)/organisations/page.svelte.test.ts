import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import OrganisationsPage from './+page.svelte';

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/organisations')
	}
}));

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

vi.mock('$lib/utils/permissions.js', () => ({
	canCreate: vi.fn(() => false)
}));

import { canCreate } from '$lib/utils/permissions.js';
import { page } from '$app/state';
import { goto } from '$app/navigation';

const baseData = {
	organisations: {
		items: [
			{
				id: 1,
				name: 'Acme Corp',
				shortcode: 'acme',
				users_count: 10,
				is_active: true,
				modified_date: '2026-01-01'
			},
			{
				id: 2,
				name: 'Beta Ltd',
				shortcode: 'beta',
				users_count: 5,
				is_active: false,
				modified_date: '2026-01-02'
			}
		],
		total: 2,
		pages: 1
	},
	totalPages: 1,
	params: { page: 1, size: 25, search: '', sortBy: '', sortOrder: 'asc', isActive: '' },
	user: { id: 1, permissions: [] }
};

const emptyData = {
	organisations: { items: [], total: 0, pages: 0 },
	totalPages: 0,
	params: { page: 1, size: 25, search: '', sortBy: '', sortOrder: 'asc', isActive: '' },
	user: { id: 1, permissions: [] }
};

describe('OrganisationsPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		page.url = new URL('http://localhost/organisations');
	});

	describe('Page header', () => {
		it('renders the page title', () => {
			render(OrganisationsPage, { data: baseData });

			expect(screen.getByRole('heading', { name: /Select Organisation/i })).toBeInTheDocument();
		});

		it('shows Add Organisation button when user has create permission', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(OrganisationsPage, { data: baseData });

			expect(screen.getByRole('button', { name: /Add Organisation/i })).toBeInTheDocument();
		});

		it('hides Add Organisation button when user lacks create permission', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(OrganisationsPage, { data: baseData });

			expect(screen.queryByRole('button', { name: /Add Organisation/i })).not.toBeInTheDocument();
		});

		it('Add Organisation button links to the add route', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			const { container } = render(OrganisationsPage, { data: baseData });

			const link = container.querySelector('a[href="/organisations/add/new"]');
			expect(link).toBeInTheDocument();
		});
	});

	describe('Search input', () => {
		it('renders search input with correct placeholder', () => {
			render(OrganisationsPage, { data: baseData });

			expect(screen.getByPlaceholderText('Search organisations...')).toBeInTheDocument();
		});

		it('search input accepts user input', async () => {
			render(OrganisationsPage, { data: baseData });

			const input = screen.getByPlaceholderText('Search organisations...') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: 'Acme' } });

			expect(input.value).toBe('Acme');
		});

		it('renders search input pre-filled when search param is set', () => {
			render(OrganisationsPage, {
				data: {
					...baseData,
					params: { ...baseData.params, search: 'Beta' }
				}
			});

			const input = screen.getByPlaceholderText('Search organisations...') as HTMLInputElement;
			expect(input.value).toBe('Beta');
		});
	});

	describe('Status filter', () => {
		it('renders Status button with default label', () => {
			render(OrganisationsPage, { data: baseData });

			expect(screen.getByRole('button', { name: /Status/i })).toBeInTheDocument();
		});

		it('shows "Active" label when isActive filter is true', () => {
			render(OrganisationsPage, {
				data: {
					...baseData,
					params: { ...baseData.params, isActive: 'true' }
				}
			});

			expect(screen.getByRole('button', { name: /Active/i })).toBeInTheDocument();
		});

		it('shows "Inactive" label when isActive filter is false', () => {
			render(OrganisationsPage, {
				data: {
					...baseData,
					params: { ...baseData.params, isActive: 'false' }
				}
			});

			expect(screen.getByRole('button', { name: /Inactive/i })).toBeInTheDocument();
		});

		it('opens status popover and shows options on trigger click', async () => {
			render(OrganisationsPage, { data: baseData });

			const trigger = screen.getByRole('button', { name: /Status/i });
			await fireEvent.click(trigger);

			expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Inactive' })).toBeInTheDocument();
		});

		it('calls goto with isActive=true when Active option is clicked', async () => {
			render(OrganisationsPage, { data: baseData });

			const trigger = screen.getByRole('button', { name: /Status/i });
			await fireEvent.click(trigger);

			const activeOption = screen.getByRole('button', { name: 'Active' });
			await fireEvent.click(activeOption);

			expect(goto).toHaveBeenCalled();
			const calledUrl = vi.mocked(goto).mock.calls[0][0] as string;
			expect(calledUrl).toContain('isActive=true');
			expect(calledUrl).toContain('page=1');
		});

		it('calls goto with isActive=false when Inactive option is clicked', async () => {
			render(OrganisationsPage, { data: baseData });

			const trigger = screen.getByRole('button', { name: /Status/i });
			await fireEvent.click(trigger);

			// Only the popover option is a button named "Inactive"; the table badge is a span
			const inactiveOption = screen.getByRole('button', { name: 'Inactive' });
			await fireEvent.click(inactiveOption);

			expect(goto).toHaveBeenCalled();
			const calledUrl = vi.mocked(goto).mock.calls[0][0] as string;
			expect(calledUrl).toContain('isActive=false');
		});

		it('removes isActive param when the same status is clicked again', async () => {
			render(OrganisationsPage, {
				data: {
					...baseData,
					params: { ...baseData.params, isActive: 'true' }
				}
			});

			const triggerBtn = screen.getAllByRole('button', { name: /Active/i })[0];
			await fireEvent.click(triggerBtn);

			const allActiveButtons = screen.getAllByRole('button', { name: 'Active' });
			const popoverOption = allActiveButtons[allActiveButtons.length - 1];
			await fireEvent.click(popoverOption);

			const calledUrl = vi.mocked(goto).mock.calls[0][0] as string;
			expect(calledUrl).not.toContain('isActive');
		});
	});

	describe('Table data', () => {
		it('renders organisation names from data', () => {
			render(OrganisationsPage, { data: baseData });

			expect(screen.getByText('Acme Corp')).toBeInTheDocument();
			expect(screen.getByText('Beta Ltd')).toBeInTheDocument();
		});

		it('renders organisation shortcodes', () => {
			render(OrganisationsPage, { data: baseData });

			expect(screen.getByText('acme')).toBeInTheDocument();
			expect(screen.getByText('beta')).toBeInTheDocument();
		});

		it('renders user counts', () => {
			render(OrganisationsPage, { data: baseData });

			expect(screen.getByText('10')).toBeInTheDocument();
			expect(screen.getByText('5')).toBeInTheDocument();
		});
	});

	describe('Sorting', () => {
		it('calls goto with sortBy=name when Organisations column is clicked', async () => {
			render(OrganisationsPage, { data: baseData });

			const nameHeader = screen.getByText('Organisations').closest('button');
			expect(nameHeader).toBeTruthy();
			await fireEvent.click(nameHeader!);

			expect(goto).toHaveBeenCalled();
			const calledUrl = vi.mocked(goto).mock.calls[0][0] as string;
			expect(calledUrl).toContain('sortBy=name');
			expect(calledUrl).toContain('sortOrder=asc');
			expect(calledUrl).toContain('page=1');
		});

		it('toggles sort order to desc when same column is clicked again', async () => {
			render(OrganisationsPage, {
				data: {
					...baseData,
					params: { ...baseData.params, sortBy: 'name', sortOrder: 'asc' }
				}
			});

			const nameHeader = screen.getByText('Organisations').closest('button');
			await fireEvent.click(nameHeader!);

			const calledUrl = vi.mocked(goto).mock.calls[0][0] as string;
			expect(calledUrl).toContain('sortOrder=desc');
		});

		it('calls goto with sortBy=shortcode when Shortcode column is clicked', async () => {
			render(OrganisationsPage, { data: baseData });

			const shortcodeHeader = screen.getByText('Shortcode').closest('button');
			expect(shortcodeHeader).toBeTruthy();
			await fireEvent.click(shortcodeHeader!);

			expect(goto).toHaveBeenCalled();
			const calledUrl = vi.mocked(goto).mock.calls[0][0] as string;
			expect(calledUrl).toContain('sortBy=shortcode');
		});
	});

	describe('Empty state', () => {
		it('shows empty state when organisations list is empty', () => {
			render(OrganisationsPage, { data: emptyData });

			expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
		});

		it('renders without error when organisations is null', () => {
			render(OrganisationsPage, {
				data: { ...baseData, organisations: null }
			});

			expect(screen.getByRole('heading', { name: /Select Organisation/i })).toBeInTheDocument();
		});
	});

	describe('Pagination', () => {
		it('shows pagination controls', () => {
			render(OrganisationsPage, { data: baseData });

			expect(screen.getByText('Previous')).toBeInTheDocument();
			expect(screen.getByText('Next')).toBeInTheDocument();
		});

		it('disables Previous button on first page', () => {
			render(OrganisationsPage, { data: baseData });

			expect(screen.getByText('Previous')).toBeDisabled();
		});

		it('shows rows info text', () => {
			render(OrganisationsPage, { data: baseData });

			expect(screen.getByText(/Showing 1 to/)).toBeInTheDocument();
		});
	});
});
