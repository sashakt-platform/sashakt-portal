import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import IntegrationsPage from './+page.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidateAll: vi.fn()
}));

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/organization/integrations') }
}));

vi.mock('$lib/utils/permissions.js', () => ({
	canCreate: vi.fn(),
	canDelete: vi.fn()
}));

const mockProviders = [
	{
		id: 1,
		organization_id: 10,
		provider_id: 101,
		is_enabled: true,
		last_sync_timestamp: '2024-01-15T10:00:00Z',
		created_date: '2024-01-01T00:00:00Z',
		modified_date: '2024-01-10T00:00:00Z',
		provider: {
			id: 101,
			name: 'Google Sheets',
			provider_type: 'sheets',
			description: 'Sync data with Google Sheets',
			is_active: true,
			created_date: '2024-01-01T00:00:00Z',
			modified_date: '2024-01-01T00:00:00Z'
		}
	},
	{
		id: 2,
		organization_id: 10,
		provider_id: 102,
		is_enabled: false,
		last_sync_timestamp: null,
		created_date: '2024-01-01T00:00:00Z',
		modified_date: '2024-01-05T00:00:00Z',
		provider: {
			id: 102,
			name: 'Twilio',
			provider_type: 'sms',
			description: null,
			is_active: true,
			created_date: '2024-01-01T00:00:00Z',
			modified_date: '2024-01-01T00:00:00Z'
		}
	}
];

function makeData(overrides: Record<string, unknown> = {}) {
	return {
		providers: mockProviders,
		user: { id: 1, organization_id: 10, permissions: [] },
		...overrides
	};
}

describe('Integrations Page (+page.svelte)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const permissions = await import('$lib/utils/permissions.js');
		vi.mocked(permissions.canCreate).mockReturnValue(false);
		vi.mocked(permissions.canDelete).mockReturnValue(false);
	});

	describe('Page structure', () => {
		it('renders the "Integrations" heading', () => {
			render(IntegrationsPage, { data: makeData() } as never);
			expect(screen.getByRole('heading', { name: /integrations/i })).toBeInTheDocument();
		});
	});

	describe('Add Provider button', () => {
		it('shows the Add Provider button when the user has create permission', async () => {
			const permissions = await import('$lib/utils/permissions.js');
			vi.mocked(permissions.canCreate).mockReturnValue(true);

			render(IntegrationsPage, { data: makeData() } as never);
			expect(screen.getByText(/add provider/i)).toBeInTheDocument();
		});

		it('hides the Add Provider button when the user lacks create permission', async () => {
			const permissions = await import('$lib/utils/permissions.js');
			vi.mocked(permissions.canCreate).mockReturnValue(false);

			render(IntegrationsPage, { data: makeData() } as never);
			expect(screen.queryByText(/add provider/i)).not.toBeInTheDocument();
		});

		it('links the Add Provider button to the add route', async () => {
			const permissions = await import('$lib/utils/permissions.js');
			vi.mocked(permissions.canCreate).mockReturnValue(true);

			render(IntegrationsPage, { data: makeData() } as never);
			const link = screen.getByRole('link', { name: /add provider/i });
			expect(link).toHaveAttribute('href', '/organization/integrations/add/new');
		});
	});

	describe('Data table content', () => {
		it('renders each provider name, type and description', () => {
			render(IntegrationsPage, { data: makeData() } as never);
			expect(screen.getByText('Google Sheets')).toBeInTheDocument();
			expect(screen.getByText('sheets')).toBeInTheDocument();
			expect(screen.getByText('Sync data with Google Sheets')).toBeInTheDocument();
			expect(screen.getByText('Twilio')).toBeInTheDocument();
			expect(screen.getByText('sms')).toBeInTheDocument();
		});

		it('shows an "Active" status badge for enabled providers', () => {
			render(IntegrationsPage, { data: makeData() } as never);
			expect(screen.getByText('Active')).toBeInTheDocument();
		});

		it('shows an "Inactive" status badge for disabled providers', () => {
			render(IntegrationsPage, { data: makeData() } as never);
			expect(screen.getByText('Inactive')).toBeInTheDocument();
		});

		it('shows "Never" for a provider that has not synced yet', () => {
			render(IntegrationsPage, { data: makeData() } as never);
			expect(screen.getByText('Never')).toBeInTheDocument();
		});

		it('renders without crashing when the providers list is empty', () => {
			render(IntegrationsPage, { data: makeData({ providers: [] }) } as never);
			expect(screen.getByText(/no results/i)).toBeInTheDocument();
		});
	});

	describe('Row delete action', () => {
		it('shows a delete action for each row when the user has delete permission', async () => {
			const permissions = await import('$lib/utils/permissions.js');
			vi.mocked(permissions.canDelete).mockReturnValue(true);

			const { container } = render(IntegrationsPage, { data: makeData() } as never);
			expect(container.querySelectorAll('[aria-label="Delete"]')).toHaveLength(2);
		});

		it('hides the delete action for each row when the user lacks delete permission', async () => {
			const permissions = await import('$lib/utils/permissions.js');
			vi.mocked(permissions.canDelete).mockReturnValue(false);

			const { container } = render(IntegrationsPage, { data: makeData() } as never);
			expect(container.querySelectorAll('[aria-label="Delete"]')).toHaveLength(0);
		});
	});
});
