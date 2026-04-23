import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { load, actions } from './+page.server';
import { invalidateOrganizationCache } from '$lib/server/organization-cache.js';

function makeCookies(overrides: Partial<Cookies> = {}): Cookies {
	return {
		get: vi.fn(() => undefined),
		getAll: vi.fn(() => []),
		set: vi.fn(),
		delete: vi.fn(),
		serialize: vi.fn(() => ''),
		...overrides
	} as unknown as Cookies;
}

// Mock environment variables
vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

// Mock supervalidate
vi.mock('sveltekit-superforms', () => ({
	superValidate: vi.fn(async (data, schema) => {
		// If data is a Request, extract form data
		if (data instanceof Request) {
			const formData = await data.formData();
			const formDataObj: Record<string, any> = {};
			formData.forEach((value, key) => {
				formDataObj[key] = value;
			});

			return {
				valid: true,
				data: formDataObj
			};
		}

		// For load functions
		return {
			valid: true,
			data: {}
		};
	})
}));

// Mock auth functions
vi.mock('$lib/server/auth.js', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token'),
	organizationCookieName: 'sashakt-organization',
	setOrganizationCookie: vi.fn()
}));

// Mock organization cache
vi.mock('$lib/server/organization-cache.js', () => ({
	invalidateOrganizationCache: vi.fn()
}));

// Mock flash message redirect
vi.mock('sveltekit-flash-message/server', () => ({
	redirect: vi.fn((status, path, message, cookies) => {
		const error: any = new Error('Redirect');
		error.status = status;
		error.location = path;
		error.message = message;
		throw error;
	})
}));

