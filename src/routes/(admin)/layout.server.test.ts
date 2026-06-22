import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+layout.server';
import { loadOrganizationLayoutSettings } from '$lib/server/organization-layout-settings';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

vi.mock('$app/server', () => ({
	getRequestEvent: vi.fn(() => ({
		locals: {
			user: null,
			organization: null
		}
	}))
}));

vi.mock('$lib/server/organization-layout-settings', () => ({
	loadOrganizationLayoutSettings: vi.fn()
}));

const { getRequestEvent } = await import('$app/server');

describe('Admin Layout Server - load()', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return analyticsLinkUrl and platformGuideUrl from org settings when user has organization_id', async () => {
		vi.mocked(getRequestEvent).mockReturnValue({
			locals: {
				user: { organization_id: 42, permissions: [] },
				organization: { name: 'Test Org', shortcode: 'test' }
			}
		} as any);

		vi.mocked(loadOrganizationLayoutSettings).mockResolvedValue({
			platformNomenclature: { mode: 'default', value: {} as any },
			platformGuideUrl: 'https://cdn.example.com/guide.pdf',
			analyticsLinkUrl: 'https://lookerstudio.google.com/abc'
		});

		const result = await load({ fetch: mockFetch } as any);

		expect(loadOrganizationLayoutSettings).toHaveBeenCalledWith(42, mockFetch);
		expect(result.analyticsLinkUrl).toBe('https://lookerstudio.google.com/abc');
		expect(result.platformGuideUrl).toBe('https://cdn.example.com/guide.pdf');
	});

	it('should return null for analyticsLinkUrl and platformGuideUrl when user has no organization_id', async () => {
		vi.mocked(getRequestEvent).mockReturnValue({
			locals: {
				user: { permissions: [] },
				organization: null
			}
		} as any);

		const result = await load({ fetch: mockFetch } as any);

		expect(loadOrganizationLayoutSettings).not.toHaveBeenCalled();
		expect(result.analyticsLinkUrl).toBeNull();
		expect(result.platformGuideUrl).toBeNull();
	});

	it('should return null when user is null', async () => {
		vi.mocked(getRequestEvent).mockReturnValue({
			locals: {
				user: null,
				organization: null
			}
		} as any);

		const result = await load({ fetch: mockFetch } as any);

		expect(loadOrganizationLayoutSettings).not.toHaveBeenCalled();
		expect(result.analyticsLinkUrl).toBeNull();
		expect(result.platformGuideUrl).toBeNull();
	});

	it('should pass user and organization from locals to the result', async () => {
		const mockUser = { organization_id: 10, permissions: ['read_test'] };
		const mockOrganization = { name: 'Acme', shortcode: 'acme', logo: 'https://example.com/logo.png' };

		vi.mocked(getRequestEvent).mockReturnValue({
			locals: {
				user: mockUser,
				organization: mockOrganization
			}
		} as any);

		vi.mocked(loadOrganizationLayoutSettings).mockResolvedValue({
			platformNomenclature: { mode: 'default', value: {} as any },
			platformGuideUrl: null,
			analyticsLinkUrl: null
		});

		const result = await load({ fetch: mockFetch } as any);

		expect(result.user).toBe(mockUser);
		expect(result.organization).toBe(mockOrganization);
	});

	it('should return platformNomenclature from org settings', async () => {
		const customNomenclature = {
			mode: 'custom' as const,
			value: { tests: 'Exams', users: 'Participants' } as any
		};

		vi.mocked(getRequestEvent).mockReturnValue({
			locals: {
				user: { organization_id: 42, permissions: [] },
				organization: null
			}
		} as any);

		vi.mocked(loadOrganizationLayoutSettings).mockResolvedValue({
			platformNomenclature: customNomenclature,
			platformGuideUrl: null,
			analyticsLinkUrl: null
		});

		const result = await load({ fetch: mockFetch } as any);

		expect(result.platformNomenclature).toBe(customNomenclature);
	});
});
