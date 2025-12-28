import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';

// Mock environment variables
vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

describe('Forgot Password Route', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	describe('load()', () => {
		it('should return supervalidate form', async () => {
			const result = await load();

			expect(result).toHaveProperty('form');
			expect(result.form).toBeDefined();
		});

		it('should initialize form with empty email', async () => {
			const result = await load();

			expect(result.form.data).toEqual({
				email: ''
			});
		});
	});

	describe('actions.default', () => {
		it('should fail with 400 when email is invalid', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					email: 'invalid-email'
				})
			});

			const result = await actions.default({
				request: mockRequest,
				fetch: mockFetch
			} as any);

			expect(result.status).toBe(400);
			expect(result.data.form.valid).toBe(false);
		});

		it('should fail with 400 when email is empty', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					email: ''
				})
			});

			const result = await actions.default({
				request: mockRequest,
				fetch: mockFetch
			} as any);

			expect(result.status).toBe(400);
			expect(result.data.form.valid).toBe(false);
		});

		it('should successfully send reset email with valid email', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					email: 'test@example.com'
				})
			});

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					message: 'Password reset email sent'
				})
			});

			const result = await actions.default({
				request: mockRequest,
				fetch: mockFetch
			} as any);

			expect(result.form.valid).toBe(true);
			expect(result.form.message).toBe('Password reset email sent successfully');
		});

		it('should call backend with correct email', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					email: 'test@example.com'
				})
			});

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					message: 'Password reset email sent'
				})
			});

			await actions.default({
				request: mockRequest,
				fetch: mockFetch
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/password-recovery/test@example.com',
				expect.objectContaining({
					method: 'POST',
					headers: { accept: 'application/json' }
				})
			);
		});

		it('should fail when backend returns 404 (user not found)', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					email: 'nonexistent@example.com'
				})
			});

			mockFetch.mockResolvedValue({
				ok: false,
				status: 404,
				json: async () => ({
					detail: 'User not found'
				})
			});

			const result = await actions.default({
				request: mockRequest,
				fetch: mockFetch
			} as any);

			expect(result.status).toBe(404);
			expect(result.data.form.errors.email).toEqual(['User not found']);
		});

		it('should fail when backend returns 500 (server error)', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					email: 'test@example.com'
				})
			});

			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				json: async () => ({
					detail: 'Internal server error'
				})
			});

			const result = await actions.default({
				request: mockRequest,
				fetch: mockFetch
			} as any);

			expect(result.status).toBe(500);
			expect(result.data.form.errors.email).toEqual(['Internal server error']);
		});

		it('should use default error message when backend detail is missing', async () => {
			const mockRequest = new Request('http://localhost', {
				method: 'POST',
				body: new URLSearchParams({
					email: 'test@example.com'
				})
			});

			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				json: async () => ({})
			});

			const result = await actions.default({
				request: mockRequest,
				fetch: mockFetch
			} as any);

			expect(result.status).toBe(500);
			expect(result.data.form.errors.email).toEqual(['Failed to send reset link']);
		});
	});
});
