import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as server from './+page.server';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { createCertificateSchema, editCertificateSchema } from './schema.js';

vi.mock('$lib/server/auth.js', () => ({
	requireLogin: vi.fn(() => ({ id: 1, organization_id: 10, name: 'Test User' })),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		CREATE_CERTIFICATE: 'CREATE_CERTIFICATE',
		UPDATE_CERTIFICATE: 'UPDATE_CERTIFICATE',
		DELETE_CERTIFICATE: 'DELETE_CERTIFICATE'
	}
}));

vi.mock('sveltekit-superforms', () => ({
	superValidate: vi.fn(async () => ({ valid: true, data: { name: 'Test Certificate' } }))
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4: vi.fn((schema) => schema)
}));

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend'
}));

vi.mock('$lib/server/nomenclature', () => ({
	serverTerms: vi.fn(
		async () => (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
	)
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
		it('loads form for add action without fetching certificate data', async () => {
			const result = (await server.load({
				params: { action: 'add', id: 'new' }
			} as any)) as any;

			expect(result.action).toBe('add');
			expect(result.id).toBe('new');
			expect(result.form).toBeDefined();
			expect(result.certificate).toBeNull();
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('uses createCertificateSchema for add action', async () => {
			const zod4 = (await import('sveltekit-superforms/adapters')).zod4;

			await server.load({ params: { action: 'add', id: 'new' } } as any);

			expect(zod4).toHaveBeenCalledWith(createCertificateSchema);
		});
	});

	describe('edit action', () => {
		it('loads certificate data for edit action', async () => {
			const mockCertificate = { id: 1, name: 'Completion Certificate', url: 'http://example.com' };

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockCertificate
			});

			const result = (await server.load({
				params: { action: 'edit', id: '1' }
			} as any)) as any;

			expect(result.action).toBe('edit');
			expect(result.certificate).toEqual(mockCertificate);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://fake-backend/certificate/1',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({ Authorization: 'Bearer fake-token' })
				})
			);
		});

		it('uses editCertificateSchema for edit action', async () => {
			(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
			const zod4 = (await import('sveltekit-superforms/adapters')).zod4;

			await server.load({ params: { action: 'edit', id: '1' } } as any);

			expect(zod4).toHaveBeenCalledWith(editCertificateSchema);
		});

		it('returns null certificate when fetch response is not ok', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				statusText: 'Not Found'
			});

			const result = (await server.load({
				params: { action: 'edit', id: '999' }
			} as any)) as any;

			expect(result.certificate).toBeNull();
		});

		it('returns null certificate when fetch throws', async () => {
			(global.fetch as any).mockRejectedValueOnce(new Error('Network failure'));

			const result = (await server.load({
				params: { action: 'edit', id: '1' }
			} as any)) as any;

			expect(result.certificate).toBeNull();
		});
	});

	describe('delete action', () => {
		it('does not fetch certificate data for delete action', async () => {
			const result = (await server.load({
				params: { action: 'delete', id: '1' }
			} as any)) as any;

			expect(result.action).toBe('delete');
			expect(result.certificate).toBeNull();
			expect(global.fetch).not.toHaveBeenCalled();
		});
	});

	it('returns currentUser from requireLogin', async () => {
		const result = (await server.load({
			params: { action: 'add', id: 'new' }
		} as any)) as any;

		expect(result.currentUser).toEqual({ id: 1, organization_id: 10, name: 'Test User' });
	});
});

describe('page.server save action', () => {
	beforeEach(() => vi.resetAllMocks());

	it('returns fail when form is invalid', async () => {
		(superValidate as any).mockResolvedValueOnce({ valid: false, data: {} });

		const result = (await server.actions.save({
			request: {},
			params: { action: 'add', id: 'new' },
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith(
			{ type: 'error', message: 'Certificate not created. Please check all the details.' },
			mockCookies
		);
		expect(result.status).toBe(400);
	});

	it('assigns organization_id from current user to form data', async () => {
		(superValidate as any).mockResolvedValueOnce({ valid: true, data: {} });
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await server.actions.save({
				request: {},
				params: { action: 'add', id: 'new' },
				cookies: mockCookies
			} as any);
		} catch {
			// redirect() throws in production
		}

		const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
		expect(body.organization_id).toBe(10);
	});

	it('creates certificate via POST for new certificate', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await server.actions.save({
				request: {},
				params: { action: 'add', id: 'new' },
				cookies: mockCookies
			} as any);
		} catch {
			// redirect() throws in production
		}

		expect(global.fetch).toHaveBeenCalledWith(
			'http://fake-backend/certificate/',
			expect.objectContaining({ method: 'POST' })
		);
		expect(redirect).toHaveBeenCalledWith(
			'/certificate',
			{ type: 'success', message: 'Certificate saved successfully' },
			mockCookies
		);
	});

	it('returns fail when POST fails with error detail', async () => {
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
			{ type: 'error', message: 'Certificate not created. Please check all the details.' },
			mockCookies
		);
		expect(result.status).toBe(500);
	});

	it('updates certificate via PUT for existing certificate', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await server.actions.save({
				request: {},
				params: { action: 'edit', id: '5' },
				cookies: mockCookies
			} as any);
		} catch {
			// redirect() throws in production
		}

		expect(global.fetch).toHaveBeenCalledWith(
			'http://fake-backend/certificate/5',
			expect.objectContaining({ method: 'PUT' })
		);
		expect(redirect).toHaveBeenCalledWith(
			'/certificate',
			{ type: 'success', message: 'Certificate saved successfully' },
			mockCookies
		);
	});

	it('returns fail when PUT fails with error detail', async () => {
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
			{ type: 'error', message: 'Certificate not updated. Please check all the details.' },
			mockCookies
		);
		expect(result.status).toBe(500);
	});
});

describe('page.server delete action', () => {
	beforeEach(() => vi.resetAllMocks());

	it('redirects with success message on successful delete', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await server.actions.delete({
				params: { action: 'delete', id: '1' },
				cookies: mockCookies
			} as any);
		} catch {
			// throw redirect(303, ...) throws
		}

		expect(global.fetch).toHaveBeenCalledWith(
			'http://fake-backend/certificate/1',
			expect.objectContaining({ method: 'DELETE' })
		);
		expect(redirect).toHaveBeenCalledWith(
			303,
			'/certificate',
			{ type: 'success', message: 'Certificate deleted successfully' },
			mockCookies
		);
	});

	it('redirects with error detail when delete fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: 'Not Found',
			json: async () => ({ detail: 'Certificate not found' })
		});

		try {
			await server.actions.delete({
				params: { action: 'delete', id: '999' },
				cookies: mockCookies
			} as any);
		} catch {
			// throw redirect(303, ...) throws
		}

		expect(redirect).toHaveBeenCalledWith(
			'/certificate',
			{ type: 'error', message: 'Certificate not found' },
			mockCookies
		);
	});

	it('redirects with statusText fallback when delete fails without detail', async () => {
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
			// throw redirect(303, ...) throws
		}

		expect(redirect).toHaveBeenCalledWith(
			'/certificate',
			{ type: 'error', message: 'Internal Server Error' },
			mockCookies
		);
	});
});
