import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend.com'
}));

vi.mock('$lib/server/auth', () => ({
	requireLogin: vi.fn(() => ({ id: 1 })),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: { READ_TAG: 'read_tag' }
}));

const setFlashMock = vi.fn();
vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: (...args: any[]) => setFlashMock(...args)
}));

global.fetch = vi.fn();

describe('load function', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns tags and tagTypes when API succeeds', async () => {
		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: ['t1'], total: 1, pages: 1 })
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: ['tt1'], total: 1, pages: 1 })
			});

		const url = new URL('http://test.com/?tagsPage=2&tagsSize=5');

		const result = await load({
			cookies: {},
			url
		});

		expect(result.tags.items).toEqual(['t1']);
		expect(result.tagTypes.items).toEqual(['tt1']);
		expect(result.tagsParams.page).toBe(2);
		expect(result.tagsParams.size).toBe(5);
	});

	it('returns empty tags when tags API fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Error fetching tags' })
		});

		const url = new URL('http://test.com/?search=hello');

		const result = await load({
			cookies: {},
			url
		});

		expect(setFlashMock).toHaveBeenCalled();
		expect(result.tags.items).toEqual([]);
		expect(result.tagTypes.items).toEqual([]);
		expect(result.tagsParams.search).toBe('hello');
	});

	it('handles tagTypes API failure gracefully', async () => {
		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: ['taga'], total: 1, pages: 1 })
			})
			.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ detail: 'TagTypes failed' })
			});

		const url = new URL('http://test.com/');

		const result = await load({
			cookies: {},
			url
		});

		expect(result.tags.items).toEqual(['taga']);
		expect(result.tagTypes.items).toEqual([]);
		expect(setFlashMock).toHaveBeenCalled();
	});

	it('uses default pagination when no query params are given', async () => {
		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [], total: 0, pages: 0 })
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [], total: 0, pages: 0 })
			});

		const url = new URL('http://test.com/');

		const result = await load({
			cookies: {},
			url
		});

		expect(result.tagsParams.page).toBe(1);
		expect(result.tagsParams.size).toBe(DEFAULT_PAGE_SIZE);
		expect(result.tagTypesParams.page).toBe(1);
		expect(result.tagTypesParams.size).toBe(DEFAULT_PAGE_SIZE);
	});
});
