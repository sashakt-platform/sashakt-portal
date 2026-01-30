import { describe, it, expect } from 'vitest';
import { load } from './+page.server';

function getRedirectLocation(e: unknown) {
	// SvelteKit redirect throws an object with `status` and `location`
	// We keep it loose to avoid depending on internal types
	const err = e as any;
	return { status: err?.status, location: err?.location };
}

describe('/[organization] +page.server.ts', () => {
	it('redirects to /login with organization query param', async () => {
		try {
			await load({ params: { organization: 'acme' } } as any);
			expect.fail('Expected load to throw a redirect');
		} catch (e) {
			const { status, location } = getRedirectLocation(e);
			expect(status).toBe(307);
			expect(location).toBe('/login?organization=acme');
		}
	});
});
