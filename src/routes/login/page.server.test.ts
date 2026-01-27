import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { setSessionTokenCookie, setRefreshTokenCookie } from '$lib/server/auth.js';

// Mock environment variables
vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

// Mock auth functions
vi.mock('$lib/server/auth.js', () => ({
	setSessionTokenCookie: vi.fn(),
	setRefreshTokenCookie: vi.fn()
}));

describe('Login Route', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	describe('load()', () => {
		it('should return supervalidate form', async () => {
			const result = await load({
				url: new URL('http://localhost/login'),
				fetch: mockFetch
			} as any);

			expect(result).toHaveProperty('loginForm');
			expect(result.loginForm).toBeDefined();
		});

		it('should initialize form with empty values', async () => {
			const result = await load({
				url: new URL('http://localhost/login'),
				fetch: mockFetch
			} as any);

			expect(result.loginForm.data).toEqual({
				username: '',
				password: ''
			});
		});
	});

	describe('actions.login', () => {
		it('should fail with 400 when form validation fails', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					username: 'invalid-email',
					password: 'short'
				})
			});

			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			const result = await actions.login({
				request: mockRequest,
				cookies: mockCookies
			} as any);

			expect(result.status).toBe(400);
			expect(result.data.form.valid).toBe(false);
		});

		it('should successfully login with valid credentials', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					username: 'test@example.com',
					password: 'password123'
				})
			});

			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			// Mock successful backend response
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					access_token: 'mock-access-token',
					refresh_token: 'mock-refresh-token',
					expires_in: 3600
				})
			});

			try {
				await actions.login({
					request: mockRequest,
					cookies: mockCookies
				} as any);
				expect.fail('Should have thrown a redirect');
			} catch (error: any) {
				// Should redirect to dashboard
				expect(error.status).toBe(303);
				expect(error.location).toBe('/dashboard');
			}

			// Should set cookies
			expect(setSessionTokenCookie).toHaveBeenCalledWith(
				mockCookies,
				'mock-access-token',
				expect.any(Date)
			);
			expect(setRefreshTokenCookie).toHaveBeenCalledWith(mockCookies, 'mock-refresh-token');
		});

		it('should fail with 401 when backend returns error', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					username: 'test@example.com',
					password: 'wrongpassword'
				})
			});

			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			// Mock failed backend response
			mockFetch.mockResolvedValue({
				ok: false,
				status: 401,
				json: async () => ({
					detail: 'Invalid credentials'
				})
			});

			const result = await actions.login({
				request: mockRequest,
				cookies: mockCookies
			} as any);

			expect(result.status).toBe(401);
			expect(result.data.form.errors.username).toEqual(['Invalid credentials']);
		});

		it('should call backend with correct credentials', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					username: 'test@example.com',
					password: 'password123'
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
					access_token: 'token',
					refresh_token: 'refresh',
					expires_in: 3600
				})
			});

			try {
				await actions.login({
					request: mockRequest,
					cookies: mockCookies
				} as any);
			} catch (error) {
				// Expected redirect
			}

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/login/access-token/',
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: expect.any(URLSearchParams)
				})
			);

			const callBody = mockFetch.mock.calls[0][1].body as URLSearchParams;
			expect(callBody.get('username')).toBe('test@example.com');
			expect(callBody.get('password')).toBe('password123');
		});

		it('should use default expiry when expires_in is not provided', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					username: 'test@example.com',
					password: 'password123'
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
					access_token: 'mock-access-token',
					refresh_token: 'mock-refresh-token'
					// No expires_in
				})
			});

			try {
				await actions.login({
					request: mockRequest,
					cookies: mockCookies
				} as any);
			} catch (error) {
				// Expected redirect
			}

			// Should set cookie with default 24-hour expiry
			expect(setSessionTokenCookie).toHaveBeenCalled();
		});
	});
});
