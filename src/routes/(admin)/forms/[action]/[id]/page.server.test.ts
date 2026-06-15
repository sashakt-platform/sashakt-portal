import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { superValidate } from 'sveltekit-superforms';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { setFlash, redirect } from 'sveltekit-flash-message/server';
import { fail } from '@sveltejs/kit';

// Mock environment variables
vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

vi.mock('$lib/server/nomenclature', () => ({
	serverTerms: vi.fn(
		async () => (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
	)
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

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4: vi.fn(() => ({}))
}));

describe('load — permission checks based on params.action', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ items: [] })
		});
		vi.clearAllMocks();
	});

	it('calls requirePermission with CREATE_FORM when action is "add"', async () => {
		await load({ params: { action: 'add', id: 'new' } } as any);

		const { requirePermission, PERMISSIONS } = await import('$lib/utils/permissions.js');
		expect(requirePermission).toHaveBeenCalledWith(expect.anything(), PERMISSIONS.CREATE_FORM);
	});

	it('calls requirePermission with UPDATE_FORM when action is "edit"', async () => {
		mockFetch
			.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '42', name: 'My Form' }) });

		await load({ params: { action: 'edit', id: '42' } } as any);

		const { requirePermission, PERMISSIONS } = await import('$lib/utils/permissions.js');
		expect(requirePermission).toHaveBeenCalledWith(expect.anything(), PERMISSIONS.UPDATE_FORM);
	});

	it('calls requirePermission with DELETE_FORM when action is "delete"', async () => {
		await load({ params: { action: 'delete', id: '42' } } as any);

		const { requirePermission, PERMISSIONS } = await import('$lib/utils/permissions.js');
		expect(requirePermission).toHaveBeenCalledWith(expect.anything(), PERMISSIONS.DELETE_FORM);
	});

	it('does not call requirePermission for an unknown action', async () => {
		await load({ params: { action: 'view', id: '42' } } as any);

		const { requirePermission } = await import('$lib/utils/permissions.js');
		expect(requirePermission).not.toHaveBeenCalled();
	});
});

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

	it('should return fail(500) and show error when a duplicate custom field name is used', async () => {
		const duplicateName = 'participant_city';
		const firstField = { ...validFieldBase, name: duplicateName, label: 'City' };
		const secondField = { ...validFieldBase, name: duplicateName, label: 'City Again' };

		// First call succeeds
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ id: 10, ...firstField })
		});

		const firstResult = await actions.addField({
			request: buildRequest(firstField),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(firstResult).toEqual({ success: true, id: 10 });

		vi.clearAllMocks();

		// Second call with the same name is rejected by the backend
		const backendErrorMsg = `Field with name '${duplicateName}' already exists in this form.`;
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({
				detail: [{ msg: backendErrorMsg }]
			})
		});

		await actions.addField({
			request: buildRequest(secondField),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		const { fail } = await import('@sveltejs/kit');
		expect(fail).toHaveBeenCalledWith(500, {});

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

describe('actions.save', () => {
	const mockFetch = vi.fn();

	const mockRequest = () =>
		new Request('http://localhost', { method: 'POST', body: new FormData() });

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	// ── Permissions ───────────────────────────────────────────────────────────
	describe('permissions', () => {
		it('calls requirePermission with UPDATE_FORM when action is "edit"', async () => {
			mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			try {
				await actions.save({
					request: mockRequest(),
					params: { action: 'edit', id: '42' },
					cookies: {} as any
				} as any);
			} catch {}

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.UPDATE_FORM
			);
		});

		it('calls requirePermission with CREATE_FORM when action is "add"', async () => {
			mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 99 }) });

			try {
				await actions.save({
					request: mockRequest(),
					params: { action: 'add', id: 'new' },
					cookies: {} as any
				} as any);
			} catch {}

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.CREATE_FORM
			);
		});
	});

	// ── Invalid form ──────────────────────────────────────────────────────────
	describe('invalid form', () => {
		it('returns fail(400) and sets error flash when form is invalid', async () => {
			vi.mocked(superValidate).mockResolvedValueOnce({ valid: false, data: {} } as any);

			await actions.save({
				request: mockRequest(),
				params: { action: 'add', id: 'new' },
				cookies: {} as any
			} as any);

			expect(fail).toHaveBeenCalledWith(400, expect.objectContaining({ form: expect.anything() }));
			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error' }),
				expect.anything()
			);
		});
	});

	// ── Create new form (id = "new") ──────────────────────────────────────────
	describe('create new form (id = "new")', () => {
		it('POSTs to /form/ and redirects to edit page when backend succeeds', async () => {
			mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 55 }) });

			try {
				await actions.save({
					request: mockRequest(),
					params: { action: 'add', id: 'new' },
					cookies: {} as any
				} as any);
				expect.fail('Should have redirected');
			} catch (error: any) {
				expect(error.location).toBe('/forms/edit/55');
			}

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/form/',
				expect.objectContaining({ method: 'POST' })
			);
		});

		it('returns fail(500) and sets error flash when POST fails', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ detail: 'Server error' })
			});

			await actions.save({
				request: mockRequest(),
				params: { action: 'add', id: 'new' },
				cookies: {} as any
			} as any);

			expect(fail).toHaveBeenCalledWith(500, expect.objectContaining({ form: expect.anything() }));
			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error', message: 'Server error' }),
				expect.anything()
			);
		});

		it('sets organization_id from user onto form.data before sending to backend', async () => {
			mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 77 }) });

			try {
				await actions.save({
					request: mockRequest(),
					params: { action: 'add', id: 'new' },
					cookies: {} as any
				} as any);
			} catch {}

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.organization_id).toBe('org-123');
		});
	});

	// ── Update existing form (id != "new") ────────────────────────────────────
	describe('update existing form (id != "new")', () => {
		it('PUTs to /form/:id and redirects to /forms when backend succeeds', async () => {
			mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			try {
				await actions.save({
					request: mockRequest(),
					params: { action: 'edit', id: '42' },
					cookies: {} as any
				} as any);
				expect.fail('Should have redirected');
			} catch (error: any) {
				expect(error.location).toBe('/forms');
			}

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/form/42',
				expect.objectContaining({ method: 'PUT' })
			);
		});

		it('returns fail(500) and sets error flash when PUT fails', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ detail: 'Update failed' })
			});

			await actions.save({
				request: mockRequest(),
				params: { action: 'edit', id: '42' },
				cookies: {} as any
			} as any);

			expect(fail).toHaveBeenCalledWith(500, expect.objectContaining({ form: expect.anything() }));
			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error', message: 'Update failed' }),
				expect.anything()
			);
		});
	});
});

