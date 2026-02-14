import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as server from './+page.server';
import { redirect, setFlash } from 'sveltekit-flash-message/server';

vi.mock('$lib/server/auth.js', () => ({
	requireLogin: vi.fn(() => ({ id: 1, name: 'Test User' })),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		CREATE_ENTITY: 'CREATE_ENTITY',
		UPDATE_ENTITY: 'UPDATE_ENTITY',
		DELETE_ENTITY: 'DELETE_ENTITY',
		READ_ENTITY: 'READ_ENTITY'
	}
}));

vi.mock('sveltekit-superforms', () => ({
	superValidate: vi.fn(async () => ({ valid: true, data: { name: 'Test Entity Type' } }))
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4: vi.fn((schema) => schema)
}));

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend'
}));

vi.mock('$lib/constants.js', () => ({
	DEFAULT_PAGE_SIZE: 25
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

	describe('view action - entities list', () => {
		it('loads entities and entity type for view action', async () => {
			const mockEntities = { items: [{ id: 1, name: 'Entity 1' }], pages: 3 };
			const mockEntityType = { id: 1, name: 'CLF' };

			(global.fetch as any)
				.mockResolvedValueOnce({ ok: true, json: async () => mockEntities })
				.mockResolvedValueOnce({ ok: true, json: async () => mockEntityType });

			const result = (await server.load({
				params: { action: 'view', id: '1' },
				url: new URL('http://localhost/entity/view/1'),
				cookies: mockCookies
			} as any)) as any;

			expect(result.action).toBe('view');
			expect(result.entities).toEqual(mockEntities);
			expect(result.entityType).toEqual(mockEntityType);
			expect(result.totalPages).toBe(3);
		});

		it('handles pagination and search params', async () => {
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [], pages: 0 })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ id: 1, name: 'CLF' })
				});

			const result = (await server.load({
				params: { action: 'view', id: '1' },
				url: new URL(
					'http://localhost/entity/view/1?page=2&size=10&search=test&sortBy=name&sortOrder=desc'
				),
				cookies: mockCookies
			} as any)) as any;

			expect(result.params).toEqual({
				page: 2,
				size: 10,
				search: 'test',
				sortBy: 'name',
				sortOrder: 'desc'
			});
		});

		it('uses default pagination when no params provided', async () => {
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [], pages: 0 })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ id: 1, name: 'CLF' })
				});

			const result = (await server.load({
				params: { action: 'view', id: '1' },
				url: new URL('http://localhost/entity/view/1'),
				cookies: mockCookies
			} as any)) as any;

			expect(result.params.page).toBe(1);
			expect(result.params.size).toBe(25);
			expect(result.params.search).toBe('');
		});

		it('handles failed entities fetch', async () => {
			(global.fetch as any)
				.mockResolvedValueOnce({ ok: false, statusText: 'Server error' })
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ id: 1, name: 'CLF' })
				});

			const result = (await server.load({
				params: { action: 'view', id: '1' },
				url: new URL('http://localhost/entity/view/1'),
				cookies: mockCookies
			} as any)) as any;

			expect(result.entities).toBeNull();
			expect(result.totalPages).toBe(0);
		});

		it('handles failed entity type fetch', async () => {
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [], pages: 0 })
				})
				.mockResolvedValueOnce({ ok: false, statusText: 'Not found' });

			const result = (await server.load({
				params: { action: 'view', id: '1' },
				url: new URL('http://localhost/entity/view/1'),
				cookies: mockCookies
			} as any)) as any;

			expect(result.entityType).toBeNull();
		});
	});

	describe('add action', () => {
		it('loads form for add action', async () => {
			const result = (await server.load({
				params: { action: 'add', id: 'new' },
				url: new URL('http://localhost/entity/add/new'),
				cookies: mockCookies
			} as any)) as any;

			expect(result.action).toBe('add');
			expect(result.form).toBeDefined();
			expect(result.entityType).toBeNull();
		});
	});

	describe('edit action', () => {
		it('loads entity type data for edit action', async () => {
			const mockEntityType = {
				id: 1,
				name: 'CLF',
				description: 'Community Level Federation'
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockEntityType
			});

			const result = (await server.load({
				params: { action: 'edit', id: '1' },
				url: new URL('http://localhost/entity/edit/1'),
				cookies: mockCookies
			} as any)) as any;

			expect(result.action).toBe('edit');
			expect(result.entityType).toEqual(mockEntityType);
		});

		it('handles failed entity type fetch in edit mode', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				statusText: 'Not found'
			});

			const result = (await server.load({
				params: { action: 'edit', id: '999' },
				url: new URL('http://localhost/entity/edit/999'),
				cookies: mockCookies
			} as any)) as any;

			expect(result.entityType).toBeNull();
		});
	});
});

