import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { BACKEND_URL } from '$env/static/private';

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token')
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

function makeHeaders(init: Record<string, string> = {}): Headers {
	return new Headers(init);
}

describe('GET /api/questions/bulk-template', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	it('calls the correct backend URL with Bearer auth', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			body: 'csv-body',
			headers: makeHeaders({ 'Content-Type': 'text/csv' })
		});

		await GET();

		expect(mockFetch).toHaveBeenCalledWith(
			`${BACKEND_URL}/questions/bulk-upload/template`,
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: 'Bearer mock-token'
				})
			})
		);
	});

	it('forwards Content-Type from backend', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			body: 'csv-body',
			headers: makeHeaders({ 'Content-Type': 'text/csv' })
		});

		const response = await GET();

		expect(response.headers.get('Content-Type')).toBe('text/csv');
	});

	it('uses fallback Content-Disposition when backend omits it', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			body: 'csv-body',
			headers: makeHeaders({ 'Content-Type': 'text/csv' })
		});

		const response = await GET();

		expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="template.csv"');
	});

	it('preserves Content-Disposition from backend when present', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			body: 'csv-body',
			headers: makeHeaders({
				'Content-Type': 'text/csv',
				'Content-Disposition': 'attachment; filename="questions-template.csv"'
			})
		});

		const response = await GET();

		expect(response.headers.get('Content-Disposition')).toBe(
			'attachment; filename="questions-template.csv"'
		);
	});

	it('returns 500 when backend responds non-ok', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 503,
			headers: makeHeaders()
		});

		const response = await GET();

		expect(response.status).toBe(500);
		expect(await response.text()).toBe('Failed to fetch template');
	});

	it('returns 500 when fetch throws a network error', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const response = await GET();

		expect(response.status).toBe(500);
		expect(await response.text()).toBe('Failed to fetch template');
	});
});