describe('load — entity types fetch', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	it('populates entityTypes from API response when fetch succeeds', async () => {
		const fakeEntityTypes = [
			{ id: 1, name: 'School' },
			{ id: 2, name: 'Hospital' }
		];
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: fakeEntityTypes })
		});

		const result = await load({ params: { action: 'add', id: 'new' } } as any);

		expect(result.entityTypes).toEqual(fakeEntityTypes);
	});

	it('returns empty entityTypes and does not throw when entity types API returns non-ok', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error' });

		const result = await load({ params: { action: 'add', id: 'new' } } as any);

		expect(result.entityTypes).toEqual([]);
	});

	it('returns empty entityTypes and does not throw when entity types fetch throws a network error', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const result = await load({ params: { action: 'add', id: 'new' } } as any);

		expect(result.entityTypes).toEqual([]);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// load — edit mode form data fetch
// ─────────────────────────────────────────────────────────────────────────────
describe('load — edit mode form data fetch', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	it('fetches and returns formData when action is "edit" and backend succeeds', async () => {
		const fakeForm = { id: '42', name: 'Survey Form', is_active: true };
		mockFetch
			.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
			.mockResolvedValueOnce({ ok: true, json: async () => fakeForm });

		const result = await load({ params: { action: 'edit', id: '42' } } as any);

		expect(result.formData).toEqual(fakeForm);
	});

	it('throws an error with the response status when form data fetch fails in edit mode', async () => {
		mockFetch
			.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) }) // entity types
			.mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' }); // form data

		await expect(load({ params: { action: 'edit', id: '42' } } as any)).rejects.toMatchObject({
			status: 404
		});
	});

	it('does not fetch form data when action is "add" — only one fetch call is made', async () => {
		mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });

		await load({ params: { action: 'add', id: 'new' } } as any);

		expect(mockFetch).toHaveBeenCalledTimes(1);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// actions.addField — input validation and success
