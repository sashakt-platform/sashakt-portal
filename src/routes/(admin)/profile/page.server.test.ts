import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { load, actions } from './+page.server';

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

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

vi.mock('$lib/server/auth.js', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token')
}));

vi.mock('sveltekit-superforms', () => ({
	superValidate: vi.fn(async (data, _schema) => {
		if (data instanceof Request) {
			const body = await data.json();
			return { valid: true, data: body };
		}
		return { valid: true, data: {} };
	})
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4: vi.fn()
}));

vi.mock('sveltekit-flash-message/server', () => ({
	redirect: vi.fn((status, path, message, _cookies) => {
		const error: any = new Error('Redirect');
		error.status = status;
		error.location = path;
		error.flashMessage = message;
		throw error;
	})
}));

describe('Profile Page Server', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	describe('load()', () => {
		it('should fetch user data from /users/me', async () => {
			const mockUser = {
				full_name: 'Jane Smith',
				email: 'jane@example.com',
				phone: '9876543210',
				role_label: 'Admin'
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockUser
			});

			const result = await load({ fetch: mockFetch } as any);

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/users/me',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						Authorization: 'Bearer mock-token'
					})
				})
			);
			expect(result.currentUser).toEqual(mockUser);
		});

		it('should return null currentUser when fetch response is not ok', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: 'Unauthorized'
			});

			const result = await load({ fetch: mockFetch } as any);

			expect(result.currentUser).toBeNull();
		});

		it('should return null currentUser when fetch throws', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			const result = await load({ fetch: mockFetch } as any);

			expect(result.currentUser).toBeNull();
		});

		it('should return a form object', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			const result = await load({ fetch: mockFetch } as any);

			expect(result.form).toBeDefined();
		});
	});

	describe('actions.save', () => {
		function makeRequest(body: Record<string, unknown>) {
			return new Request('http://localhost', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
		}

		it('should PATCH /users/me with profile fields', async () => {
			const request = makeRequest({
				full_name: 'Updated Name',
				email: 'updated@example.com',
				phone: '1234567890'
			});

			mockFetch.mockResolvedValueOnce({ ok: true });

			try {
				await actions.save({
					request,
					fetch: mockFetch,
					cookies: makeCookies()
				} as any);
				expect.fail('Should have thrown redirect');
			} catch {
				// expected redirect
			}

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/users/me',
				expect.objectContaining({
					method: 'PATCH',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						Authorization: 'Bearer mock-token'
					}),
					body: JSON.stringify({
						full_name: 'Updated Name',
						email: 'updated@example.com',
						phone: '1234567890'
					})
				})
			);
		});

		it('should send empty string for phone when phone is falsy', async () => {
			const request = makeRequest({
				full_name: 'No Phone',
				email: 'no@phone.com',
				phone: ''
			});

			mockFetch.mockResolvedValueOnce({ ok: true });

			try {
				await actions.save({
					request,
					fetch: mockFetch,
					cookies: makeCookies()
				} as any);
			} catch {
				// expected redirect
			}

			const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(callBody.phone).toBe('');
		});

		it('should return fail(400) when profile update fails', async () => {
			const request = makeRequest({
				full_name: 'Fail',
				email: 'fail@example.com',
				phone: ''
			});

			mockFetch.mockResolvedValueOnce({ ok: false });

			const result = await actions.save({
				request,
				fetch: mockFetch,
				cookies: makeCookies()
			} as any);

			expect(result?.status).toBe(400);
		});

		it('should return fail(400) when form validation fails', async () => {
			const { superValidate } = await import('sveltekit-superforms');
			vi.mocked(superValidate).mockResolvedValueOnce({
				valid: false,
				data: {},
				errors: { full_name: ['Full name is required'] }
			} as any);

			const request = makeRequest({ full_name: '' });

			const result = await actions.save({
				request,
				fetch: mockFetch,
				cookies: makeCookies()
			} as any);

			expect(result?.status).toBe(400);
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it('should not call password endpoint when new_password is empty', async () => {
			const request = makeRequest({
				full_name: 'Jane',
				email: 'jane@example.com',
				phone: '',
				new_password: ''
			});

			mockFetch.mockResolvedValueOnce({ ok: true });

			try {
				await actions.save({
					request,
					fetch: mockFetch,
					cookies: makeCookies()
				} as any);
			} catch {
				// expected redirect
			}

			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/users/me',
				expect.anything()
			);
		});

		it('should PATCH /users/me/password when new_password is provided', async () => {
			const request = makeRequest({
				full_name: 'Jane',
				email: 'jane@example.com',
				phone: '',
				current_password: 'oldpass',
				new_password: 'newpass123'
			});

			mockFetch
				.mockResolvedValueOnce({ ok: true })
				.mockResolvedValueOnce({ ok: true });

			try {
				await actions.save({
					request,
					fetch: mockFetch,
					cookies: makeCookies()
				} as any);
			} catch {
				// expected redirect
			}

			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/users/me/password',
				expect.objectContaining({
					method: 'PATCH',
					body: JSON.stringify({
						current_password: 'oldpass',
						new_password: 'newpass123'
					})
				})
			);
		});

		it('should return fail with error message when password update fails', async () => {
			const request = makeRequest({
				full_name: 'Jane',
				email: 'jane@example.com',
				phone: '',
				current_password: 'wrongpass',
				new_password: 'newpass123'
			});

			mockFetch
				.mockResolvedValueOnce({ ok: true })
				.mockResolvedValueOnce({
					ok: false,
					status: 401,
					json: async () => ({ detail: 'Incorrect password' })
				});

			const result = await actions.save({
				request,
				fetch: mockFetch,
				cookies: makeCookies()
			} as any);

			expect(result?.status).toBe(401);
		});

		it('should return fail(400) for non-401 password errors', async () => {
			const request = makeRequest({
				full_name: 'Jane',
				email: 'jane@example.com',
				phone: '',
				current_password: 'pass',
				new_password: 'newpass123'
			});

			mockFetch
				.mockResolvedValueOnce({ ok: true })
				.mockResolvedValueOnce({
					ok: false,
					status: 500,
					json: async () => ({ detail: [{ msg: 'Server error' }] })
				});

			const result = await actions.save({
				request,
				fetch: mockFetch,
				cookies: makeCookies()
			} as any);

			expect(result?.status).toBe(400);
		});

		it('should redirect to /profile with success message on success', async () => {
			const { redirect } = await import('sveltekit-flash-message/server');

			const request = makeRequest({
				full_name: 'Jane',
				email: 'jane@example.com',
				phone: ''
			});

			mockFetch.mockResolvedValueOnce({ ok: true });

			try {
				await actions.save({
					request,
					fetch: mockFetch,
					cookies: makeCookies()
				} as any);
				expect.fail('Should have thrown redirect');
			} catch (error: any) {
				expect(error.status).toBe(303);
				expect(error.location).toBe('/profile');
				expect(error.flashMessage).toEqual({
					type: 'success',
					message: 'Profile Updated Successfully'
				});
			}

			expect(redirect).toHaveBeenCalledWith(
				303,
				'/profile',
				{ type: 'success', message: 'Profile Updated Successfully' },
				expect.anything()
			);
		});
	});
});
