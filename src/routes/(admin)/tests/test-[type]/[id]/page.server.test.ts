import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { setFlash, redirect } from 'sveltekit-flash-message/server';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token'),
	requireLogin: vi.fn(() => ({
		id: 1,
		permissions: [
			'read_test',
			'read_test_template',
			'create_test',
			'update_test',
			'delete_test',
			'create_test_template',
			'update_test_template',
			'delete_test_template'
		]
	}))
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		READ_TEST: 'read_test',
		READ_TEST_TEMPLATE: 'read_test_template',
		CREATE_TEST: 'create_test',
		UPDATE_TEST: 'update_test',
		DELETE_TEST: 'delete_test',
		CREATE_TEST_TEMPLATE: 'create_test_template',
		UPDATE_TEST_TEMPLATE: 'update_test_template',
		DELETE_TEST_TEMPLATE: 'delete_test_template'
	}
}));

vi.mock('sveltekit-flash-message/server', () => ({
	redirect: vi.fn(),
	setFlash: vi.fn()
}));

vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status, data) => ({ status, data }))
}));

vi.mock('sveltekit-superforms', () => ({
	superValidate: vi.fn()
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4: vi.fn(() => 'mock-zod4-adapter')
}));

const mockCookies = {};

function makeUrl(path: string, params = '') {
	return new URL(`http://localhost${path}${params ? '?' + params : ''}`);
}

const mockValidFormData = {
	name: 'Test Quiz',
	description: 'A test description',
	is_active: true,
	is_template: false,
	start_time: '',
	end_time: '',
	time_limit: null,
	marks_level: 'question',
	marks: null,
	marking_scheme: { correct: 1, wrong: 0, skipped: 0 },
	completion_message: null,
	start_instructions: null,
	link: null,
	no_of_attempts: 1,
	shuffle: false,
	random_questions: false,
	no_of_random_questions: null,
	random_tag_count: [{ id: 'tag1', name: 'Tag 1', count: 3 }],
	question_pagination: 0,
	template_id: null,
	tag_ids: [{ id: 'tag1', name: 'Tag 1' }],
	question_revision_ids: [1, 2],
	state_ids: [{ id: 'state1', name: 'State 1' }],
	district_ids: [{ id: 'district1', name: 'District 1' }],
	show_result: true,
	show_question_palette: true,
	locale: 'en-US',
	certificate_id: null,
	show_feedback_on_completion: false,
	show_feedback_immediately: false,
	form_id: null,
	omr: 'NEVER'
};

// ─────────────────────────────────────────────────────────────────────────────
// load()
// ─────────────────────────────────────────────────────────────────────────────