// ─────────────────────────────────────────────────────────────────────────────
describe('actions.addField — input validation and success', () => {
	const mockFetch = vi.fn();

	const validField = {
		field_type: 'text',
		label: 'Full Name',
		name: 'full_name',
		is_required: false,
		order: 0
	};

	const buildRequest = (field: object | string) => {
		const formData = new FormData();
		formData.append('field', typeof field === 'string' ? field : JSON.stringify(field));
		return new Request('http://localhost', { method: 'POST', body: formData });
	};

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	it('returns fail(400) and sets error flash when field value is not valid JSON', async () => {
		await actions.addField({
			request: buildRequest('{ broken json }'),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(fail).toHaveBeenCalledWith(400, {});
		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: 'Invalid JSON for field' }),
			expect.anything()
		);
	});

	it('returns fail(400) and sets error flash when field data fails schema validation', async () => {
		const invalidField = { field_type: 'text', label: 'Name' };

		await actions.addField({
			request: buildRequest(invalidField),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(fail).toHaveBeenCalledWith(400, expect.objectContaining({ errors: expect.anything() }));
		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'error',
				message: 'Invalid field data. Please check all required fields.'
			}),
			expect.anything()
		);
	});

	it('sets success flash when field is added successfully', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ id: 101, ...validField })
		});

		await actions.addField({
			request: buildRequest(validField),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'success', message: 'Field added successfully' }),
			expect.anything()
		);
	});

	it('shows plain string backend error in flash (not array format)', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Field name conflicts with system field' })
		});

		await actions.addField({
			request: buildRequest(validField),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: 'Field name conflicts with system field' }),
			expect.anything()
		);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// actions.updateField
// ─────────────────────────────────────────────────────────────────────────────
describe('actions.updateField', () => {
	const mockFetch = vi.fn();

	const validField = {
		field_type: 'text',
		label: 'Full Name',
		name: 'full_name',
		is_required: false,
		order: 0
	};

	const buildRequest = (fieldId: string, field: object | string) => {
		const formData = new FormData();
		formData.append('fieldId', fieldId);
		formData.append('field', typeof field === 'string' ? field : JSON.stringify(field));
		return new Request('http://localhost', { method: 'POST', body: formData });
	};

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	it('calls requirePermission with UPDATE_FORM', async () => {
		mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		await actions.updateField({
			request: buildRequest('10', validField),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(requirePermission).toHaveBeenCalledWith(
			expect.objectContaining({ id: 1 }),
			PERMISSIONS.UPDATE_FORM
		);
	});

	it('returns fail(400) and sets error flash when field value is not valid JSON', async () => {
		await actions.updateField({
			request: buildRequest('10', '{ broken json }'),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(fail).toHaveBeenCalledWith(400, {});
		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: 'Invalid JSON for field' }),
			expect.anything()
		);
	});

	it('returns fail(400) and sets error flash when field data fails schema validation', async () => {
		const invalidField = { field_type: 'text', label: 'Name' };

		await actions.updateField({
			request: buildRequest('10', invalidField),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(fail).toHaveBeenCalledWith(400, expect.objectContaining({ errors: expect.anything() }));
		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'error',
				message: 'Invalid field data. Please check all required fields.'
			}),
			expect.anything()
		);
	});

	it('returns success and sets success flash when backend succeeds', async () => {
		mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		const result = await actions.updateField({
			request: buildRequest('10', validField),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(result).toEqual({ success: true });
		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'success', message: 'Field updated successfully' }),
			expect.anything()
		);
	});

	it('returns fail(500) and sets error flash when backend fails', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Field update failed' })
		});

		await actions.updateField({
			request: buildRequest('10', validField),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(fail).toHaveBeenCalledWith(500, {});
		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: 'Field update failed' }),
			expect.anything()
		);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// actions.deleteField
