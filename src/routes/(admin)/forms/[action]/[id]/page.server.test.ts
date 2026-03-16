import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions } from './+page.server';

// Mock environment variables
vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

// Mock supervalidate
vi.mock('sveltekit-superforms', () => ({
	superValidate: vi.fn(async () => ({
		valid: true,
		data: {}
	}))
}));

// Mock auth functions
vi.mock('$lib/server/auth.js', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token'),
	requireLogin: vi.fn(() => ({
		id: 1,
		username: 'testuser',
		email: 'test@example.com',
		organization_id: 'org-123',
		permissions: ['update_form']
	}))
}));

// Mock permissions
vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		CREATE_FORM: 'create_form',
		UPDATE_FORM: 'update_form',
		DELETE_FORM: 'delete_form'
	}
}));

// Mock flash message helpers
vi.mock('sveltekit-flash-message/server', () => ({
	redirect: vi.fn((path, message, cookies) => {
		const err: any = new Error('Redirect');
		err.location = path;
		err.flashMessage = message;
		throw err;
	}),
	setFlash: vi.fn()
}));

// Mock @sveltejs/kit fail/error
vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status, data) => ({ status, data })),
	error: vi.fn((status, message) => {
		const err: any = new Error(message);
		err.status = status;
		throw err;
	})
}));

describe('actions.addField — fixed token names', () => {
	const mockFetch = vi.fn();

	const validFieldBase = {
		field_type: 'text',
		label: 'Some Label',
		name: '', // set per test
		is_required: false,
		order: 0
	};

	const buildRequest = (fieldData: object) => {
		const formData = new FormData();
		formData.append('field', JSON.stringify(fieldData));
		return new Request('http://localhost', { method: 'POST', body: formData });
	};

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	it('should return fail(500) when backend rejects the reserved name "test_name"', async () => {
		const fieldData = { ...validFieldBase, name: 'test_name' };

		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({
				detail: [{ msg: "Field name 'test_name' is a reserved token and cannot be used." }]
			})
		});

		const result = await actions.addField({
			request: buildRequest(fieldData),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(mockFetch).toHaveBeenCalledWith(
			'http://localhost:8000/form/42/field/',
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('"test_name"')
			})
		);

		const { fail } = await import('@sveltejs/kit');
		expect(fail).toHaveBeenCalledWith(500, {});
	});

	it('should return fail(500) when backend rejects the reserved name "score"', async () => {
		const fieldData = { ...validFieldBase, name: 'score' };

		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({
				detail: [{ msg: "Field name 'score' is a reserved token and cannot be used." }]
			})
		});

		const result = await actions.addField({
			request: buildRequest(fieldData),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(mockFetch).toHaveBeenCalledWith(
			'http://localhost:8000/form/42/field/',
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('"score"')
			})
		);

		const { fail } = await import('@sveltejs/kit');
		expect(fail).toHaveBeenCalledWith(500, {});
	});

	it('should set an error flash message when a fixed token name is rejected', async () => {
		const fieldData = { ...validFieldBase, name: 'test_name' };
		const backendErrorMsg = "Field name 'test_name' is a reserved token and cannot be used.";

		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({
				detail: [{ msg: backendErrorMsg }]
			})
		});

		await actions.addField({
			request: buildRequest(fieldData),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		const { setFlash } = await import('sveltekit-flash-message/server');
		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: backendErrorMsg }),
			expect.anything()
		);
	});

	it('should succeed when a non-reserved name is used', async () => {
		const fieldData = { ...validFieldBase, name: 'full_name_custom' };

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ id: 99, ...fieldData })
		});

		const result = await actions.addField({
			request: buildRequest(fieldData),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(result).toEqual({ success: true, id: 99 });
	});
});
