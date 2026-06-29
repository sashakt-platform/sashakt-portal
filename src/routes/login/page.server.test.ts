import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import {
	setSessionTokenCookie,
	setRefreshTokenCookie,
	validateSessionToken
} from '$lib/server/auth.js';
import type { Redirect } from '@sveltejs/kit';
import type { PageServerLoadEvent, RequestEvent } from './$types';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

vi.mock('$lib/server/auth.js', async () => {
	const actual = await vi.importActual('$lib/server/auth.js');
	return {
		...actual,
		setSessionTokenCookie: vi.fn(),
		setRefreshTokenCookie: vi.fn(),
		setOrganizationCookie: vi.fn(),
		deleteOrganizationCookie: vi.fn(),
		validateSessionToken: vi.fn()
	};
});

const mockCookies = {
	set: vi.fn(),
	get: vi.fn(),
	delete: vi.fn(),
	getAll: vi.fn(),
	serialize: vi.fn()
};

const makeLoadEvent = (overrides: Partial<PageServerLoadEvent> = {}): PageServerLoadEvent =>
	({
		url: new URL('http://localhost/login'),
		fetch: vi.fn(),
		cookies: mockCookies,
		locals: { organization: null },
		...overrides
	}) as unknown as PageServerLoadEvent;

const makeActionEvent = (
	username: string,
	password: string,
	overrides: Partial<RequestEvent> = {}
): RequestEvent =>
	({
		request: new Request('http://localhost', {
			method: 'POST',
			body: new URLSearchParams({ username, password })
		}),
		cookies: mockCookies,
		...overrides
	}) as unknown as RequestEvent;

