import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend.com'
}));

vi.mock('./schema.js', () => ({
	questionSchema: {}
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4: vi.fn((schema) => schema)
}));

const superValidateMock = vi.fn();
vi.mock('sveltekit-superforms', () => ({
	superValidate: (...args: any[]) => superValidateMock(...args)
}));

vi.mock('$lib/server/auth.js', () => ({
	requireLogin: vi.fn(() => ({ id: 1, permissions: ['create_question', 'update_question', 'delete_question'] })),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		CREATE_QUESTION: 'create_question',
		READ_QUESTION: 'read_question',
		UPDATE_QUESTION: 'update_question',
		DELETE_QUESTION: 'delete_question'
	}
}));

const setFlashMock = vi.fn();
const redirectMock = vi.fn();
vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: (...args: any[]) => setFlashMock(...args),
	redirect: (...args: any[]) => {
		redirectMock(...args);
		const err: any = new Error('Redirect');
		err.location = args[0];
		throw err;
	}
}));

vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status: number, data?: any) => ({ type: 'failure', status, data }))
}));

const mockCookies = {
	get: vi.fn(),
	set: vi.fn(),
	delete: vi.fn(),
	getAll: vi.fn(),
	serialize: vi.fn()
};

const validFormData = {
	question_text: 'What is 2+2?',
	question_type: 'single-choice',
	options: [],
	correct_answer: [],
	is_mandatory: false,
	marking_scheme: { correct: 1, incorrect: 0, skipped: 0 },
	organization_id: 1,
	state_ids: [{ id: 'state1', name: 'Maharashtra' }],
	tag_ids: [{ id: 'tag1', name: 'Math' }],
	tag_type_ids: [{ id: 'type1', name: 'Subject' }],
	is_active: true
};