describe('Organization Page Server', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	describe('load()', () => {
		it('should fetch organization data successfully', async () => {
			const mockOrganization = {
				name: 'Test Org',
				shortcode: 'TST',
				logo: 'https://example.com/logo.png'
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockOrganization
			});

			const result = await load({ fetch: mockFetch, locals: { user: null } } as any);

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/organization/current',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						Authorization: 'Bearer mock-token'
					})
				})
			);
			expect(result.currentOrganization).toEqual(mockOrganization);
		});

		it('should return null organization data when fetch fails', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: 'Not Found'
			});

			const result = await load({ fetch: mockFetch, locals: { user: null } } as any);

			expect(result.currentOrganization).toBeNull();
		});

		it('should return null organization data when fetch throws', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			const result = await load({ fetch: mockFetch, locals: { user: null } } as any);

			expect(result.currentOrganization).toBeNull();
		});

		it('should return organization with logo URL', async () => {
			const mockOrganization = {
				name: 'Org With Logo',
				shortcode: 'OWL',
				logo: 'https://example.com/uploads/logo.png'
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockOrganization
			});

			const result = await load({ fetch: mockFetch, locals: { user: null } } as any);

			expect(result.currentOrganization?.logo).toBe('https://example.com/uploads/logo.png');
		});

		it('should return organization without logo', async () => {
			const mockOrganization = {
				name: 'Org Without Logo',
				shortcode: 'OWO',
				logo: null
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockOrganization
			});

			const result = await load({ fetch: mockFetch, locals: { user: null } } as any);

			expect(result.currentOrganization?.logo).toBeNull();
		});

		it('should expose platform_guide and analytics_link from settings', async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ name: 'Org', shortcode: 'org', logo: null })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						settings: {
							platform_guide: { value: { file_path: 'https://cdn.example.com/uploads/guide.pdf' } },
							analytics_link: { value: { url: 'https://lookerstudio.google.com/abc' } }
						}
					})
				});

			const result = await load({
				fetch: mockFetch,
				locals: { user: { organization_id: 42 } }
			} as any);

			expect(result.platformGuideUrl).toBe('https://cdn.example.com/uploads/guide.pdf');
			expect(result.platformGuideFilename).toBe('guide.pdf');
			expect(result.analyticsLinkUrl).toBe('https://lookerstudio.google.com/abc');
			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/organization/42/settings',
				expect.objectContaining({ method: 'GET' })
			);
		});
	});

	describe('actions.save', () => {
		it('should update organization without logo', async () => {
			const formData = new FormData();
			formData.append('name', 'Updated Org');
			formData.append('shortcode', 'UPD');

			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: formData
			});

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 1, name: 'Updated Org', shortcode: 'UPD' })
			});

			try {
				await actions.save({
					request: mockRequest,
					fetch: mockFetch,
					cookies: makeCookies(),
					locals: { user: null }
				} as any);
				expect.fail('Should have thrown redirect');
			} catch (error: any) {
				expect(error.location).toBe('/organization');
			}

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/organization/current',
				expect.objectContaining({
					method: 'PATCH',
					headers: expect.objectContaining({
						Authorization: 'Bearer mock-token'
					})
				})
			);
		});

		it('should update organization with logo upload', async () => {
			const logoFile = new File(['fake image content'], 'logo.png', { type: 'image/png' });

			const formData = new FormData();
			formData.append('name', 'Org With New Logo');
			formData.append('shortcode', 'OWN');
			formData.append('logo', logoFile);

			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: formData
			});

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					id: 1,
					name: 'Org With New Logo',
					shortcode: 'OWN',
					logo: 'https://example.com/uploads/logo.png'
				})
			});

			try {
				await actions.save({
					request: mockRequest,
					fetch: mockFetch,
					cookies: makeCookies(),
					locals: { user: null }
				} as any);
				expect.fail('Should have thrown redirect');
			} catch (error: any) {
				expect(error.location).toBe('/organization');
			}

			// Verify the fetch was called with FormData containing the logo
			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/organization/current',
				expect.objectContaining({
					method: 'PATCH'
				})
			);

			const callBody = mockFetch.mock.calls[0][1].body;
			expect(callBody).toBeInstanceOf(FormData);
		});

		it('should not append logo if file size is 0', async () => {
			const emptyFile = new File([], 'empty.png', { type: 'image/png' });

			const formData = new FormData();
			formData.append('name', 'Org No Logo');
			formData.append('shortcode', 'ONL');
			formData.append('logo', emptyFile);

			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: formData
			});

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 1, name: 'Org No Logo', shortcode: 'ONL' })
			});

			try {
				await actions.save({
					request: mockRequest,
					fetch: mockFetch,
					cookies: makeCookies(),
					locals: { user: null }
				} as any);
			} catch (error: any) {
				// Expected redirect
			}

			const callBody = mockFetch.mock.calls[0][1].body as FormData;
			// The logo should not be appended if size is 0
			expect(callBody.get('name')).toBe('Org No Logo');
		});

		it('should return fail(401) when backend responds with error', async () => {
			const formData = new FormData();
			formData.append('name', 'Test Org');
			formData.append('shortcode', 'TST');

			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: formData
			});

			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401
			});

			const result = await actions.save({
				request: mockRequest,
				fetch: mockFetch,
				cookies: makeCookies(),
				locals: { user: null }
			} as any);

			expect(result?.status).toBe(401);
		});

		it('should invalidate cache for previous and new shortcode when shortcode changes', async () => {
			const previousShortcode = 'old-code';
			const newShortcode = 'new-code';

			const formData = new FormData();
			formData.append('name', 'Renamed Org');
			formData.append('shortcode', newShortcode);

			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: formData
			});

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 1, name: 'Renamed Org', shortcode: newShortcode })
			});

			const cookies = makeCookies({
				get: vi.fn(() => previousShortcode)
			});

			try {
				await actions.save({
					request: mockRequest,
					fetch: mockFetch,
					cookies,
					locals: { user: null }
				} as any);
				expect.fail('Should have thrown redirect');
			} catch (error: any) {
				expect(error.location).toBe('/organization');
			}

			expect(invalidateOrganizationCache).toHaveBeenCalledWith(previousShortcode);
			expect(invalidateOrganizationCache).toHaveBeenCalledWith(newShortcode);
		});

		it('should upload platform guide PDF to the platform_guide endpoint', async () => {
			const pdfFile = new File(['%PDF-1.4 fake'], 'guide.pdf', { type: 'application/pdf' });
			const formData = new FormData();
			formData.append('name', 'Org');
			formData.append('shortcode', 'org');
			formData.append('platform_guide', pdfFile);

			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: formData
			});

			mockFetch
				// PATCH /organization/current
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) })
				// POST /organization/42/platform_guide
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				// GET /organization/42/settings (for analytics comparison)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						settings: { analytics_link: { value: { url: null } } }
					})
				});

			try {
				await actions.save({
					request: mockRequest,
					fetch: mockFetch,
					cookies: makeCookies(),
					locals: { user: { organization_id: 42 } }
				} as any);
			} catch {
				/* expected redirect */
			}

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/organization/42/platform_guide',
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({ Authorization: 'Bearer mock-token' })
				})
			);
		});

		it('should PUT settings when analytics_link changed', async () => {
			const formData = new FormData();
			formData.append('name', 'Org');
			formData.append('shortcode', 'org');
			formData.append('analytics_link', 'https://lookerstudio.google.com/new');

			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: formData
			});

			mockFetch
				// PATCH /organization/current
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) })
				// GET /organization/42/settings
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						settings: {
							version: 3,
							analytics_link: { value: { url: 'https://old.example.com' } }
						}
					})
				})
				// PUT /organization/42/settings
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			try {
				await actions.save({
					request: mockRequest,
					fetch: mockFetch,
					cookies: makeCookies(),
					locals: { user: { organization_id: 42 } }
				} as any);
			} catch {
				/* expected redirect */
			}

			const putCall = mockFetch.mock.calls.find(
				(c) => c[0] === 'http://localhost:8000/organization/42/settings' && c[1].method === 'PUT'
			);
			expect(putCall).toBeDefined();
			const body = JSON.parse(putCall![1].body);
			expect(body.settings.analytics_link.value.url).toBe('https://lookerstudio.google.com/new');
		});

		it('should not PUT settings when analytics_link is unchanged', async () => {
			const formData = new FormData();
			formData.append('name', 'Org');
			formData.append('shortcode', 'org');
			formData.append('analytics_link', 'https://same.example.com');

			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: formData
			});

			mockFetch
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) })
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						settings: {
							version: 3,
							analytics_link: { value: { url: 'https://same.example.com' } }
						}
					})
				});

			try {
				await actions.save({
					request: mockRequest,
					fetch: mockFetch,
					cookies: makeCookies(),
					locals: { user: { organization_id: 42 } }
				} as any);
			} catch {
				/* expected redirect */
			}

			const putCall = mockFetch.mock.calls.find(
				(c) => c[0] === 'http://localhost:8000/organization/42/settings' && c[1].method === 'PUT'
			);
			expect(putCall).toBeUndefined();
		});

		it('should redirect with success message after successful save', async () => {
			const formData = new FormData();
			formData.append('name', 'Success Org');
			formData.append('shortcode', 'SUC');

			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: formData
			});

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 1 })
			});

			try {
				await actions.save({
					request: mockRequest,
					fetch: mockFetch,
					cookies: makeCookies(),
					locals: { user: null }
				} as any);
				expect.fail('Should have thrown redirect');
			} catch (error: any) {
				expect(error.status).toBe(303);
				expect(error.location).toBe('/organization');
				expect(error.message).toEqual({
					type: 'success',
					message: 'Organization updated successfully.'
				});
			}
		});
	});
});
