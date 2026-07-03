import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import OrganizationSelection from './OrganizationSelection.svelte';

// Filteration.svelte is rendered for real (not mocked) here, so its bits-ui
// Command list needs scrollIntoView / pointer capture, neither of which
// jsdom implements.
Element.prototype.scrollIntoView ??= vi.fn();
Element.prototype.hasPointerCapture ??= vi.fn(() => false);
Element.prototype.releasePointerCapture ??= vi.fn();

const gotoMock = vi.fn();
vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => gotoMock(...args)
}));

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/users')
	}
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

function mockOrganizations(items: { id: number; name: string }[]) {
	mockFetch.mockResolvedValue({
		ok: true,
		json: async () => ({ items })
	});
}

describe('OrganizationSelection', () => {
	beforeEach(() => {
		mockFetch.mockReset();
		gotoMock.mockReset();
	});

	describe('Basic Rendering', () => {
		it('should render without errors', () => {
			mockOrganizations([]);

			const { container } = render(OrganizationSelection, {
				props: { organizations: [] }
			});

			expect(container).toBeInTheDocument();
		});

		it('should render with initial organizations', () => {
			mockOrganizations([]);

			const initialOrganizations = [
				{ id: '1', name: 'sashakt-app' },
				{ id: '2', name: 'tech4dev' }
			];

			const { container } = render(OrganizationSelection, {
				props: { organizations: initialOrganizations }
			});

			expect(container).toBeInTheDocument();
		});

		it('should render with empty organizations array', () => {
			mockOrganizations([]);

			const { container } = render(OrganizationSelection, {
				props: { organizations: [] }
			});

			expect(container).toBeInTheDocument();
		});
	});

	describe('Fetching organizations', () => {
		it('fetches from /api/filters/organizations on mount with an empty search', async () => {
			mockOrganizations([]);

			render(OrganizationSelection, { props: { organizations: [] } });

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith('/api/filters/organizations?search=');
			});
		});

		it('does not throw when the fetch response is not ok', async () => {
			mockFetch.mockResolvedValue({ ok: false, status: 422 });

			const { container } = render(OrganizationSelection, { props: { organizations: [] } });

			await waitFor(() => expect(mockFetch).toHaveBeenCalled());
			expect(container).toBeInTheDocument();
		});

		it('does not throw when fetch rejects', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			const { container } = render(OrganizationSelection, { props: { organizations: [] } });

			await waitFor(() => expect(mockFetch).toHaveBeenCalled());
			expect(container).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('should accept organizations prop', () => {
			mockOrganizations([]);

			const organizations = [{ id: '1', name: 'sashakt-app' }];

			const { container } = render(OrganizationSelection, {
				props: { organizations }
			});

			expect(container).toBeInTheDocument();
		});

		it('should accept and render with multiple/filteration passthrough props', () => {
			mockOrganizations([]);

			const { container } = render(OrganizationSelection, {
				props: { organizations: [], multiple: false, filteration: true }
			});

			expect(container).toBeInTheDocument();
		});
	});

	describe('Dropdown interaction', () => {
		it('shows the selected organization name in the trigger after picking it from the dropdown', async () => {
			mockOrganizations([{ id: 1, name: 'Org 1' }]);

			render(OrganizationSelection, {
				props: { organizations: [], multiple: false, filteration: true }
			});

			await waitFor(() => expect(mockFetch).toHaveBeenCalled());

			const trigger = screen.getByRole('combobox');
			await fireEvent.click(trigger);

			const option = await screen.findByText('Org 1');
			await fireEvent.click(option);

			expect(screen.getByRole('combobox')).toHaveTextContent('Org 1');
		});

		it('keeps Org 2 available in the dropdown after Org 1 has been selected', async () => {
			mockOrganizations([
				{ id: 1, name: 'Org 1' },
				{ id: 2, name: 'Org 2' }
			]);

			render(OrganizationSelection, {
				props: { organizations: [], multiple: false, filteration: true }
			});

			await waitFor(() => expect(mockFetch).toHaveBeenCalled());

			await fireEvent.click(screen.getByRole('combobox'));
			const org1Option = await screen.findByText('Org 1');
			await fireEvent.click(org1Option);

			expect(screen.getByRole('combobox')).toHaveTextContent('Org 1');

			await fireEvent.click(screen.getByRole('combobox'));
			expect(await screen.findByText('Org 2')).toBeInTheDocument();
		});

		it('writes organization_ids to the URL when a single organization is selected', async () => {
			mockOrganizations([{ id: 1, name: 'Org 1' }]);

			render(OrganizationSelection, {
				props: { organizations: [], multiple: false, filteration: true }
			});

			await waitFor(() => expect(mockFetch).toHaveBeenCalled());

			await fireEvent.click(screen.getByRole('combobox'));
			await fireEvent.click(await screen.findByText('Org 1'));

			await waitFor(() => expect(gotoMock).toHaveBeenCalled());
			const calledUrl = gotoMock.mock.calls[0][0] as URL;
			expect(calledUrl.searchParams.getAll('organization_ids')).toEqual(['1']);
		});
	});
});
