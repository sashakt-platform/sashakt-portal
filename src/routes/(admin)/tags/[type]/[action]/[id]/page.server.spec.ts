import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as server from './+page.server';
import { redirect, setFlash } from 'sveltekit-flash-message/server';

vi.mock('$lib/server/auth.js', () => ({
	requireLogin: vi.fn(() => ({ id: 1, name: 'Test User' })),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: { CREATE_TAG: 'CREATE_TAG', UPDATE_TAG: 'UPDATE_TAG', DELETE_TAG: 'DELETE_TAG' }
}));

vi.mock('sveltekit-superforms', () => ({
	superValidate: vi.fn(async () => ({ valid: true, data: {} }))
}));

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend'
}));

vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: vi.fn(),
	redirect: vi.fn()
}));
const mockCookies = {
	get: vi.fn(),
	getAll: vi.fn(),
	set: vi.fn(),
	delete: vi.fn(),
	serialize: vi.fn()
};

global.fetch = vi.fn();
describe('page.server load function', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('throws error if type is invalid', async () => {
		await expect(
			server.load({
				params: { type: 'invalid', action: 'add', id: '-9' },
				cookies: mockCookies
			} as any)
		).rejects.toThrow('Invalid type parameter');
	});
	it('handles failed tag types fetch', async () => {
		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ name: 'Tag 1' })
			})
			.mockResolvedValueOnce({ ok: false, statusText: 'Server error' });

		const result = await server.load({
			params: { type: 'tag', action: 'edit', id: '1' },
			cookies: mockCookies
		} as any);

		expect(result.tagData).toEqual({ name: 'Tag 1' });
		expect(result.tagTypes).toEqual([]);
	});
	it('handles failed tag data fetch', async () => {
		(global.fetch as any)
			.mockResolvedValueOnce({ ok: false, statusText: 'Bad Request' })
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [] })
			});

		const result = await server.load({
			params: { type: 'tag', action: 'edit', id: '1' },
			cookies: mockCookies
		} as any);

		expect(result.tagData).toBeNull();
		expect(result.tagTypes).toEqual([]);
	});
});

describe('page.server save action', () => {
	beforeEach(() => vi.resetAllMocks());

	it('throws error if type is invalid', async () => {
		await expect(
			server.actions.save({
				request: {},
				params: { type: 'invalid', action: 'add', id: 'new' }
			})
		).rejects.toThrow('Invalid type parameter');
	});
	it('returns fail when form invalid', async () => {
		const superValidate = await import('sveltekit-superforms');
		(superValidate.superValidate as any).mockResolvedValueOnce({ valid: false, data: {} });

		const result = await server.actions.save({
			request: {},
			params: { type: 'tag', action: 'add', id: 'new' },
			cookies: {}
		});
		expect(setFlash).toHaveBeenCalledWith(
			{ type: 'error', message: 'Tag not Created. Please check all the details.' },
			{}
		);
		expect(result.status).toBe(400);
	});
	it('returns fail when POST fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Invalid data' })
		});

		const result = await server.actions.save({
			request: {},
			params: { type: 'tag', action: 'add', id: 'new' },
			cookies: {}
		});

		expect(setFlash).toHaveBeenCalledWith({ type: 'error', message: 'Invalid data' }, {});
		expect(result.status).toBe(500);
	});

	it('returns fail when PUT fails (edit)', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: 'Server error',
			json: async () => ({ detail: 'Update failed' })
		});

		const result = await server.actions.save({
			request: {},
			params: { type: 'tag', action: 'edit', id: '2' },
			cookies: {}
		});

		expect(setFlash).toHaveBeenCalledWith(
			{
				type: 'error',
				message: 'Failed to update tags: Update failed'
			},
			{}
		);
		expect(result.status).toBe(500);
	});

	it('redirects on successful save for new tag', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		await server.actions.save({
			request: {},
			params: { type: 'tag', action: 'add', id: 'new' },
			cookies: {}
		});
		expect(redirect).toHaveBeenCalledWith(
			'/tags?tab=tag',
			{ type: 'success', message: 'Tag saved successfully' },
			{}
		);
	});
});
describe('page.server delete action', () => {
	beforeEach(() => vi.resetAllMocks());
	it('throws error if type is invalid in delete', async () => {
		await expect(
			server.actions.delete({
				params: { type: 'invalid', id: '1' },
				cookies: {}
			})
		).rejects.toThrow('Invalid type parameter');
	});

	it('redirects on successful delete', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		await server.actions.delete({
			params: { type: 'tag', id: '123', action: 'delete' },
			cookies: {}
		});
		expect(redirect).toHaveBeenCalledWith(
			'/tags?tab=tag',
			{ type: 'success', message: 'Tag deleted successfully' },
			{}
		);
	});
	it('handles failed delete', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: 'Not Found',
			json: async () => ({ detail: 'Not found' })
		});

		await server.actions.delete({
			params: { type: 'tag', id: '999' },
			cookies: {}
		});

		expect(redirect).toHaveBeenCalledWith(
			'/tags?tab=tag',
			{ type: 'error', message: 'Not found' },
			{}
		);
	});
});
