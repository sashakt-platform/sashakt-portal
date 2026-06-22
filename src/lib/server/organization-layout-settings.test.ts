import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadOrganizationLayoutSettings } from './organization-layout-settings';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

vi.mock('./auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token')
}));

describe('loadOrganizationLayoutSettings', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		mockFetch.mockReset();
	});

	it('should return analytics and platform guide URLs from settings', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				settings: {
					analytics_link: { value: { url: 'https://lookerstudio.google.com/abc' } },
					platform_guide: { value: { file_path: 'https://cdn.example.com/guide.pdf' } }
				}
			})
		});

		const result = await loadOrganizationLayoutSettings(42, mockFetch);

		expect(result.analyticsLinkUrl).toBe('https://lookerstudio.google.com/abc');
		expect(result.platformGuideUrl).toBe('https://cdn.example.com/guide.pdf');
	});

	it('should call the correct API endpoint with bearer token', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ settings: {} })
		});

		await loadOrganizationLayoutSettings(99, mockFetch);

		expect(mockFetch).toHaveBeenCalledWith(
			'http://localhost:8000/organization/99/settings',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					Authorization: 'Bearer mock-token'
				})
			})
		);
	});

	it('should return null URLs when settings has no analytics or platform guide', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				settings: {
					some_other_setting: { value: 'test' }
				}
			})
		});

		const result = await loadOrganizationLayoutSettings(42, mockFetch);

		expect(result.analyticsLinkUrl).toBeNull();
		expect(result.platformGuideUrl).toBeNull();
	});

	it('should return fallback when API returns non-ok response', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500
		});

		const result = await loadOrganizationLayoutSettings(42, mockFetch);

		expect(result.analyticsLinkUrl).toBeNull();
		expect(result.platformGuideUrl).toBeNull();
		expect(result.platformNomenclature.mode).toBe('default');
	});

	it('should return fallback when fetch throws', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const result = await loadOrganizationLayoutSettings(42, mockFetch);

		expect(result.analyticsLinkUrl).toBeNull();
		expect(result.platformGuideUrl).toBeNull();
		expect(result.platformNomenclature.mode).toBe('default');
	});

	it('should return fallback when settings is null in response body', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ settings: null })
		});

		const result = await loadOrganizationLayoutSettings(42, mockFetch);

		expect(result.analyticsLinkUrl).toBeNull();
		expect(result.platformGuideUrl).toBeNull();
	});

	it('should parse platform nomenclature with custom mode', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				settings: {
					platform_nomenclature: {
						mode: 'custom',
						value: { tests: 'Exams', users: 'Participants' }
					}
				}
			})
		});

		const result = await loadOrganizationLayoutSettings(42, mockFetch);

		expect(result.platformNomenclature.mode).toBe('custom');
		expect(result.platformNomenclature.value.tests).toBe('Exams');
		expect(result.platformNomenclature.value.users).toBe('Participants');
	});

	it('should default nomenclature mode when mode is not custom', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				settings: {
					platform_nomenclature: {
						mode: 'something_else',
						value: {}
					}
				}
			})
		});

		const result = await loadOrganizationLayoutSettings(42, mockFetch);

		expect(result.platformNomenclature.mode).toBe('default');
	});
});