describe('Test Create/Update Page — load()', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
		(superValidate as any).mockResolvedValue({ data: { is_template: false }, valid: true });
	});

	function mockQuestionsOnly() {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});
	}

	function mockTestThenQuestions(testData = {}) {
		mockFetch
			.mockResolvedValueOnce({ ok: true, json: async () => testData })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [], total: 0, pages: 0 }) });
	}

	// ── Permissions ──────────────────────────────────────────────────────────

	describe('Permissions', () => {
		it('requires CREATE_TEST for new session test', async () => {
			mockQuestionsOnly();
			await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new')
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.CREATE_TEST
			);
		});

		it('requires CREATE_TEST_TEMPLATE for new template', async () => {
			mockQuestionsOnly();
			await load({
				params: { type: 'template', id: 'new' },
				url: makeUrl('/tests/test-template/new')
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.CREATE_TEST_TEMPLATE
			);
		});

		it('requires UPDATE_TEST for existing session test', async () => {
			mockTestThenQuestions({ id: '42', name: 'Test A' });
			await load({
				params: { type: 'session', id: '42' },
				url: makeUrl('/tests/test-session/42')
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.UPDATE_TEST
			);
		});

		it('requires UPDATE_TEST_TEMPLATE for existing template', async () => {
			mockTestThenQuestions({ id: '10', name: 'Template A' });
			await load({
				params: { type: 'template', id: '10' },
				url: makeUrl('/tests/test-template/10')
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.UPDATE_TEST_TEMPLATE
			);
		});
	});

	// ── Test data fetching ───────────────────────────────────────────────────

	describe('Test data fetching', () => {
		it('does not fetch test data when id=new', async () => {
			mockQuestionsOnly();
			await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new')
			} as any);

			const testFetches = mockFetch.mock.calls.filter(
				([url]) => url.includes('/test/') && !url.includes('/questions/')
			);
			expect(testFetches).toHaveLength(0);
		});

		it('fetches test data by id when editing', async () => {
			mockTestThenQuestions({ id: '42', name: 'Test A' });
			await load({
				params: { type: 'session', id: '42' },
				url: makeUrl('/tests/test-session/42')
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('/test/42');
		});

		it('appends is_template=false for session fetch', async () => {
			mockTestThenQuestions({ id: '42' });
			await load({
				params: { type: 'session', id: '42' },
				url: makeUrl('/tests/test-session/42')
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('is_template=false');
		});

		it('appends is_template=true for template fetch', async () => {
			mockTestThenQuestions({ id: '10' });
			await load({
				params: { type: 'template', id: '10' },
				url: makeUrl('/tests/test-template/10')
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('is_template=true');
		});

		it('returns testData from API response', async () => {
			const testData = { id: '42', name: 'Test A', question_revisions: [] };
			mockTestThenQuestions(testData);

			const result = await load({
				params: { type: 'session', id: '42' },
				url: makeUrl('/tests/test-session/42')
			} as any);

			expect(result.testData).toMatchObject({ id: '42', name: 'Test A' });
		});

		it('returns null testData for new test', async () => {
			mockQuestionsOnly();
			const result = await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new')
			} as any);

			expect(result.testData).toBeNull();
		});

		it('returns null testData when test fetch fails', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: false, statusText: 'Not Found' })
				.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [], total: 0, pages: 0 }) });

			const result = await load({
				params: { type: 'session', id: '99' },
				url: makeUrl('/tests/test-session/99')
			} as any);

			expect(result.testData).toBeNull();
		});

		it('sends Bearer token in Authorization header', async () => {
			mockTestThenQuestions({ id: '42' });
			await load({
				params: { type: 'session', id: '42' },
				url: makeUrl('/tests/test-session/42')
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/test/42'),
				expect.objectContaining({
					headers: expect.objectContaining({ Authorization: 'Bearer mock-token' })
				})
			);
		});
	});

	// ── Template (convert) loading ───────────────────────────────────────────

	describe('Template-based loading (convert)', () => {
		it('uses template_id to fetch when editing (id != new)', async () => {
			mockTestThenQuestions({ id: '5', name: 'Template A', is_template: true });
			await load({
				params: { type: 'session', id: 'convert' },
				url: makeUrl('/tests/test-session/convert', 'template_id=5')
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('/test/5');
		});

		it('sets is_template=false on testData when template_id present', async () => {
			mockTestThenQuestions({ id: '5', name: 'Template A', is_template: true, link: 'some-link' });

			const result = await load({
				params: { type: 'session', id: 'convert' },
				url: makeUrl('/tests/test-session/convert', 'template_id=5')
			} as any);

			expect(result.testData?.is_template).toBe(false);
		});

		it('sets template_id on testData when template_id present', async () => {
			mockTestThenQuestions({ id: '5', name: 'Template A', is_template: true });

			const result = await load({
				params: { type: 'session', id: 'convert' },
				url: makeUrl('/tests/test-session/convert', 'template_id=5')
			} as any);

			expect(result.testData?.template_id).toBe('5');
		});

		it('nullifies link on testData when template_id present', async () => {
			mockTestThenQuestions({ id: '5', name: 'Template A', link: 'http://some-link.com' });

			const result = await load({
				params: { type: 'session', id: 'convert' },
				url: makeUrl('/tests/test-session/convert', 'template_id=5')
			} as any);

			expect(result.testData?.link).toBeNull();
		});
	});

	// ── Questions fetching ───────────────────────────────────────────────────

	describe('Questions fetching', () => {
		it('fetches questions with default pagination', async () => {
			mockQuestionsOnly();
			await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new')
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('/questions/');
			expect(callUrl).toContain('page=1');
			expect(callUrl).toContain('size=25');
		});

		it('forwards questionSearch as question_text', async () => {
			mockQuestionsOnly();
			await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new', 'questionSearch=algebra')
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('question_text=algebra');
		});

		it('forwards questionSortBy as sort_by', async () => {
			mockQuestionsOnly();
			await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new', 'questionSortBy=name')
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('sort_by=name');
		});

		it('omits sort_by when questionSortBy not provided', async () => {
			mockQuestionsOnly();
			await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new')
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).not.toContain('sort_by');
		});

		it('defaults questionSortOrder to asc', async () => {
			mockQuestionsOnly();
			await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new')
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('sort_order=asc');
		});

		it('forwards comma-separated tag_ids as repeated params', async () => {
			mockQuestionsOnly();
			await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new', 'tag_ids=1,2,3')
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('tag_ids=1');
			expect(callUrl).toContain('tag_ids=2');
			expect(callUrl).toContain('tag_ids=3');
		});

		it('forwards comma-separated state_ids as repeated params', async () => {
			mockQuestionsOnly();
			await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new', 'state_ids=10,20')
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('state_ids=10');
			expect(callUrl).toContain('state_ids=20');
		});

		it('returns questions from API response', async () => {
			const mockQuestions = { items: [{ id: 1, question_text: 'Q1' }], total: 1, pages: 1 };
			mockFetch.mockResolvedValue({ ok: true, json: async () => mockQuestions });

			const result = await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new')
			} as any);

			expect(result.questions).toEqual(mockQuestions);
		});

		it('returns empty questions when fetch fails', async () => {
			mockFetch.mockResolvedValue({ ok: false, statusText: 'Server Error' });

			const result = await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new')
			} as any);

			expect(result.questions).toEqual({ items: [], total: 0, pages: 0 });
		});

		it('sends Bearer token for questions fetch', async () => {
			mockQuestionsOnly();
			await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new')
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/questions/'),
				expect.objectContaining({
					headers: { Authorization: 'Bearer mock-token' }
				})
			);
		});
	});

	// ── Return values ────────────────────────────────────────────────────────

	describe('Return values', () => {
		it('returns selectedQuestions from testData.question_revisions', async () => {
			const revisions = [{ id: 1 }, { id: 2 }];
			mockTestThenQuestions({ id: '42', question_revisions: revisions });

			const result = await load({
				params: { type: 'session', id: '42' },
				url: makeUrl('/tests/test-session/42')
			} as any);

			expect(result.selectedQuestions).toEqual(revisions);
		});

		it('returns empty selectedQuestions for new test', async () => {
			mockQuestionsOnly();
			const result = await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new')
			} as any);

			expect(result.selectedQuestions).toEqual([]);
		});

		it('returns default questionParams when no URL params', async () => {
			mockQuestionsOnly();
			const result = await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new')
			} as any);

			expect(result.questionParams).toMatchObject({
				questionPage: 1,
				questionSize: 25,
				questionSearch: '',
				questionSortOrder: 'asc'
			});
		});

		it('returns questionParams reflecting URL params', async () => {
			mockQuestionsOnly();
			const result = await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl(
					'/tests/test-session/new',
					'questionPage=3&questionSize=10&questionSearch=math&questionSortBy=name&questionSortOrder=desc'
				)
			} as any);

			expect(result.questionParams).toMatchObject({
				questionPage: 3,
				questionSize: 10,
				questionSearch: 'math',
				questionSortBy: 'name',
				questionSortOrder: 'desc'
			});
		});

		it('returns form from superValidate', async () => {
			mockQuestionsOnly();
			const result = await load({
				params: { type: 'session', id: 'new' },
				url: makeUrl('/tests/test-session/new')
			} as any);

			expect(result.form).toBeDefined();
		});
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// save action
// ─────────────────────────────────────────────────────────────────────────────

