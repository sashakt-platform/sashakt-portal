import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	refreshAccessToken,
	validateSessionToken,
	setSessionTokenCookie,
	setRefreshTokenCookie,
	deleteSessionTokenCookie,
	deleteRefreshTokenCookie,
	deleteAllTokenCookies,
	logoutFromBackend,
	sessionCookieName,
	refreshCookieName,
	setOrganizationCookie,
	organizationCookieName,
	deleteOrganizationCookie
} from './auth';

// Mock environment variables
vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

// Mock app/environment
vi.mock('$app/environment', () => ({
	dev: true
}));

describe('auth', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('refreshAccessToken()', () => {
		it('should successfully refresh access token', async () => {
			const mockTokens = {
				access_token: 'new-access-token',
				refresh_token: 'new-refresh-token',
				expires_at: '2025-12-31T23:59:59Z'
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => mockTokens
			});

			const result = await refreshAccessToken('old-refresh-token');

			expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/login/refresh-token/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					refresh_token: 'old-refresh-token'
				})
			});

			expect(result.success).toBe(true);
			expect(result.tokens).toEqual(mockTokens);
		});

		it('should return failure when refresh fails', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 401
			});

			const result = await refreshAccessToken('invalid-token');

			expect(result.success).toBe(false);
			expect(result.tokens).toBeNull();
		});

		it('should handle network errors', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			const result = await refreshAccessToken('any-token');

			expect(result.success).toBe(false);
			expect(result.tokens).toBeNull();
		});
	});

	describe('validateSessionToken()', () => {
		it('should successfully validate token and return user', async () => {
			const mockUser = {
				id: 1,
				username: 'testuser',
				email: 'test@example.com',
				permissions: ['read_user', 'create_user']
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => mockUser
			});

			const result = await validateSessionToken('valid-token');

			expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/users/me', {
				method: 'GET',
				headers: {
					Authorization: 'Bearer valid-token'
				}
			});

			expect(result.user).toEqual(mockUser);
		});

		it('should return null user when validation fails', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 401
			});

			const result = await validateSessionToken('invalid-token');

			expect(result.user).toBeNull();
		});

		it('should handle network errors', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			const result = await validateSessionToken('any-token');

			expect(result.user).toBeNull();
		});
	});

	describe('setSessionTokenCookie()', () => {
		it('should set session cookie with correct options', () => {
			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			const expiresAt = new Date('2025-12-31T23:59:59Z');
			setSessionTokenCookie(mockCookies, 'test-token', expiresAt);

			expect(mockCookies.set).toHaveBeenCalledWith(sessionCookieName, 'test-token', {
				expires: expiresAt,
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: false // dev mode
			});
		});
	});

	describe('setRefreshTokenCookie()', () => {
		it('should set refresh cookie with correct options', () => {
			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			setRefreshTokenCookie(mockCookies, 'refresh-token');

			expect(mockCookies.set).toHaveBeenCalledWith(refreshCookieName, 'refresh-token', {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: false // dev mode
			});
		});
	});

	describe('deleteSessionTokenCookie()', () => {
		it('should delete session cookie', () => {
			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			deleteSessionTokenCookie(mockCookies);

			expect(mockCookies.delete).toHaveBeenCalledWith(sessionCookieName, {
				path: '/'
			});
		});
	});

	describe('deleteRefreshTokenCookie()', () => {
		it('should delete refresh cookie', () => {
			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			deleteRefreshTokenCookie(mockCookies);

			expect(mockCookies.delete).toHaveBeenCalledWith(refreshCookieName, {
				path: '/'
			});
		});
	});

	describe('deleteAllTokenCookies()', () => {
		it('should delete both session and refresh cookies', () => {
			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			deleteAllTokenCookies(mockCookies);

			expect(mockCookies.delete).toHaveBeenCalledTimes(2);
			expect(mockCookies.delete).toHaveBeenCalledWith(sessionCookieName, {
				path: '/'
			});
			expect(mockCookies.delete).toHaveBeenCalledWith(refreshCookieName, {
				path: '/'
			});
		});
	});

	describe('logoutFromBackend()', () => {
		it('should successfully logout from backend', async () => {
			mockFetch.mockResolvedValue({
				ok: true
			});

			const result = await logoutFromBackend('access-token');

			expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/login/logout/', {
				method: 'POST',
				headers: {
					Authorization: 'Bearer access-token'
				}
			});

			expect(result.success).toBe(true);
		});

		it('should return failure when logout fails', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 401
			});

			const result = await logoutFromBackend('invalid-token');

			expect(result.success).toBe(false);
		});

		it('should handle network errors', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			const result = await logoutFromBackend('any-token');

			expect(result.success).toBe(false);
		});
	});
});

describe('setOrganizationCookie()', () => {
	it('should set organization cookie with correct options when shortcode is provided', () => {
		const mockCookies = {
			set: vi.fn(),
			get: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(),
			serialize: vi.fn()
		};

		setOrganizationCookie(mockCookies as any, 'acme');

		expect(mockCookies.set).toHaveBeenCalledWith(organizationCookieName, 'acme', {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: false // dev=true mocked above
		});
	});

	it('should not set organization cookie when shortcode is null', () => {
		const mockCookies = {
			set: vi.fn(),
			get: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(),
			serialize: vi.fn()
		};

		setOrganizationCookie(mockCookies as any, null);

		expect(mockCookies.set).not.toHaveBeenCalled();
	});

	it('should not set organization cookie when shortcode is empty (if you want to enforce this)', () => {
		const mockCookies = {
			set: vi.fn(),
			get: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(),
			serialize: vi.fn()
		};

		// Current implementation WILL set the cookie for empty string.
		// If you keep current behavior, change this expectation accordingly.
		setOrganizationCookie(mockCookies as any, '');

		expect(mockCookies.set).not.toHaveBeenCalled();
	});
});

describe('deleteOrganizationCookie()', () => {
	it('should delete organization cookie', () => {
		const mockCookies = {
			set: vi.fn(),
			get: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(),
			serialize: vi.fn()
		};

		deleteOrganizationCookie(mockCookies as any);

		expect(mockCookies.delete).toHaveBeenCalledWith(organizationCookieName, { path: '/' });
	});
});

describe('deleteAllTokenCookies()', () => {
	it('should not delete organization cookie (current behavior)', () => {
		const mockCookies = {
			set: vi.fn(),
			get: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn(),
			serialize: vi.fn()
		};

		deleteAllTokenCookies(mockCookies as any);

		// current: deletes only session + refresh
		expect(mockCookies.delete).toHaveBeenCalledTimes(2);
		expect(mockCookies.delete).not.toHaveBeenCalledWith(organizationCookieName, expect.anything());
	});
});