describe('Login Route', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	describe('load()', () => {
		it('should return loginForm property', async () => {
			const result = await load(makeLoadEvent({ fetch: mockFetch }));

			expect(result).toHaveProperty('loginForm');
			expect(result.loginForm).toBeDefined();
		});

		it('should return organizationData property', async () => {
			const result = await load(makeLoadEvent({ fetch: mockFetch }));

			expect(result).toHaveProperty('organizationData');
		});

		it('should initialize form with empty username and password', async () => {
			const result = await load(makeLoadEvent({ fetch: mockFetch }));

			expect(result.loginForm.data).toEqual({
				username: '',
				password: ''
			});
		});

		it('should return valid supervalidated form object', async () => {
			const result = await load(makeLoadEvent({ fetch: mockFetch }));

			expect(result.loginForm).toHaveProperty('valid');
			expect(result.loginForm).toHaveProperty('errors');
			expect(result.loginForm).toHaveProperty('data');
		});
	});

	describe('load() with organization param', () => {
		it('fetches org public data when organization param is provided', async () => {
			const orgFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ logo: 'x', name: 'Acme', shortcode: 'acme' })
			});

			const result = await load(
				makeLoadEvent({
					url: new URL('http://localhost/login?organization=acme'),
					fetch: orgFetch
				})
			);

			expect(orgFetch).toHaveBeenCalledWith('http://localhost:8000/organization/public/acme');
			expect(result.organizationData).toEqual({ logo: 'x', name: 'Acme', shortcode: 'acme' });
		});

		it('returns null organizationData when backend returns error', async () => {
			const orgFetch = vi.fn().mockResolvedValue({ ok: false });

			const result = await load(
				makeLoadEvent({
					url: new URL('http://localhost/login?organization=unknown'),
					fetch: orgFetch
				})
			);

			expect(result.organizationData).toBeNull();
		});

		it('returns null organizationData when no organization param', async () => {
			const result = await load(makeLoadEvent({ fetch: mockFetch }));

			expect(result.organizationData).toBeNull();
		});

		it('uses cached organization from locals when shortcode matches', async () => {
			const orgData = { logo: 'logo.png', name: 'Acme', shortcode: 'acme' };
			const orgFetch = vi.fn();

			const result = await load(
				makeLoadEvent({
					url: new URL('http://localhost/login?organization=acme'),
					fetch: orgFetch,
					locals: { organization: orgData } as App.Locals
				})
			);

			expect(result.organizationData).toEqual(orgData);
			expect(orgFetch).not.toHaveBeenCalled();
		});

		it('returns both shortcode and logo when org is fully configured', async () => {
			const orgFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					name: 'XYZ Org',
					logo: 'https://cdn.example.com/xyz-logo.png',
					shortcode: 'xyz'
				})
			});

			const result = await load(
				makeLoadEvent({
					url: new URL('http://localhost/login?organization=xyz'),
					fetch: orgFetch
				})
			);

			expect(result.organizationData).toMatchObject({
				shortcode: 'xyz',
				logo: 'https://cdn.example.com/xyz-logo.png',
				name: 'XYZ Org'
			});
		});

		it('fetches from public endpoint using the shortcode from the URL param', async () => {
			const orgFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ name: 'XYZ Org', logo: 'logo.png', shortcode: 'xyz' })
			});

			await load(
				makeLoadEvent({
					url: new URL('http://localhost/login?organization=xyz'),
					fetch: orgFetch
				})
			);

			expect(orgFetch).toHaveBeenCalledWith('http://localhost:8000/organization/public/xyz');
		});

		it('returns null logo in organizationData when org has shortcode but no logo', async () => {
			const orgFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ name: 'XYZ Org', logo: null, shortcode: 'xyz' })
			});

			const result = await load(
				makeLoadEvent({
					url: new URL('http://localhost/login?organization=xyz'),
					fetch: orgFetch
				})
			);

			expect(result.organizationData?.shortcode).toBe('xyz');
			expect(result.organizationData?.logo).toBeFalsy();
		});
	});

	describe('actions.login — form validation', () => {
		it('should fail with 400 when email is invalid', async () => {
			const result = await actions.login(makeActionEvent('invalid-email', 'password123'));

			expect(result.status).toBe(400);
			expect(result.data.form.valid).toBe(false);
		});

		it('should fail with 400 when email is empty', async () => {
			const result = await actions.login(makeActionEvent('', 'password123'));

			expect(result.status).toBe(400);
			expect(result.data.form.valid).toBe(false);
		});

		it('should fail with 400 when password is empty', async () => {
			const result = await actions.login(makeActionEvent('test@example.com', ''));

			expect(result.status).toBe(400);
			expect(result.data.form.valid).toBe(false);
		});

		it('should fail with 400 when password is too short', async () => {
			const result = await actions.login(makeActionEvent('test@example.com', 'short'));

			expect(result.status).toBe(400);
			expect(result.data.form.valid).toBe(false);
		});

		it('should have validation errors when both fields are invalid', async () => {
			const result = await actions.login(makeActionEvent('not-an-email', 'abc'));

			expect(result.status).toBe(400);
			expect(result.data.form.valid).toBe(false);
			expect(result.data.form.errors).toBeDefined();
		});
	});

	describe('actions.login — backend call', () => {
		it('should call backend with correct URL and method', async () => {
			vi.mocked(validateSessionToken).mockResolvedValue({ user: { permissions: [] } });

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					access_token: 'token',
					refresh_token: 'refresh',
					expires_in: 3600
				})
			});

			try {
				await actions.login(makeActionEvent('test@example.com', 'password123'));
			} catch {
				// Expected redirect
			}

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/login/access-token/',
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
				})
			);
		});

		it('should send credentials as URL-encoded form data', async () => {
			vi.mocked(validateSessionToken).mockResolvedValue({ user: { permissions: [] } });

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					access_token: 'token',
					refresh_token: 'refresh',
					expires_in: 3600
				})
			});

			try {
				await actions.login(makeActionEvent('test@example.com', 'password123'));
			} catch {
				// Expected redirect
			}

			const callBody = mockFetch.mock.calls[0][1].body as URLSearchParams;
			expect(callBody.get('username')).toBe('test@example.com');
			expect(callBody.get('password')).toBe('password123');
		});
	});

	describe('actions.login — backend error', () => {
		it('should fail with 401 when backend returns invalid credentials', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 401,
				json: async () => ({ detail: 'Invalid credentials' })
			});

			const result = await actions.login(makeActionEvent('test@example.com', 'wrongpassword'));

			expect(result.status).toBe(401);
			expect(result.data.form.errors.username).toEqual(['Invalid credentials']);
		});

		it('should pass backend error detail to form errors', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 401,
				json: async () => ({ detail: 'Account locked' })
			});

			const result = await actions.login(makeActionEvent('test@example.com', 'password123'));

			expect(result.data.form.errors.username).toEqual(['Account locked']);
		});
	});

	describe('actions.login — successful login', () => {
		it('should set session and refresh token cookies', async () => {
			vi.mocked(validateSessionToken).mockResolvedValue({ user: { permissions: [] } });

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					access_token: 'mock-access-token',
					refresh_token: 'mock-refresh-token',
					expires_in: 3600
				})
			});

			try {
				await actions.login(makeActionEvent('test@example.com', 'password123'));
			} catch {
				// Expected redirect
			}

			expect(setSessionTokenCookie).toHaveBeenCalledWith(
				mockCookies,
				'mock-access-token',
				expect.any(Date)
			);
			expect(setRefreshTokenCookie).toHaveBeenCalledWith(mockCookies, 'mock-refresh-token');
		});

		it('should call validateSessionToken with the access token', async () => {
			vi.mocked(validateSessionToken).mockResolvedValue({ user: { permissions: [] } });

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					access_token: 'my-token-123',
					refresh_token: 'refresh-456',
					expires_in: 3600
				})
			});

			try {
				await actions.login(makeActionEvent('test@example.com', 'password123'));
			} catch {
				// Expected redirect
			}

			expect(validateSessionToken).toHaveBeenCalledWith('my-token-123');
		});

		it('should use backend expires_in for cookie expiry', async () => {
			vi.mocked(validateSessionToken).mockResolvedValue({ user: { permissions: [] } });

			const beforeTime = Date.now();
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					access_token: 'token',
					refresh_token: 'refresh',
					expires_in: 7200
				})
			});

			try {
				await actions.login(makeActionEvent('test@example.com', 'password123'));
			} catch {
				// Expected redirect
			}

			const expiryDate = vi.mocked(setSessionTokenCookie).mock.calls[0][2] as Date;
			const expectedMin = beforeTime + 7200 * 1000;
			const expectedMax = expectedMin + 1000;
			expect(expiryDate.getTime()).toBeGreaterThanOrEqual(expectedMin);
			expect(expiryDate.getTime()).toBeLessThanOrEqual(expectedMax);
		});

		it('should use default 24-hour expiry when expires_in is not provided', async () => {
			vi.mocked(validateSessionToken).mockResolvedValue({ user: { permissions: [] } });

			const beforeTime = Date.now();
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					access_token: 'token',
					refresh_token: 'refresh'
				})
			});

			try {
				await actions.login(makeActionEvent('test@example.com', 'password123'));
			} catch {
				// Expected redirect
			}

			const expiryDate = vi.mocked(setSessionTokenCookie).mock.calls[0][2] as Date;
			const expected24h = beforeTime + 60 * 60 * 24 * 1000;
			expect(expiryDate.getTime()).toBeGreaterThanOrEqual(expected24h);
			expect(expiryDate.getTime()).toBeLessThanOrEqual(expected24h + 1000);
		});
	});

	describe('actions.login — redirect', () => {
		it('should redirect non-super-admin to /tests/test-session', async () => {
			vi.mocked(validateSessionToken).mockResolvedValue({
				user: { permissions: ['read_test'] }
			});

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					access_token: 'token',
					refresh_token: 'refresh',
					expires_in: 3600
				})
			});

			try {
				await actions.login(makeActionEvent('test@example.com', 'password123'));
				expect.fail('Should have thrown a redirect');
			} catch (error) {
				const redirect = error as Redirect;
				expect(redirect.status).toBe(303);
				expect(redirect.location).toBe('/tests/test-session');
			}
		});

		it('should redirect super admin to /organisations', async () => {
			vi.mocked(validateSessionToken).mockResolvedValue({
				user: { permissions: ['create_organization'] }
			});

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					access_token: 'token',
					refresh_token: 'refresh',
					expires_in: 3600
				})
			});

			try {
				await actions.login(makeActionEvent('admin@example.com', 'password123'));
				expect.fail('Should have thrown a redirect');
			} catch (error) {
				const redirect = error as Redirect;
				expect(redirect.status).toBe(303);
				expect(redirect.location).toBe('/organisations');
			}
		});

		it('should throw redirect with status 303', async () => {
			vi.mocked(validateSessionToken).mockResolvedValue({ user: { permissions: [] } });

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					access_token: 'token',
					refresh_token: 'refresh',
					expires_in: 3600
				})
			});

			try {
				await actions.login(makeActionEvent('test@example.com', 'password123'));
				expect.fail('Should have thrown a redirect');
			} catch (error) {
				const redirect = error as Redirect;
				expect(redirect.status).toBe(303);
			}
		});
	});
});
