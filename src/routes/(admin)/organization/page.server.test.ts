import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';

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
	getSessionTokenCookie: vi.fn(() => 'mock-token')
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

			const result = await load({ fetch: mockFetch } as any);

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

			const result = await load({ fetch: mockFetch } as any);

			expect(result.currentOrganization).toBeNull();
		});

		it('should return null organization data when fetch throws', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			const result = await load({ fetch: mockFetch } as any);

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

			const result = await load({ fetch: mockFetch } as any);

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

			const result = await load({ fetch: mockFetch } as any);

			expect(result.currentOrganization?.logo).toBeNull();
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
					cookies: {} as any
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
					cookies: {} as any
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
					cookies: {} as any
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
				cookies: {} as any
			} as any);

			expect(result?.status).toBe(401);
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
					cookies: {} as any
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
