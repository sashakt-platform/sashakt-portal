import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend.com'
}));

vi.mock('sveltekit-superforms', () => ({
	superValidate: vi.fn(async (input) => {
		if (input instanceof Request) {
			const body = await input.json();
			// Drop superform metadata fields
			const { __superform_id, ...rest } = body;
			return { valid: true, data: rest };
		}
		// load-time: input is the seed data, return it wrapped
		return { valid: true, data: input };
	})
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4: vi.fn(() => ({}))
}));

vi.mock('$lib/server/auth.js', () => ({
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

const requireAnyPermissionMock = vi.fn();
vi.mock('$lib/utils/permissions.js', () => ({
	requireAnyPermission: (...args: any[]) => requireAnyPermissionMock(...args),
	PERMISSIONS: {
		UPDATE_ORGANIZATION_SETTINGS: 'update_organization_settings',
		UPDATE_MY_ORGANIZATION_SETTINGS: 'update_my_organization_settings'
	}
}));

const redirectMock = vi.fn();
vi.mock('sveltekit-flash-message/server', () => ({
	redirect: (...args: any[]) => {
		redirectMock(...args);
		throw { status: args[0], location: args[1], message: args[2] };
	}
}));

function defaultSettings() {
	return {
		version: 3,
		test_timings: {
			mode: 'fixed',
			value: { time_limit: 60, start_time: '09:00:00', end_time: '17:00:00' }
		},
		questions_per_page: { mode: 'fixed', value: { question_pagination: 1 } },
		marking_scheme: { mode: 'fixed', value: { correct: 1, wrong: 0, skipped: 0 } },
		answer_review: { mode: 'fixed', value: { default: 'off' } },
		question_palette: { mode: 'fixed', value: { default: true } },
		mark_for_review: { mode: 'fixed', value: { default: true } },
		omr_mode: { mode: 'fixed', value: { default: false } },
		platform_guide: { value: { file_path: null } },
		analytics_link: { value: { url: null } }
	};
}

function mockEvent({
	user = { organization_id: 42 },
	fetch = vi.fn(),
	request
}: {
	user?: { organization_id: number } | null;
	fetch?: any;
	request?: Request;
}) {
	return {
		fetch,
		locals: { user },
		cookies: {} as any,
		request: request ?? new Request('http://localhost', { method: 'POST' })
	} as any;
}

describe('Organization Settings - load()', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('fetches settings from backend with correct URL and bearer', async () => {
		const fetchMock = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({ settings: defaultSettings() })
		});

		const result = await load(mockEvent({ fetch: fetchMock }));

		expect(fetchMock).toHaveBeenCalledWith(
			'http://fake-backend.com/organization/42/settings',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					Authorization: 'Bearer fake-token'
				})
			})
		);
		expect(result.organizationId).toBe(42);
		expect(result.form).toBeDefined();
	});

	it('trims ":SS" from start/end times coming from the backend', async () => {
		const settings = defaultSettings();
		settings.test_timings.value.start_time = '09:30:00';
		settings.test_timings.value.end_time = '18:45:00';

		const fetchMock = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({ settings })
		});

		const result = await load(mockEvent({ fetch: fetchMock }));

		expect(result.form.data.test_timings.value.start_time).toBe('09:30');
		expect(result.form.data.test_timings.value.end_time).toBe('18:45');
	});

	it('calls requireAnyPermission with both settings permissions', async () => {
		const fetchMock = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({ settings: defaultSettings() })
		});

		await load(mockEvent({ fetch: fetchMock }));

		expect(requireAnyPermissionMock).toHaveBeenCalledWith(
			expect.objectContaining({ organization_id: 42 }),
			['update_organization_settings', 'update_my_organization_settings']
		);
	});

	it('throws 403 when requireAnyPermission rejects', async () => {
		requireAnyPermissionMock.mockImplementationOnce(() => {
			throw { status: 403, body: 'Access denied' };
		});

		await expect(load(mockEvent({ fetch: vi.fn() }))).rejects.toMatchObject({ status: 403 });
	});

	it('throws backend error status when settings fetch fails', async () => {
		const fetchMock = vi.fn().mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: 'Internal Server Error'
		});

		await expect(load(mockEvent({ fetch: fetchMock }))).rejects.toMatchObject({ status: 500 });
	});
});

describe('Organization Settings - actions.save', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	async function buildRequestWithSettings() {
		const body = defaultSettings();
		body.test_timings.value.start_time = '09:00';
		body.test_timings.value.end_time = '17:00';
		return new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...body, __superform_id: 'x' })
		});
	}

	it('PUTs settings to backend and redirects on success', async () => {
		const request = await buildRequestWithSettings();
		const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await actions.save!(mockEvent({ fetch: fetchMock, request }));
			expect.fail('should have redirected');
		} catch (error: any) {
			expect(error.status).toBe(303);
			expect(error.location).toBe('/organization/settings');
		}

		expect(fetchMock).toHaveBeenCalledWith(
			'http://fake-backend.com/organization/42/settings',
			expect.objectContaining({
				method: 'PUT',
				headers: expect.objectContaining({
					Authorization: 'Bearer fake-token',
					'Content-Type': 'application/json'
				})
			})
		);
	});

	it('appends ":00" to time values before PUT', async () => {
		const request = await buildRequestWithSettings();
		const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await actions.save!(mockEvent({ fetch: fetchMock, request }));
		} catch {
			/* expected redirect */
		}

		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body.settings.test_timings.value.start_time).toBe('09:00:00');
		expect(body.settings.test_timings.value.end_time).toBe('17:00:00');
	});

	it('returns fail(status) when backend errors', async () => {
		const request = await buildRequestWithSettings();
		const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false, status: 422 });

		const result = await actions.save!(mockEvent({ fetch: fetchMock, request }));
		expect(result?.status).toBe(422);
	});

	it('enforces permissions via requireAnyPermission', async () => {
		requireAnyPermissionMock.mockImplementationOnce(() => {
			throw { status: 403 };
		});

		await expect(
			actions.save!(mockEvent({ fetch: vi.fn(), request: await buildRequestWithSettings() }))
		).rejects.toMatchObject({ status: 403 });
	});

	it('PUTs platform_nomenclature payload to backend when included in body', async () => {
		const body = defaultSettings() as Record<string, any>;
		body.test_timings.value.start_time = '09:00';
		body.test_timings.value.end_time = '17:00';
		body.platform_nomenclature = {
			mode: 'custom',
			value: { tests: 'Exams', user: 'Member' }
		};

		const request = new Request('http://localhost', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ...body, __superform_id: 'x' })
		});
		const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await actions.save!(mockEvent({ fetch: fetchMock, request }));
		} catch {
			/* expected redirect */
		}

		const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(sentBody.settings.platform_nomenclature.mode).toBe('custom');
		expect(sentBody.settings.platform_nomenclature.value.tests).toBe('Exams');
		expect(sentBody.settings.platform_nomenclature.value.user).toBe('Member');
	});
});