describe('Single Question Route', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
		superValidateMock.mockResolvedValue({ valid: false, data: {} });
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('load()', () => {
		describe('permission checks', () => {
			it('requires CREATE_QUESTION for add action', async () => {
				mockFetch.mockResolvedValue({
					ok: true,
					json: async () => ({ items: [] })
				});

				await load({ params: { action: 'add', id: 'new' } } as any);

				expect(requirePermission).toHaveBeenCalledWith(
					expect.objectContaining({ id: 1 }),
					PERMISSIONS.CREATE_QUESTION
				);
			});

			it('requires UPDATE_QUESTION for edit action', async () => {
				mockFetch
					.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1' }) })
					.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
					.mockResolvedValueOnce({ ok: true, json: async () => [] });

				await load({ params: { action: 'edit', id: '1' } } as any);

				expect(requirePermission).toHaveBeenCalledWith(
					expect.objectContaining({ id: 1 }),
					PERMISSIONS.UPDATE_QUESTION
				);
			});

			it('requires DELETE_QUESTION for delete action', async () => {
				mockFetch
					.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1' }) })
					.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
					.mockResolvedValueOnce({ ok: true, json: async () => [] });

				await load({ params: { action: 'delete', id: '1' } } as any);

				expect(requirePermission).toHaveBeenCalledWith(
					expect.objectContaining({ id: 1 }),
					PERMISSIONS.DELETE_QUESTION
				);
			});
		});

		describe('question data fetch', () => {
			it('skips question fetch when id is "new"', async () => {
				mockFetch.mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });

				await load({ params: { action: 'add', id: 'new' } } as any);

				const urls: string[] = mockFetch.mock.calls.map((c) => c[0]);
				expect(urls.every((u) => !u.includes('/questions/'))).toBe(true);
			});

			it('fetches question data when id is a real id', async () => {
				mockFetch
					.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '42', question_text: 'Q1' }) })
					.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
					.mockResolvedValueOnce({ ok: true, json: async () => [] });

				const result = await load({ params: { action: 'edit', id: '42' } } as any);

				expect(mockFetch).toHaveBeenCalledWith(
					'http://fake-backend.com/questions/42/',
					expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ Authorization: 'Bearer fake-token' }) })
				);
				expect(result.questionData).toEqual({ id: '42', question_text: 'Q1' });
			});

			it('returns questionData null when question fetch fails', async () => {
				mockFetch
					.mockResolvedValueOnce({ ok: false, statusText: 'Not Found' })
					.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
					.mockResolvedValueOnce({ ok: true, json: async () => [] });

				const result = await load({ params: { action: 'edit', id: '99' } } as any);

				expect(result.questionData).toBeNull();
			});

			it('returns questionData null when question fetch throws', async () => {
				mockFetch
					.mockRejectedValueOnce(new Error('Network error'))
					.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
					.mockResolvedValueOnce({ ok: true, json: async () => [] });

				const result = await load({ params: { action: 'edit', id: '1' } } as any);

				expect(result.questionData).toBeNull();
			});
		});

		describe('tag types fetch', () => {
			it('always fetches tag types at page=1&size=100', async () => {
				mockFetch.mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });

				await load({ params: { action: 'add', id: 'new' } } as any);

				const urls: string[] = mockFetch.mock.calls.map((c) => c[0]);
				expect(urls.some((u) => u.includes('/tagtype/') && u.includes('page=1') && u.includes('size=100'))).toBe(true);
			});

			it('returns tagTypes from items array', async () => {
				const mockItems = [{ id: '1', name: 'Subject' }];
				mockFetch.mockResolvedValue({ ok: true, json: async () => ({ items: mockItems }) });

				const result = await load({ params: { action: 'add', id: 'new' } } as any);

				expect(result.tagTypes).toEqual(mockItems);
			});

			it('returns empty tagTypes array when tag types fetch fails', async () => {
				mockFetch.mockResolvedValue({ ok: false, statusText: 'Server Error' });

				const result = await load({ params: { action: 'add', id: 'new' } } as any);

				expect(result.tagTypes).toEqual([]);
			});

			it('returns empty tagTypes array when tag types fetch throws', async () => {
				mockFetch.mockRejectedValue(new Error('Network error'));

				const result = await load({ params: { action: 'add', id: 'new' } } as any);

				expect(result.tagTypes).toEqual([]);
			});

			it('returns empty tagTypes when API returns no items field', async () => {
				mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

				const result = await load({ params: { action: 'add', id: 'new' } } as any);

				expect(result.tagTypes).toEqual([]);
			});
		});

		describe('revisions fetch', () => {
			it('skips revisions fetch when id is "new"', async () => {
				mockFetch.mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });

				await load({ params: { action: 'add', id: 'new' } } as any);

				const urls: string[] = mockFetch.mock.calls.map((c) => c[0]);
				expect(urls.every((u) => !u.includes('/revisions/'))).toBe(true);
			});

			it('fetches revisions when id is a real id', async () => {
				const mockRevisions = [{ id: 'r1', created_date: '2024-01-01' }];
				mockFetch
					.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '5' }) })
					.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
					.mockResolvedValueOnce({ ok: true, json: async () => mockRevisions });

				const result = await load({ params: { action: 'edit', id: '5' } } as any);

				expect(mockFetch).toHaveBeenCalledWith(
					'http://fake-backend.com/questions/5/revisions/',
					expect.objectContaining({ method: 'GET' })
				);
				expect(result.questionRevisions).toEqual(mockRevisions);
			});

			it('returns questionRevisions null when revisions fetch fails', async () => {
				mockFetch
					.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '5' }) })
					.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
					.mockResolvedValueOnce({ ok: false, statusText: 'Not Found' });

				const result = await load({ params: { action: 'edit', id: '5' } } as any);

				expect(result.questionRevisions).toBeNull();
			});

			it('returns questionRevisions null when revisions fetch throws', async () => {
				mockFetch
					.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '5' }) })
					.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
					.mockRejectedValueOnce(new Error('Network error'));

				const result = await load({ params: { action: 'edit', id: '5' } } as any);

				expect(result.questionRevisions).toBeNull();
			});
		});

		describe('return shape', () => {
			it('returns form, questionData, tagTypes, questionRevisions', async () => {
				const mockForm = { valid: false, data: {} };
				superValidateMock.mockResolvedValue(mockForm);
				mockFetch.mockResolvedValue({ ok: true, json: async () => ({ items: [] }) });

				const result = await load({ params: { action: 'add', id: 'new' } } as any);

				expect(result).toHaveProperty('form');
				expect(result).toHaveProperty('questionData');
				expect(result).toHaveProperty('tagTypes');
				expect(result).toHaveProperty('questionRevisions');
			});

			it('uses Bearer token in all fetch calls', async () => {
				mockFetch
					.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '7' }) })
					.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })
					.mockResolvedValueOnce({ ok: true, json: async () => [] });

				await load({ params: { action: 'edit', id: '7' } } as any);

				for (const call of mockFetch.mock.calls) {
					expect(call[1].headers).toMatchObject({ Authorization: 'Bearer fake-token' });
				}
			});
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('actions.save — create (id = "new")', () => {
		beforeEach(() => {
			superValidateMock.mockResolvedValue({ valid: true, data: validFormData });
		});

		it('requires CREATE_QUESTION permission for add action', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ id: 'new-q-1' })
			});

			await actions.save({
				request: new Request('http://localhost', { method: 'POST' }),
				params: { action: 'add', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.CREATE_QUESTION
			);
		});

		it('returns fail(400) and sets error flash when form is invalid', async () => {
			superValidateMock.mockResolvedValue({ valid: false, data: {} });

			const result = await actions.save({
				request: new Request('http://localhost', { method: 'POST' }),
				params: { action: 'add', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(result).toMatchObject({ status: 400 });
			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error' }),
				mockCookies
			);
		});

		it('sends POST to /questions/ with transformed data', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ id: 'new-q-1' })
			});

			await actions.save({
				request: new Request('http://localhost', { method: 'POST' }),
				params: { action: 'add', id: 'new' },
				cookies: mockCookies
			} as any);

			const [url, options] = mockFetch.mock.calls[0];
			expect(url).toBe('http://fake-backend.com/questions/');
			expect(options.method).toBe('POST');
			expect(options.headers).toMatchObject({ Authorization: 'Bearer fake-token', 'Content-Type': 'application/json' });
		});

		it('transforms state_ids to array of ids before sending', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'q1' }) });

			await actions.save({
				request: new Request('http://localhost', { method: 'POST' }),
				params: { action: 'add', id: 'new' },
				cookies: mockCookies
			} as any);

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.state_ids).toEqual(['state1']);
		});

		it('transforms tag_ids to array of ids before sending', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'q1' }) });

			await actions.save({
				request: new Request('http://localhost', { method: 'POST' }),
				params: { action: 'add', id: 'new' },
				cookies: mockCookies
			} as any);

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body.tag_ids).toEqual(['tag1']);
		});

		it('does not send tag_type_ids to the backend', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'q1' }) });

			await actions.save({
				request: new Request('http://localhost', { method: 'POST' }),
				params: { action: 'add', id: 'new' },
				cookies: mockCookies
			} as any);

			const body = JSON.parse(mockFetch.mock.calls[0][1].body);
			expect(body).not.toHaveProperty('tag_type_ids');
		});

		it('returns newQuestionId and newQuestionData on success', async () => {
			const newQuestion = { id: 'new-q-1', question_text: 'What is 2+2?' };
			mockFetch.mockResolvedValue({ ok: true, json: async () => newQuestion });

			const result = await actions.save({
				request: new Request('http://localhost', { method: 'POST' }),
				params: { action: 'add', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(result).toMatchObject({ newQuestionId: 'new-q-1', newQuestionData: newQuestion });
		});

		it('returns fail(response.status) and sets error flash when POST fails', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 422,
				statusText: 'Unprocessable Entity',
				json: async () => ({ detail: 'Invalid data' })
			});

			const result = await actions.save({
				request: new Request('http://localhost', { method: 'POST' }),
				params: { action: 'add', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(result).toMatchObject({ status: 422 });
			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error', message: 'Invalid data' }),
				mockCookies
			);
		});

		it('uses statusText in error flash when POST failure has no detail', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
				json: async () => ({})
			});

			await actions.save({
				request: new Request('http://localhost', { method: 'POST' }),
				params: { action: 'add', id: 'new' },
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ message: 'Question not Created. Please check all the details.' }),
				mockCookies
			);
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('actions.save — update (id !== "new")', () => {
		beforeEach(() => {
			superValidateMock.mockResolvedValue({ valid: true, data: validFormData });
		});

		it('requires UPDATE_QUESTION permission for edit action', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '10', options: [] }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			try {
				await actions.save({
					request: new Request('http://localhost', { method: 'POST' }),
					params: { action: 'edit', id: '10' },
					cookies: mockCookies
				} as any);
			} catch {}

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.UPDATE_QUESTION
			);
		});

		it('fetches existing question to preserve media before saving revision', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '10', options: [] }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			try {
				await actions.save({
					request: new Request('http://localhost', { method: 'POST' }),
					params: { action: 'edit', id: '10' },
					cookies: mockCookies
				} as any);
			} catch {}

			const firstCall = mockFetch.mock.calls[0];
			expect(firstCall[0]).toBe('http://fake-backend.com/questions/10/');
			expect(firstCall[1].method).toBe('GET');
		});

		it('sends POST to /questions/{id}/revisions', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '10', options: [] }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			try {
				await actions.save({
					request: new Request('http://localhost', { method: 'POST' }),
					params: { action: 'edit', id: '10' },
					cookies: mockCookies
				} as any);
			} catch {}

			const revisionsCall = mockFetch.mock.calls[1];
			expect(revisionsCall[0]).toBe('http://fake-backend.com/questions/10/revisions');
			expect(revisionsCall[1].method).toBe('POST');
		});

		it('sends PUT to /questions/{id}/tags with array of tag ids', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '10', options: [] }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			try {
				await actions.save({
					request: new Request('http://localhost', { method: 'POST' }),
					params: { action: 'edit', id: '10' },
					cookies: mockCookies
				} as any);
			} catch {}

			const tagsCall = mockFetch.mock.calls[2];
			expect(tagsCall[0]).toBe('http://fake-backend.com/questions/10/tags');
			expect(tagsCall[1].method).toBe('PUT');
			const tagsBody = JSON.parse(tagsCall[1].body);
			expect(tagsBody).toEqual({ tag_ids: ['tag1'] });
		});

		it('sends PUT to /questions/{id}/locations with state_id objects', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '10', options: [] }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			try {
				await actions.save({
					request: new Request('http://localhost', { method: 'POST' }),
					params: { action: 'edit', id: '10' },
					cookies: mockCookies
				} as any);
			} catch {}

			const locCall = mockFetch.mock.calls[3];
			expect(locCall[0]).toBe('http://fake-backend.com/questions/10/locations');
			expect(locCall[1].method).toBe('PUT');
			const locBody = JSON.parse(locCall[1].body);
			expect(locBody).toEqual({ locations: [{ state_id: 'state1' }] });
		});

		it('redirects to /questionbank with success flash after all steps succeed', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '10', options: [] }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			try {
				await actions.save({
					request: new Request('http://localhost', { method: 'POST' }),
					params: { action: 'edit', id: '10' },
					cookies: mockCookies
				} as any);
			} catch (err: any) {
				expect(err.location).toBe('/questionbank');
			}

			expect(redirectMock).toHaveBeenCalledWith(
				'/questionbank',
				expect.objectContaining({ type: 'success', message: 'Question saved successfully' }),
				mockCookies
			);
		});

		it('returns fail(500) and sets error flash when revision POST fails', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '10', options: [] }) })
				.mockResolvedValueOnce({
					ok: false,
					statusText: 'Server Error',
					json: async () => ({ detail: 'Revision failed' })
				});

			const result = await actions.save({
				request: new Request('http://localhost', { method: 'POST' }),
				params: { action: 'edit', id: '10' },
				cookies: mockCookies
			} as any);

			expect(result).toMatchObject({ status: 500 });
			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error', message: expect.stringContaining('Failed to update question') }),
				mockCookies
			);
		});

		it('returns fail(500) and sets error flash when tag PUT fails', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '10', options: [] }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({
					ok: false,
					statusText: 'Bad Request',
					json: async () => ({ detail: 'Tag error' })
				});

			const result = await actions.save({
				request: new Request('http://localhost', { method: 'POST' }),
				params: { action: 'edit', id: '10' },
				cookies: mockCookies
			} as any);

			expect(result).toMatchObject({ status: 500 });
			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error', message: expect.stringContaining('Failed to update tags') }),
				mockCookies
			);
		});

		it('returns fail(500) and sets error flash when location PUT fails', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: true, json: async () => ({ id: '10', options: [] }) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({
					ok: false,
					statusText: 'Bad Request',
					json: async () => ({ detail: 'Location error' })
				});

			const result = await actions.save({
				request: new Request('http://localhost', { method: 'POST' }),
				params: { action: 'edit', id: '10' },
				cookies: mockCookies
			} as any);

			expect(result).toMatchObject({ status: 500 });
			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error', message: expect.stringContaining('Failed to update states') }),
				mockCookies
			);
		});

		it('continues saving even if fetching existing question throws', async () => {
			mockFetch
				.mockRejectedValueOnce(new Error('Network error'))
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
				.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

			try {
				await actions.save({
					request: new Request('http://localhost', { method: 'POST' }),
					params: { action: 'edit', id: '10' },
					cookies: mockCookies
				} as any);
			} catch (err: any) {
				expect(err.location).toBe('/questionbank');
			}

			expect(redirectMock).toHaveBeenCalledWith(
				'/questionbank',
				expect.objectContaining({ type: 'success' }),
				mockCookies
			);
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('actions.delete', () => {
		it('requires DELETE_QUESTION permission', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			try {
				await actions.delete({
					params: { id: '5' },
					cookies: mockCookies
				} as any);
			} catch {}

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.DELETE_QUESTION
			);
		});

		it('sends DELETE to /questions/{id}', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			try {
				await actions.delete({
					params: { id: '5' },
					cookies: mockCookies
				} as any);
			} catch {}

			expect(mockFetch).toHaveBeenCalledWith(
				'http://fake-backend.com/questions/5',
				expect.objectContaining({
					method: 'DELETE',
					headers: expect.objectContaining({ Authorization: 'Bearer fake-token' })
				})
			);
		});

		it('redirects to /questionbank with success flash on successful delete', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			try {
				await actions.delete({
					params: { id: '5' },
					cookies: mockCookies
				} as any);
			} catch (err: any) {
				expect(err.location).toBe('/questionbank');
			}

			expect(redirectMock).toHaveBeenCalledWith(
				'/questionbank',
				expect.objectContaining({ type: 'success', message: 'Question deleted successfully' }),
				mockCookies
			);
		});

		it('redirects to /questionbank with error flash when delete API fails', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				statusText: 'Not Found',
				json: async () => ({ detail: 'Question not found' })
			});

			try {
				await actions.delete({
					params: { id: '99' },
					cookies: mockCookies
				} as any);
			} catch (err: any) {
				expect(err.location).toBe('/questionbank');
			}

			expect(redirectMock).toHaveBeenCalledWith(
				'/questionbank',
				expect.objectContaining({ type: 'error', message: 'Question not found' }),
				mockCookies
			);
		});

		it('uses statusText in error flash when delete failure has no detail', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				statusText: 'Internal Server Error',
				json: async () => ({})
			});

			try {
				await actions.delete({
					params: { id: '99' },
					cookies: mockCookies
				} as any);
			} catch {}

			expect(redirectMock).toHaveBeenCalledWith(
				'/questionbank',
				expect.objectContaining({ type: 'error', message: 'Internal Server Error' }),
				mockCookies
			);
		});
	});
});
