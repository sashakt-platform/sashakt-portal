import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend.com'
}));

vi.mock('$lib/server/auth', () => ({
	requireLogin: vi.fn(() => ({ id: 1, organization_id: 10, permissions: ['create_tag'] })),
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
const redirectMock = vi.fn();
vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: (...args: any[]) => setFlashMock(...args),
	redirect: (...args: any[]) => {
		redirectMock(...args);
		throw { status: 303, location: args[0] };
	}
}));

global.fetch = vi.fn();

function createFormData(data: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [key, value] of Object.entries(data)) {
		fd.append(key, value);
	}
	return fd;
}

function mockRequest(data: Record<string, string>) {
	return {
		formData: async () => createFormData(data)
	} as unknown as Request;
}

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
		const result = await load({ cookies: {}, url });

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
		const result = await load({ cookies: {}, url });

		expect(result.tagTypes.items).toEqual([]);
		expect(result.params.search).toBe('hello');
	});

	it('uses default pagination when no query params are given', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});

		const url = new URL('http://test.com/');
		const result = await load({ cookies: {}, url });

		expect(result.params.page).toBe(1);
		expect(result.params.size).toBe(DEFAULT_PAGE_SIZE);
	});

	it('passes search param as name filter to API', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});

		const url = new URL('http://test.com/?search=Finance');
		await load({ cookies: {}, url });

		const fetchUrl = (global.fetch as any).mock.calls[0][0];
		expect(fetchUrl).toContain('name=Finance');
	});

	it('passes sort params to API', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});

		const url = new URL('http://test.com/?sort_by=name&sort_order=desc');
		await load({ cookies: {}, url });

		const fetchUrl = (global.fetch as any).mock.calls[0][0];
		expect(fetchUrl).toContain('sort_by=name');
		expect(fetchUrl).toContain('sort_order=desc');
	});
});

describe('actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('createTagType', () => {
		it('creates tag type and redirects on success', async () => {
			(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			await expect(
				actions.createTagType({
					request: mockRequest({ name: 'Difficulty', description: 'How hard' }),
					cookies: {}
				})
			).rejects.toEqual({ status: 303, location: '/tags' });

			const fetchCall = (global.fetch as any).mock.calls[0];
			expect(fetchCall[0]).toBe('http://fake-backend.com/tagtype/');
			expect(fetchCall[1].method).toBe('POST');
			const body = JSON.parse(fetchCall[1].body);
			expect(body.name).toBe('Difficulty');
			expect(body.description).toBe('How hard');
			expect(body.organization_id).toBe(10);
		});

		it('returns fail(400) when name is empty', async () => {
			const result = await actions.createTagType({
				request: mockRequest({ name: '' }),
				cookies: {}
			});

			expect(result?.status).toBe(400);
			expect(setFlashMock).toHaveBeenCalled();
		});

		it('returns fail(500) when API fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: async () => ({ detail: 'Server error' })
			});

			const result = await actions.createTagType({
				request: mockRequest({ name: 'Test' }),
				cookies: {}
			});

			expect(result?.status).toBe(500);
			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error' }),
				expect.anything()
			);
		});
	});

	describe('updateTagType', () => {
		it('updates tag type and redirects on success', async () => {
			(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			await expect(
				actions.updateTagType({
					request: mockRequest({ id: '5', name: 'Updated', description: 'New desc' }),
					cookies: {}
				})
			).rejects.toEqual({ status: 303, location: '/tags' });

			const fetchCall = (global.fetch as any).mock.calls[0];
			expect(fetchCall[0]).toBe('http://fake-backend.com/tagtype/5');
			expect(fetchCall[1].method).toBe('PUT');
		});

		it('returns fail(400) when name is missing', async () => {
			const result = await actions.updateTagType({
				request: mockRequest({ id: '5', name: '' }),
				cookies: {}
			});

			expect(result?.status).toBe(400);
		});
	});

	describe('createTag', () => {
		it('creates tag and redirects on success', async () => {
			(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			await expect(
				actions.createTag({
					request: mockRequest({ name: 'Delhi', tag_type_id: '1' }),
					cookies: {}
				})
			).rejects.toEqual({ status: 303, location: '/tags' });

			const fetchCall = (global.fetch as any).mock.calls[0];
			expect(fetchCall[0]).toBe('http://fake-backend.com/tag/');
			expect(fetchCall[1].method).toBe('POST');
			const body = JSON.parse(fetchCall[1].body);
			expect(body.name).toBe('Delhi');
			expect(body.tag_type_id).toBe(1);
		});

		it('returns fail(400) when name is empty', async () => {
			const result = await actions.createTag({
				request: mockRequest({ name: '', tag_type_id: '1' }),
				cookies: {}
			});

			expect(result?.status).toBe(400);
		});
	});

	describe('updateTag', () => {
		it('updates tag and redirects on success', async () => {
			(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			await expect(
				actions.updateTag({
					request: mockRequest({ id: '10', name: 'Mumbai' }),
					cookies: {}
				})
			).rejects.toEqual({ status: 303, location: '/tags' });

			const fetchCall = (global.fetch as any).mock.calls[0];
			expect(fetchCall[0]).toBe('http://fake-backend.com/tag/10');
			expect(fetchCall[1].method).toBe('PUT');
			const body = JSON.parse(fetchCall[1].body);
			expect(body.name).toBe('Mumbai');
		});

		it('returns fail(400) when id or name is missing', async () => {
			const result = await actions.updateTag({
				request: mockRequest({ id: '', name: '' }),
				cookies: {}
			});

			expect(result?.status).toBe(400);
		});
	});

	describe('deleteTag', () => {
		it('deletes tag and redirects on success', async () => {
			(global.fetch as any).mockResolvedValueOnce({ ok: true });

			await expect(
				actions.deleteTag({
					request: mockRequest({ id: '10' }),
					cookies: {}
				})
			).rejects.toEqual({ status: 303, location: '/tags' });

			const fetchCall = (global.fetch as any).mock.calls[0];
			expect(fetchCall[0]).toBe('http://fake-backend.com/tag/10');
			expect(fetchCall[1].method).toBe('DELETE');
		});

		it('returns fail(400) when id is missing', async () => {
			const result = await actions.deleteTag({
				request: mockRequest({ id: '' }),
				cookies: {}
			});

			expect(result?.status).toBe(400);
		});

		it('returns fail(500) when API fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: async () => ({ detail: 'Not found' })
			});

			const result = await actions.deleteTag({
				request: mockRequest({ id: '99' }),
				cookies: {}
			});

			expect(result?.status).toBe(500);
		});
	});

	describe('deleteTagType', () => {
		it('deletes tag type and redirects on success', async () => {
			(global.fetch as any).mockResolvedValueOnce({ ok: true });

			await expect(
				actions.deleteTagType({
					request: mockRequest({ id: '5' }),
					cookies: {}
				})
			).rejects.toEqual({ status: 303, location: '/tags' });

			const fetchCall = (global.fetch as any).mock.calls[0];
			expect(fetchCall[0]).toBe('http://fake-backend.com/tagtype/5');
			expect(fetchCall[1].method).toBe('DELETE');
		});

		it('returns fail(400) when id is missing', async () => {
			const result = await actions.deleteTagType({
				request: mockRequest({ id: '' }),
				cookies: {}
			});

			expect(result?.status).toBe(400);
		});
	});
});
