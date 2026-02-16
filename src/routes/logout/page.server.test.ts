import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';
import { deleteAllTokenCookies, logoutFromBackend } from '$lib/server/auth';

// Mock auth functions
vi.mock('$lib/server/auth', () => ({
	deleteAllTokenCookies: vi.fn(),
	logoutFromBackend: vi.fn(),
	organizationCookieName: 'sashakt-organization'
}));

describe('Logout Route', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('load()', () => {
		it('should call backend logout when user is logged in', async () => {
			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			const mockLocals = {
				session: 'mock-session-token',
				user: { id: 1, username: 'test' }
			};

			try {
				await load({
					cookies: mockCookies,
					locals: mockLocals
				} as any);
				expect.fail('Should have thrown a redirect');
			} catch (error: any) {
				// Should redirect to login
				expect(error.status).toBe(303);
				expect(error.location).toBe('/login');
			}

			expect(logoutFromBackend).toHaveBeenCalledWith('mock-session-token');
			expect(deleteAllTokenCookies).toHaveBeenCalledWith(mockCookies);
		});

		it('should still delete cookies when user is not logged in', async () => {
			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			const mockLocals = {
				session: null,
				user: null
			};

			try {
				await load({
					cookies: mockCookies,
					locals: mockLocals
				} as any);
				expect.fail('Should have thrown a redirect');
			} catch (error: any) {
				// Should redirect to login
				expect(error.status).toBe(303);
				expect(error.location).toBe('/login');
			}

			expect(logoutFromBackend).not.toHaveBeenCalled();
			expect(deleteAllTokenCookies).toHaveBeenCalledWith(mockCookies);
		});

		it('should throw error if backend logout fails', async () => {
			vi.mocked(logoutFromBackend).mockRejectedValue(new Error('Backend error'));

			const mockCookies = {
				set: vi.fn(),
				get: vi.fn(),
				delete: vi.fn(),
				getAll: vi.fn(),
				serialize: vi.fn()
			};

			const mockLocals = {
				session: 'mock-session-token',
				user: { id: 1, username: 'test' }
			};

			await expect(
				load({
					cookies: mockCookies,
					locals: mockLocals
				} as any)
			).rejects.toThrow('Backend error');

			// logoutFromBackend should have been called
			expect(logoutFromBackend).toHaveBeenCalledWith('mock-session-token');
		});
	});
});