// ─────────────────────────────────────────────────────────────────────────────
describe('actions.deleteField', () => {
	const mockFetch = vi.fn();

	const buildRequest = (fieldId: string) => {
		const formData = new FormData();
		formData.append('fieldId', fieldId);
		return new Request('http://localhost', { method: 'POST', body: formData });
	};

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	it('calls requirePermission with UPDATE_FORM', async () => {
		mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		await actions.deleteField({
			request: buildRequest('10'),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(requirePermission).toHaveBeenCalledWith(
			expect.objectContaining({ id: 1 }),
			PERMISSIONS.UPDATE_FORM
		);
	});

	it('returns success and sets success flash when backend succeeds', async () => {
		mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		const result = await actions.deleteField({
			request: buildRequest('10'),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(result).toEqual({ success: true });
		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'success', message: 'Field deleted successfully' }),
			expect.anything()
		);
	});

	it('returns fail(500) and sets error flash with backend detail when DELETE fails with JSON error', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Cannot delete a required field' })
		});

		await actions.deleteField({
			request: buildRequest('10'),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(fail).toHaveBeenCalledWith(500, {});
		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: 'Cannot delete a required field' }),
			expect.anything()
		);
	});

	it('returns fail(500) with default message when DELETE fails with non-JSON response', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => {
				throw new Error('Not JSON');
			}
		});

		await actions.deleteField({
			request: buildRequest('10'),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(fail).toHaveBeenCalledWith(500, {});
		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: 'Failed to delete field' }),
			expect.anything()
		);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// actions.reorderFields
// ─────────────────────────────────────────────────────────────────────────────
describe('actions.reorderFields', () => {
	const mockFetch = vi.fn();

	const buildRequest = (fieldIds: number[] | string) => {
		const formData = new FormData();
		formData.append('fieldIds', typeof fieldIds === 'string' ? fieldIds : JSON.stringify(fieldIds));
		return new Request('http://localhost', { method: 'POST', body: formData });
	};

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	it('calls requirePermission with UPDATE_FORM', async () => {
		mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		await actions.reorderFields({
			request: buildRequest([1, 2, 3]),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(requirePermission).toHaveBeenCalledWith(
			expect.objectContaining({ id: 1 }),
			PERMISSIONS.UPDATE_FORM
		);
	});

	it('returns fail(400) and sets error flash when fieldIds value is not valid JSON', async () => {
		await actions.reorderFields({
			request: buildRequest('{ broken json }'),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(fail).toHaveBeenCalledWith(400, {});
		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: 'Invalid JSON for field order' }),
			expect.anything()
		);
	});

	it('returns success and sends correct body to /field/reorder when backend succeeds', async () => {
		mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		const result = await actions.reorderFields({
			request: buildRequest([3, 1, 2]),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(result).toEqual({ success: true });
		expect(mockFetch).toHaveBeenCalledWith(
			'http://localhost:8000/form/42/field/reorder',
			expect.objectContaining({
				method: 'PUT',
				body: JSON.stringify({ field_ids: [3, 1, 2] })
			})
		);
	});

	it('returns fail(500) and sets error flash when backend fails', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Reorder operation failed' })
		});

		await actions.reorderFields({
			request: buildRequest([1, 2, 3]),
			params: { action: 'edit', id: '42' },
			cookies: {} as any
		} as any);

		expect(fail).toHaveBeenCalledWith(500, {});
		expect(setFlash).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: 'Reorder operation failed' }),
			expect.anything()
		);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// actions.delete
// ─────────────────────────────────────────────────────────────────────────────
describe('actions.delete', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	it('calls requirePermission with DELETE_FORM', async () => {
		mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await actions.delete({
				params: { action: 'delete', id: '42' },
				cookies: {} as any
			} as any);
		} catch {}

		expect(requirePermission).toHaveBeenCalledWith(
			expect.objectContaining({ id: 1 }),
			PERMISSIONS.DELETE_FORM
		);
	});

	it('redirects to /forms with success message when backend succeeds', async () => {
		mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await actions.delete({
				params: { action: 'delete', id: '42' },
				cookies: {} as any
			} as any);
			expect.fail('Should have redirected');
		} catch {}

		expect(redirect).toHaveBeenCalledWith(
			303,
			'/forms',
			expect.objectContaining({ type: 'success', message: 'Form Deleted Successfully' }),
			expect.anything()
		);
	});

	it('redirects to /forms with error message when backend fails', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			statusText: 'Not Found',
			json: async () => ({ detail: 'Form not found' })
		});

		try {
			await actions.delete({
				params: { action: 'delete', id: '42' },
				cookies: {} as any
			} as any);
			expect.fail('Should have redirected');
		} catch {}

		expect(redirect).toHaveBeenCalledWith(
			303,
			'/forms',
			expect.objectContaining({ type: 'error', message: 'Form not found' }),
			expect.anything()
		);
	});
});
