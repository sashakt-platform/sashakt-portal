import { describe, it, expect, vi, beforeEach } from 'vitest';
import { actions } from './+page.server';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

vi.mock('$lib/server/auth.js', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token'),
	requireLogin: vi.fn(() => ({ id: 1, permissions: ['create_question'] }))
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: { CREATE_QUESTION: 'create_question' }
}));

vi.mock('sveltekit-superforms', async () => {
	const actual = await vi.importActual<typeof import('sveltekit-superforms')>('sveltekit-superforms');
	return {
		...actual,
		superValidate: vi.fn(async () => ({
			valid: true,
			data: { file: new File(['col1,col2'], 'test.csv', { type: 'text/csv' }), user_id: 1 }
		})),
		message: vi.fn((form, data) => ({ form, data })),
		fail: vi.fn((status, data) => ({ type: 'failure', status, data }))
	};
});

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4: vi.fn((schema) => schema)
}));

const setFlashMock = vi.fn();
vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: (...args: unknown[]) => setFlashMock(...args)
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const mockCookies = {
	get: vi.fn(),
	set: vi.fn(),
	delete: vi.fn(),
	getAll: vi.fn(),
	serialize: vi.fn()
};

function makeActionEvent() {
	return {
		request: new Request('http://localhost', { method: 'POST' }),
		cookies: mockCookies
	} as any;
}

describe('Import Questions — default action', () => {
	beforeEach(() => {
		mockFetch.mockReset();
		setFlashMock.mockReset();
	});

	it('sets error flash message when backend reports wrong or missing column', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Invalid or missing mandatory columns in the uploaded file.' })
		});

		await actions.default(makeActionEvent());

		expect(setFlashMock).toHaveBeenCalledWith(
			{ type: 'error', message: 'Invalid or missing mandatory columns in the uploaded file.' },
			mockCookies
		);
	});

	it('sets fallback flash message when backend error has no detail field', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({})
		});

		await actions.default(makeActionEvent());

		expect(setFlashMock).toHaveBeenCalledWith(
			{
				type: 'error',
				message: 'Unable to process file. Kindly check the format and try again.'
			},
			mockCookies
		);
	});

	it('does not set flash message on successful upload', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				uploaded_questions: 5,
				success_questions: 5,
				failed_questions: 0,
				message: 'Upload complete.'
			})
		});

		await actions.default(makeActionEvent());

		expect(setFlashMock).not.toHaveBeenCalled();
	});
});
