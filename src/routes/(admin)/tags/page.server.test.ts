import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend.com'
}));

vi.mock('$lib/server/auth', () => ({
	requireLogin: vi.fn(() => ({ id: 1, organization_id: 10 })),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		READ_TAG: 'read_tag',
		CREATE_TAG: 'create_tag',
		UPDATE_TAG: 'update_tag',
		DELETE_TAG: 'delete_tag'
	}
}));

const setFlashMock = vi.fn();
vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: (...args: any[]) => setFlashMock(...args),
	redirect: vi.fn()
}));

global.fetch = vi.fn();

describe('load function', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns tagTypes when API succeeds', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				items: [{ id: 1, name: 'State', tags: [{ id: 10, name: 'Delhi' }] }],
				total: 1,
				pages: 1
			})
		});

		const url = new URL('http://test.com/?page=2&size=5');

		const result = await load({
			cookies: {},
			url
		});

		expect(result.tagTypes.items[0].name).toBe('State');
		expect(result.params.page).toBe(2);
		expect(result.params.size).toBe(5);
	});

	it('returns empty tagTypes when API fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			text: async () => 'Error fetching tag types'
		});

		const url = new URL('http://test.com/?search=hello');

		const result = await load({
			cookies: {},
			url
		});

		expect(result.tagTypes.items).toEqual([]);
		expect(result.params.search).toBe('hello');
	});

	it('uses default pagination when no query params are given', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});

		const url = new URL('http://test.com/');

		const result = await load({
			cookies: {},
			url
		});

		expect(result.params.page).toBe(1);
		expect(result.params.size).toBe(DEFAULT_PAGE_SIZE);
	});
});
