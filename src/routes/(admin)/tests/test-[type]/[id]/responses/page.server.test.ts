import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend.com'
}));

vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

vi.mock('$lib/server/auth', () => ({
	requireLogin: vi.fn(() => ({ id: 1, permissions: ['read_test', 'delete_candidate'] })),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		READ_TEST: 'read_test',
		DELETE_CANDIDATE: 'delete_candidate'
	}
}));

const setFlashMock = vi.fn();
vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: (...args: unknown[]) => setFlashMock(...args),
	redirect: vi.fn((status: number, path: string, message: unknown, cookies: unknown) => {
		const error: any = new Error('Redirect');
		error.status = status;
		error.location = path;
		error.message = message;
		error.cookies = cookies;
		throw error;
	})
}));

vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status: number) => ({ type: 'failure', status }))
}));

const mockCookies = {} as any;

function mockRequest(data: Record<string, string>) {
	const fd = new FormData();
	for (const [key, value] of Object.entries(data)) {
		fd.append(key, value);
	}
	return { formData: async () => fd } as unknown as Request;
}

describe('Candidate Responses Route', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	describe('load()', () => {
		it('checks user is logged in and has READ_TEST permission', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({ name: 'Algebra Test' }) });

			await load({
				params: { id: '1' },
				url: new URL('http://test.com/tests/test-session/1/responses')
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.READ_TEST
			);
		});

		it('returns testName and responses with default pagination', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'Algebra Test' }) })
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [{ candidate_id: 1 }], total: 1, pages: 1 })
				});

			const result = await load({
				params: { id: '1' },
				url: new URL('http://test.com/tests/test-session/1/responses')
			} as any);

			expect(result.testId).toBe('1');
			expect(result.testName).toBe('Algebra Test');
			expect(result.responses).toEqual({ items: [{ candidate_id: 1 }], total: 1, pages: 1 });
			expect(result.totalPages).toBe(1);
			expect(result.params).toEqual({ page: 1, size: 25 });
		});

		it('passes custom page/size params to the candidate-report API', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ items: [], total: 0, pages: 0 })
			});

			const result = await load({
				params: { id: '1' },
				url: new URL('http://test.com/tests/test-session/1/responses?page=3&size=10')
			} as any);

			const reportCallUrl = mockFetch.mock.calls[1][0];
			expect(reportCallUrl).toContain('page=3');
			expect(reportCallUrl).toContain('size=10');
			expect(result.params).toEqual({ page: 3, size: 10 });
		});

		it('uses Bearer token when fetching the test and the candidate report', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ items: [], total: 0, pages: 0 })
			});

			await load({
				params: { id: '1' },
				url: new URL('http://test.com/tests/test-session/1/responses')
			} as any);

			expect(mockFetch).toHaveBeenNthCalledWith(
				1,
				'http://fake-backend.com/test/1',
				expect.objectContaining({ headers: { Authorization: 'Bearer fake-token' } })
			);
			expect(mockFetch).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('http://fake-backend.com/test/1/candidate-report'),
				expect.objectContaining({ headers: { Authorization: 'Bearer fake-token' } })
			);
		});

		it('falls back to "Test" as the testName when the test API fails', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: false, json: async () => ({}) })
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [], total: 0, pages: 0 })
				});

			const result = await load({
				params: { id: '1' },
				url: new URL('http://test.com/tests/test-session/1/responses')
			} as any);

			expect(result.testName).toBe('Test');
		});

		it('falls back to empty responses when the candidate-report API fails', async () => {
			mockFetch
				.mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'Algebra Test' }) })
				.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

			const result = await load({
				params: { id: '1' },
				url: new URL('http://test.com/tests/test-session/1/responses')
			} as any);

			expect(result.responses).toEqual({ items: [], total: 0, pages: 0 });
			expect(result.totalPages).toBe(0);
		});
	});

	describe('actions.deleteCandidate', () => {
		it('checks user is logged in and has DELETE_CANDIDATE permission', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			try {
				await actions.deleteCandidate({
					url: new URL('http://test.com/?candidate_id=5'),
					cookies: mockCookies
				} as any);
			} catch {
				// expected redirect on success
			}

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.DELETE_CANDIDATE
			);
		});

		it('returns fail(400) and sets a flash error when candidate_id is missing', async () => {
			const result = await actions.deleteCandidate({
				url: new URL('http://test.com/'),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error', message: 'Candidate ID is required.' }),
				mockCookies
			);
			expect(result).toEqual(expect.objectContaining({ status: 400 }));
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it('sends a DELETE request to /candidate/{id} with the Bearer token', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			try {
				await actions.deleteCandidate({
					url: new URL('http://test.com/?candidate_id=5'),
					cookies: mockCookies
				} as any);
			} catch {
				// expected redirect on success
			}

			expect(mockFetch).toHaveBeenCalledWith(
				'http://fake-backend.com/candidate/5',
				expect.objectContaining({
					method: 'DELETE',
					headers: expect.objectContaining({ Authorization: 'Bearer fake-token' })
				})
			);
		});

		it('redirects with a success message after a successful delete', async () => {
			mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

			try {
				await actions.deleteCandidate({
					url: new URL('http://test.com/tests/test-session/1/responses?candidate_id=5'),
					cookies: mockCookies
				} as any);
				expect.fail('Should have thrown redirect');
			} catch (error: any) {
				expect(error.status).toBe(303);
				expect(error.location).toBe('/tests/test-session/1/responses');
				expect(error.message).toEqual(expect.objectContaining({ type: 'success' }));
			}
		});

		it('sets an error flash and returns fail(status) when the API call fails', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 400,
				json: async () => ({ detail: 'Cannot delete candidate' })
			});

			const result = await actions.deleteCandidate({
				url: new URL('http://test.com/?candidate_id=5'),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error', message: 'Cannot delete candidate' }),
				mockCookies
			);
			expect(result).toEqual(expect.objectContaining({ status: 400 }));
		});
	});

	describe('actions.batchDeleteCandidates', () => {
		it('checks user is logged in and has DELETE_CANDIDATE permission', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ delete_success_count: 1, delete_failure_list: null })
			});

			await actions.batchDeleteCandidates({
				request: mockRequest({ candidateIds: JSON.stringify(['1']) }),
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.DELETE_CANDIDATE
			);
		});

		it('sends a DELETE request to /candidate/ with candidateIds as the body', async () => {
			const candidateIds = JSON.stringify(['1', '2']);
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ delete_success_count: 2, delete_failure_list: null })
			});

			await actions.batchDeleteCandidates({
				request: mockRequest({ candidateIds }),
				cookies: mockCookies
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				'http://fake-backend.com/candidate/',
				expect.objectContaining({
					method: 'DELETE',
					headers: expect.objectContaining({ Authorization: 'Bearer fake-token' }),
					body: candidateIds
				})
			);
		});

		it('sets a success flash and returns {success:true} when all deletions succeed', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ delete_success_count: 2, delete_failure_list: null })
			});

			const result = await actions.batchDeleteCandidates({
				request: mockRequest({ candidateIds: JSON.stringify(['1', '2']) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'success' }),
				mockCookies
			);
			expect(result).toEqual({ success: true });
		});

		it('sets an error flash when some deletions in the batch fail', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ delete_success_count: 1, delete_failure_list: [{ id: '2' }] })
			});

			await actions.batchDeleteCandidates({
				request: mockRequest({ candidateIds: JSON.stringify(['1', '2']) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error' }),
				mockCookies
			);
		});

		it('sets an error flash and returns fail(status) when the API returns non-OK', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 400,
				statusText: 'Bad Request',
				json: async () => ({ detail: 'Invalid candidate IDs' })
			});

			const result = await actions.batchDeleteCandidates({
				request: mockRequest({ candidateIds: JSON.stringify(['99']) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					message: expect.stringContaining('Invalid candidate IDs')
				}),
				mockCookies
			);
			expect(result).toEqual(expect.objectContaining({ status: 400 }));
		});

		it('sets an error flash and returns fail(500) on a network exception', async () => {
			mockFetch.mockRejectedValue(new Error('Network failure'));

			const result = await actions.batchDeleteCandidates({
				request: mockRequest({ candidateIds: JSON.stringify(['1']) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error', message: 'Failed to delete candidates.' }),
				mockCookies
			);
			expect(result).toEqual(expect.objectContaining({ status: 500 }));
		});
	});
});