describe('Test Create/Update Page — save action', () => {
	const mockFetch = vi.fn();
	const mockRequest = new Request('http://localhost/test', { method: 'POST' });

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	// ── Permissions ──────────────────────────────────────────────────────────

	describe('Permissions', () => {
		it('requires CREATE_TEST for new session test', async () => {
			(superValidate as any).mockResolvedValue({ valid: false, data: mockValidFormData });
			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.CREATE_TEST
			);
		});

		it('requires CREATE_TEST_TEMPLATE for new template', async () => {
			(superValidate as any).mockResolvedValue({
				valid: false,
				data: { ...mockValidFormData, is_template: true }
			});
			await actions.save({
				request: mockRequest,
				params: { type: 'template', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.CREATE_TEST_TEMPLATE
			);
		});

		it('requires UPDATE_TEST for existing session test', async () => {
			(superValidate as any).mockResolvedValue({ valid: false, data: mockValidFormData });
			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: '42' },
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.UPDATE_TEST
			);
		});

		it('requires UPDATE_TEST_TEMPLATE for existing template', async () => {
			(superValidate as any).mockResolvedValue({
				valid: false,
				data: { ...mockValidFormData, is_template: true }
			});
			await actions.save({
				request: mockRequest,
				params: { type: 'template', id: '10' },
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.UPDATE_TEST_TEMPLATE
			);
		});
	});

	// ── Invalid form ─────────────────────────────────────────────────────────

	describe('Invalid form', () => {
		it('sets error flash when form is invalid', async () => {
			(superValidate as any).mockResolvedValue({ valid: false, data: {} });
			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(setFlash).toHaveBeenCalledWith(
				{ type: 'error', message: 'Test not Created. Please check all the details.' },
				mockCookies
			);
		});

		it('returns fail(400) when form is invalid', async () => {
			(superValidate as any).mockResolvedValue({ valid: false, data: {} });
			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(fail).toHaveBeenCalledWith(400, expect.anything());
		});

		it('does not call fetch when form is invalid', async () => {
			(superValidate as any).mockResolvedValue({ valid: false, data: {} });
			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(mockFetch).not.toHaveBeenCalled();
		});
	});

	// ── Create (id=new) ──────────────────────────────────────────────────────

	describe('Create — id=new', () => {
		it('sends POST to /test/', async () => {
			(superValidate as any).mockResolvedValue({ valid: true, data: mockValidFormData });
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: '1' }) });

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/test/',
				expect.objectContaining({ method: 'POST' })
			);
		});

		it('sends Bearer token in Authorization header', async () => {
			(superValidate as any).mockResolvedValue({ valid: true, data: mockValidFormData });
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({ Authorization: 'Bearer mock-token' })
				})
			);
		});

		it('redirects to session list on success', async () => {
			(superValidate as any).mockResolvedValue({ valid: true, data: mockValidFormData });
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(redirect).toHaveBeenCalledWith(
				'/tests/test-session',
				expect.objectContaining({ type: 'success' }),
				mockCookies
			);
		});

		it('redirects to template list when is_template=true', async () => {
			(superValidate as any).mockResolvedValue({
				valid: true,
				data: { ...mockValidFormData, is_template: true }
			});
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			await actions.save({
				request: mockRequest,
				params: { type: 'template', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(redirect).toHaveBeenCalledWith(
				'/tests/test-template',
				expect.objectContaining({ type: 'success' }),
				mockCookies
			);
		});
	});

	// ── Update (id=existing) ─────────────────────────────────────────────────

	describe('Update — id=existing', () => {
		it('sends PUT to /test/{id}', async () => {
			(superValidate as any).mockResolvedValue({ valid: true, data: mockValidFormData });
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: '42' },
				cookies: mockCookies
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/test/42',
				expect.objectContaining({ method: 'PUT' })
			);
		});

		it('redirects to session list on successful update', async () => {
			(superValidate as any).mockResolvedValue({ valid: true, data: mockValidFormData });
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: '42' },
				cookies: mockCookies
			} as any);

			expect(redirect).toHaveBeenCalledWith(
				'/tests/test-session',
				expect.objectContaining({ type: 'success' }),
				mockCookies
			);
		});
	});

	// ── Data transformation ──────────────────────────────────────────────────

	describe('Data transformation', () => {
		it('transforms state_ids objects to array of id strings', async () => {
			(superValidate as any).mockResolvedValue({ valid: true, data: mockValidFormData });
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.state_ids).toEqual(['state1']);
		});

		it('transforms tag_ids objects to array of id strings', async () => {
			(superValidate as any).mockResolvedValue({ valid: true, data: mockValidFormData });
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.tag_ids).toEqual(['tag1']);
		});

		it('transforms district_ids objects to array of id strings', async () => {
			(superValidate as any).mockResolvedValue({ valid: true, data: mockValidFormData });
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.district_ids).toEqual(['district1']);
		});

		it('transforms random_tag_count to { tag_id, count } format', async () => {
			(superValidate as any).mockResolvedValue({ valid: true, data: mockValidFormData });
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.random_tag_count).toEqual([{ tag_id: 'tag1', count: 3 }]);
		});

		it('converts empty string start_time to null', async () => {
			(superValidate as any).mockResolvedValue({
				valid: true,
				data: { ...mockValidFormData, start_time: '' }
			});
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.start_time).toBeNull();
		});

		it('converts empty string end_time to null', async () => {
			(superValidate as any).mockResolvedValue({
				valid: true,
				data: { ...mockValidFormData, end_time: '' }
			});
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.end_time).toBeNull();
		});

		it('preserves non-empty start_time as-is', async () => {
			const startTime = '2025-01-01T09:00:00';
			(superValidate as any).mockResolvedValue({
				valid: true,
				data: { ...mockValidFormData, start_time: startTime }
			});
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.start_time).toBe(startTime);
		});
	});

	// ── Error handling ───────────────────────────────────────────────────────

	describe('Error handling', () => {
		it('sets error flash with backend detail when fetch fails', async () => {
			(superValidate as any).mockResolvedValue({ valid: true, data: mockValidFormData });
			mockFetch.mockResolvedValue({
				ok: false,
				statusText: 'Internal Server Error',
				json: async () => ({ detail: 'Name already exists' })
			});

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					message: expect.stringContaining('Name already exists')
				}),
				mockCookies
			);
		});

		it('returns fail(500) when backend returns error', async () => {
			(superValidate as any).mockResolvedValue({ valid: true, data: mockValidFormData });
			mockFetch.mockResolvedValue({
				ok: false,
				statusText: 'Server Error',
				json: async () => ({ detail: 'Something went wrong' })
			});

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(fail).toHaveBeenCalledWith(500, expect.anything());
		});

		it('falls back to statusText in error message when detail is missing', async () => {
			(superValidate as any).mockResolvedValue({ valid: true, data: mockValidFormData });
			mockFetch.mockResolvedValue({
				ok: false,
				statusText: 'Bad Gateway',
				json: async () => ({})
			});

			await actions.save({
				request: mockRequest,
				params: { type: 'session', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					message: expect.stringContaining('Bad Gateway')
				}),
				mockCookies
			);
		});
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// delete action
// ─────────────────────────────────────────────────────────────────────────────

