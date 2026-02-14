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
		DELETE_ENTITY: 'DELETE_ENTITY'
	}
}));

vi.mock('sveltekit-superforms', () => ({
	superValidate: vi.fn(async () => ({
		valid: true,
		data: { name: 'Test Entity', entity_type_id: 1 }
	}))
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4: vi.fn((schema) => schema)
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

	describe('add action', () => {
		it('loads form for add action', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 1, name: 'CLF' })
			});

			const result = (await server.load({
				params: { action: 'view', id: '1', entityAction: 'add', entityId: 'new' }
			} as any)) as any;

			expect(result.entityAction).toBe('add');
			expect(result.form).toBeDefined();
			expect(result.entity).toBeNull();
			expect(result.entityTypeId).toBe('1');
		});

		it('fetches entity type details on add', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 1, name: 'CLF' })
			});

			const result = (await server.load({
				params: { action: 'view', id: '1', entityAction: 'add', entityId: 'new' }
			} as any)) as any;

			expect(result.entityType).toEqual({ id: 1, name: 'CLF' });
		});

		it('handles failed entity type fetch on add', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				statusText: 'Not found'
			});

			const result = (await server.load({
				params: { action: 'view', id: '99', entityAction: 'add', entityId: 'new' }
			} as any)) as any;

			expect(result.entityType).toBeNull();
		});
	});

	describe('edit action', () => {
		it('loads entity data for edit action', async () => {
			const mockEntity = {
				id: 5,
				name: 'My Entity',
				entity_type_id: 1,
				state: { id: 1, name: 'Maharashtra' },
				district: { id: 1, name: 'Pune' },
				block: { id: 1, name: 'Haveli' }
			};

			(global.fetch as any)
				.mockResolvedValueOnce({ ok: true, json: async () => mockEntity })
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, name: 'CLF' }) });

			const result = (await server.load({
				params: { action: 'view', id: '1', entityAction: 'edit', entityId: '5' }
			} as any)) as any;

			expect(result.entityAction).toBe('edit');
			expect(result.entity).toEqual(mockEntity);
			expect(result.entityType).toEqual({ id: 1, name: 'CLF' });
		});

		it('handles failed entity fetch in edit mode', async () => {
			(global.fetch as any)
				.mockResolvedValueOnce({ ok: false, statusText: 'Not found' })
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, name: 'CLF' }) });

			const result = (await server.load({
				params: { action: 'view', id: '1', entityAction: 'edit', entityId: '999' }
			} as any)) as any;

			expect(result.entity).toBeNull();
		});

		it('handles failed entity type fetch in edit mode', async () => {
			const mockEntity = { id: 5, name: 'My Entity', entity_type_id: 1 };

			(global.fetch as any)
				.mockResolvedValueOnce({ ok: true, json: async () => mockEntity })
				.mockResolvedValueOnce({ ok: false, statusText: 'Server error' });

			const result = (await server.load({
				params: { action: 'view', id: '1', entityAction: 'edit', entityId: '5' }
			} as any)) as any;

			expect(result.entity).toEqual(mockEntity);
			expect(result.entityType).toBeNull();
		});
	});

	describe('return values', () => {
		it('returns currentUser from requireLogin', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 1, name: 'CLF' })
			});

			const result = (await server.load({
				params: { action: 'view', id: '1', entityAction: 'add', entityId: 'new' }
			} as any)) as any;

			expect(result.currentUser).toEqual({ id: 1, name: 'Test User' });
		});

		it('returns entityId from params', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ id: 1, name: 'CLF' })
			});

			const result = (await server.load({
				params: { action: 'view', id: '1', entityAction: 'add', entityId: 'new' }
			} as any)) as any;

			expect(result.entityId).toBe('new');
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
			params: { action: 'view', id: '1', entityAction: 'add', entityId: 'new' },
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith(
			{ type: 'error', message: 'Record not saved. Please check all the details.' },
			mockCookies
		);
		expect(result.status).toBe(400);
	});

	it('creates entity via POST for new entity', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await server.actions.save({
				request: {},
				params: { action: 'view', id: '1', entityAction: 'add', entityId: 'new' },
				cookies: mockCookies
			} as any);
		} catch {
			// throw redirect(303, ...) throws
		}

		expect(global.fetch).toHaveBeenCalledWith(
			'http://fake-backend/entity/',
			expect.objectContaining({ method: 'POST' })
		);
		expect(redirect).toHaveBeenCalledWith(
			303,
			'/entity/view/1',
			{ type: 'success', message: 'Record saved successfully' },
			mockCookies
		);
	});

	it('returns fail when POST fails with detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Duplicate name' })
		});

		const result = (await server.actions.save({
			request: {},
			params: { action: 'view', id: '1', entityAction: 'add', entityId: 'new' },
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith(
			{ type: 'error', message: 'Duplicate name' },
			mockCookies
		);
		expect(result.status).toBe(500);
	});

	it('returns fail with default message when POST fails without detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({})
		});

		const result = (await server.actions.save({
			request: {},
			params: { action: 'view', id: '1', entityAction: 'add', entityId: 'new' },
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith(
			{ type: 'error', message: 'Record not created. Please check all the details.' },
			mockCookies
		);
		expect(result.status).toBe(500);
	});

	it('updates entity via PUT for existing entity', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await server.actions.save({
				request: {},
				params: { action: 'view', id: '1', entityAction: 'edit', entityId: '5' },
				cookies: mockCookies
			} as any);
		} catch {
			// throw redirect(303, ...) throws
		}

		expect(global.fetch).toHaveBeenCalledWith(
			'http://fake-backend/entity/5',
			expect.objectContaining({ method: 'PUT' })
		);
		expect(redirect).toHaveBeenCalledWith(
			303,
			'/entity/view/1',
			{ type: 'success', message: 'Record saved successfully' },
			mockCookies
		);
	});

	it('returns fail when PUT fails with detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Update failed' })
		});

		const result = (await server.actions.save({
			request: {},
			params: { action: 'view', id: '1', entityAction: 'edit', entityId: '5' },
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
			params: { action: 'view', id: '1', entityAction: 'edit', entityId: '5' },
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith(
			{ type: 'error', message: 'Record not updated. Please check all the details.' },
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
				params: { action: 'view', id: '1', entityAction: 'delete', entityId: '5' },
				cookies: mockCookies
			} as any);
		} catch {
			// throw redirect(303, ...) throws the mocked return value
		}

		expect(global.fetch).toHaveBeenCalledWith(
			'http://fake-backend/entity/5',
			expect.objectContaining({ method: 'DELETE' })
		);
		expect(redirect).toHaveBeenCalledWith(
			303,
			'/entity/view/1',
			{ type: 'success', message: 'Record deleted successfully' },
			mockCookies
		);
	});

	it('handles failed delete with error detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: 'Not Found',
			json: async () => ({ detail: 'Record not found' })
		});

		try {
			await server.actions.delete({
				params: { action: 'view', id: '1', entityAction: 'delete', entityId: '999' },
				cookies: mockCookies
			} as any);
		} catch {
			// throw redirect(303, ...) throws after the error flash redirect
		}

		expect(redirect).toHaveBeenCalledWith(
			303,
			'/entity/view/1',
			{ type: 'error', message: 'Record not found' },
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
				params: { action: 'view', id: '1', entityAction: 'delete', entityId: '5' },
				cookies: mockCookies
			} as any);
		} catch {
			// throw redirect(303, ...) throws after the error flash redirect
		}

		expect(redirect).toHaveBeenCalledWith(
			303,
			'/entity/view/1',
			{ type: 'error', message: 'Internal Server Error' },
			mockCookies
		);
	});
});
