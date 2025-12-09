import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';

// Mock environment variables
vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

describe('Reset Password Route', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	describe('load()', () => {
		it('should return form with token from URL', async () => {
			const url = new URL('http://localhost/reset-password?token=test-token-123');

			const result = await load({ url } as any);

			expect(result).toHaveProperty('form');
			expect(result.form.data.token).toBe('test-token-123');
		});

		it('should return empty token when not provided in URL', async () => {
			const url = new URL('http://localhost/reset-password');

			const result = await load({ url } as any);

			expect(result.form.data.token).toBe('');
		});

		it('should initialize form with empty password fields', async () => {
			const url = new URL('http://localhost/reset-password?token=test-token');

			const result = await load({ url } as any);

			expect(result.form.data.password).toBe('');
			expect(result.form.data.confirm_password).toBe('');
		});
	});

	describe('actions.update', () => {
		it('should fail with 400 when password is too short', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					password: 'short',
					confirm_password: 'short',
					token: 'valid-token'
				})
			});

			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			const result = await actions.update({
				request: mockRequest,
				cookies: mockCookies
			} as any);

			expect(result.status).toBe(400);
			expect(result.data.form.valid).toBe(false);
		});

		it('should fail with 400 when passwords do not match', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					password: 'password123',
					confirm_password: 'different123',
					token: 'valid-token'
				})
			});

			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			const result = await actions.update({
				request: mockRequest,
				cookies: mockCookies
			} as any);

			expect(result.status).toBe(400);
			expect(result.data.form.valid).toBe(false);
			expect(result.data.form.errors.confirm_password).toContain('Passwords must match');
		});

		it('should fail with 400 when token is missing', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					password: 'password123',
					confirm_password: 'password123',
					token: ''
				})
			});

			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			const result = await actions.update({
				request: mockRequest,
				cookies: mockCookies
			} as any);

			expect(result.status).toBe(400);
			expect(result.data.form.valid).toBe(false);
		});

		it('should successfully update password and redirect to login', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					password: 'newpassword123',
					confirm_password: 'newpassword123',
					token: 'valid-token'
				})
			});

			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					message: 'Password updated successfully'
				})
			});

			try {
				await actions.update({
					request: mockRequest,
					cookies: mockCookies
				} as any);
				expect.fail('Should have thrown a redirect');
			} catch (error: any) {
				expect(error.status).toBe(303);
				expect(error.location).toBe('/login');
			}
		});

		it('should call backend with correct payload', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					password: 'newpassword123',
					confirm_password: 'newpassword123',
					token: 'my-reset-token'
				})
			});

			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({})
			});

			try {
				await actions.update({
					request: mockRequest,
					cookies: mockCookies
				} as any);
			} catch (error) {
				// Expected redirect
			}

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/reset-password/',
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' }
				})
			);

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(callBody.new_password).toBe('newpassword123');
			expect(callBody.token).toBe('my-reset-token');
		});

		it('should fail when backend returns invalid token error', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					password: 'newpassword123',
					confirm_password: 'newpassword123',
					token: 'expired-token'
				})
			});

			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			mockFetch.mockResolvedValue({
				ok: false,
				status: 400,
				json: async () => ({
					detail: 'Invalid or expired token'
				})
			});

			const result = await actions.update({
				request: mockRequest,
				cookies: mockCookies
			} as any);

			expect(result.status).toBe(400);
			expect(result.data.form.errors.password).toEqual(['Invalid or expired token']);
		});

		it('should use default error message when backend detail is missing', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					password: 'newpassword123',
					confirm_password: 'newpassword123',
					token: 'some-token'
				})
			});

			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				json: async () => ({})
			});

			const result = await actions.update({
				request: mockRequest,
				cookies: mockCookies
			} as any);

			expect(result.status).toBe(500);
			expect(result.data.form.errors.password).toEqual(['Failed to update password']);
		});
	});
});