describe('Test Create/Update Page — delete action', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	describe('Permissions', () => {
		it('requires DELETE_TEST for session test', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
			await actions.delete({
				params: { type: 'session', id: '42' },
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.DELETE_TEST
			);
		});

		it('requires DELETE_TEST_TEMPLATE for template', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
			await actions.delete({
				params: { type: 'template', id: '10' },
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.DELETE_TEST_TEMPLATE
			);
		});
	});

	it('sends DELETE to /test/{id}', async () => {
		mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
		await actions.delete({
			params: { type: 'session', id: '42' },
			cookies: mockCookies
		} as any);

		expect(mockFetch).toHaveBeenCalledWith(
			'http://localhost:8000/test/42',
			expect.objectContaining({ method: 'DELETE' })
		);
	});

	it('sends Bearer token in Authorization header', async () => {
		mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
		await actions.delete({
			params: { type: 'session', id: '42' },
			cookies: mockCookies
		} as any);

		expect(mockFetch).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				headers: expect.objectContaining({ Authorization: 'Bearer mock-token' })
			})
		);
	});

	it('redirects to session list with success on delete', async () => {
		mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
		await actions.delete({
			params: { type: 'session', id: '42' },
			cookies: mockCookies
		} as any);

		expect(redirect).toHaveBeenCalledWith(
			'/tests/test-session',
			expect.objectContaining({ type: 'success' }),
			mockCookies
		);
	});

	it('redirects to template list with success on template delete', async () => {
		mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
		await actions.delete({
			params: { type: 'template', id: '10' },
			cookies: mockCookies
		} as any);

		expect(redirect).toHaveBeenCalledWith(
			'/tests/test-template',
			expect.objectContaining({ type: 'success' }),
			mockCookies
		);
	});

	it('redirects with error when delete fails', async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			statusText: 'Not Found',
			json: async () => ({ detail: 'Test not found' })
		});
		await actions.delete({
			params: { type: 'session', id: '99' },
			cookies: mockCookies
		} as any);

		expect(redirect).toHaveBeenCalledWith(
			'/tests/test-session',
			expect.objectContaining({ type: 'error' }),
			mockCookies
		);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// clone action