describe('page.server save action', () => {
	beforeEach(() => vi.resetAllMocks());

	it('returns fail when form is invalid', async () => {
		const superValidate = await import('sveltekit-superforms');
		(superValidate.superValidate as any).mockResolvedValueOnce({ valid: false, data: {} });

		const result = (await server.actions.save({
			request: {},
			params: { action: 'add', id: 'new' },
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith(
			{ type: 'error', message: 'Entity not saved. Please check all the details.' },
			mockCookies
		);
		expect(result.status).toBe(400);
	});

	it('creates entity type via POST for new entity type', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		await server.actions.save({
			request: {},
			params: { action: 'add', id: 'new' },
			cookies: mockCookies
		} as any);

		expect(global.fetch).toHaveBeenCalledWith(
			'http://fake-backend/entitytype/',
			expect.objectContaining({ method: 'POST' })
		);
		expect(redirect).toHaveBeenCalledWith(
			'/entity',
			{ type: 'success', message: 'Entity saved successfully' },
			mockCookies
		);
	});

	it('returns fail when POST fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Invalid data' })
		});

		const result = (await server.actions.save({
			request: {},
			params: { action: 'add', id: 'new' },
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith({ type: 'error', message: 'Invalid data' }, mockCookies);
		expect(result.status).toBe(500);
	});

	it('returns fail with default message when POST fails without detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({})
		});

		const result = (await server.actions.save({
			request: {},
			params: { action: 'add', id: 'new' },
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith(
			{
				type: 'error',
				message: 'Entity not created. Please check all the details.'
			},
			mockCookies
		);
		expect(result.status).toBe(500);
	});

	it('updates entity type via PUT for existing entity type', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		await server.actions.save({
			request: {},
			params: { action: 'edit', id: '5' },
			cookies: mockCookies
		} as any);

		expect(global.fetch).toHaveBeenCalledWith(
			'http://fake-backend/entitytype/5',
			expect.objectContaining({ method: 'PUT' })
		);
		expect(redirect).toHaveBeenCalledWith(
			'/entity',
			{ type: 'success', message: 'Entity saved successfully' },
			mockCookies
		);
	});

	it('returns fail when PUT fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Update failed' })
		});

		const result = (await server.actions.save({
			request: {},
			params: { action: 'edit', id: '5' },
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith({ type: 'error', message: 'Update failed' }, mockCookies);
		expect(result.status).toBe(500);
	});

	it('returns fail with default message when PUT fails without detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({})
		});

		const result = (await server.actions.save({
			request: {},
			params: { action: 'edit', id: '5' },
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith(
			{
				type: 'error',
				message: 'Entity not updated. Please check all the details.'
			},
			mockCookies
		);
		expect(result.status).toBe(500);
	});
});

describe('page.server delete action', () => {
	beforeEach(() => vi.resetAllMocks());

	it('redirects on successful delete', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await server.actions.delete({
				params: { action: 'delete', id: '1' },
				cookies: mockCookies
			} as any);
		} catch {
			// throw redirect(303, ...) throws the mocked return value
		}

		expect(global.fetch).toHaveBeenCalledWith(
			'http://fake-backend/entitytype/1',
			expect.objectContaining({ method: 'DELETE' })
		);
		expect(redirect).toHaveBeenCalledWith(
			303,
			'/entity',
			{ type: 'success', message: 'Entity deleted successfully' },
			mockCookies
		);
	});

	it('handles failed delete with error detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: 'Not Found',
			json: async () => ({ detail: 'Entity not found' })
		});

		try {
			await server.actions.delete({
				params: { action: 'delete', id: '999' },
				cookies: mockCookies
			} as any);
		} catch {
			// throw redirect(303, ...) throws after the error flash redirect
		}

		expect(redirect).toHaveBeenCalledWith(
			'/entity',
			{ type: 'error', message: 'Entity not found' },
			mockCookies
		);
	});

	it('handles failed delete with statusText fallback', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: 'Internal Server Error',
			json: async () => ({})
		});

		try {
			await server.actions.delete({
				params: { action: 'delete', id: '1' },
				cookies: mockCookies
			} as any);
		} catch {
			// throw redirect(303, ...) throws after the error flash redirect
		}

		expect(redirect).toHaveBeenCalledWith(
			'/entity',
			{ type: 'error', message: 'Internal Server Error' },
			mockCookies
		);
	});
});