// ─────────────────────────────────────────────────────────────────────────────

describe('Test Create/Update Page — clone action', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	describe('Permissions', () => {
		it('requires CREATE_TEST to clone a session test', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
			await actions.clone({
				params: { type: 'session', id: '42' },
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.CREATE_TEST
			);
		});

		it('requires CREATE_TEST_TEMPLATE to clone a template', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
			await actions.clone({
				params: { type: 'template', id: '10' },
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.CREATE_TEST_TEMPLATE
			);
		});
	});

	it('sends POST to /test/{id}/clone', async () => {
		mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
		await actions.clone({
			params: { type: 'session', id: '42' },
			cookies: mockCookies
		} as any);

		expect(mockFetch).toHaveBeenCalledWith(
			'http://localhost:8000/test/42/clone',
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('sends Bearer token in Authorization header', async () => {
		mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
		await actions.clone({
			params: { type: 'session', id: '42' },
			cookies: mockCookies
		} as any);

		expect(mockFetch).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				headers: expect.objectContaining({ Authorization: 'Bearer mock-token' })
			})
		);
	});

	it('redirects to session list with success after clone', async () => {
		mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
		await actions.clone({
			params: { type: 'session', id: '42' },
			cookies: mockCookies
		} as any);

		expect(redirect).toHaveBeenCalledWith(
			'/tests/test-session',
			expect.objectContaining({ type: 'success' }),
			mockCookies
		);
	});

	it('redirects to template list with success after template clone', async () => {
		mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
		await actions.clone({
			params: { type: 'template', id: '10' },
			cookies: mockCookies
		} as any);

		expect(redirect).toHaveBeenCalledWith(
			'/tests/test-template',
			expect.objectContaining({ type: 'success' }),
			mockCookies
		);
	});

	it('redirects with error when clone fails', async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			statusText: 'Server Error',
			json: async () => ({ detail: 'Clone failed' })
		});
		await actions.clone({
			params: { type: 'session', id: '42' },
			cookies: mockCookies
		} as any);

		expect(redirect).toHaveBeenCalledWith(
			expect.any(Number),
			expect.stringContaining('/tests/test-session'),
			expect.objectContaining({ type: 'error' }),
			mockCookies
		);
	});
});
