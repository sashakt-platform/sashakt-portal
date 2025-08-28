
import { load } from '../+page.server';
import { requireLogin } from '$lib/server/auth';


vi.mock('$lib/server/auth', () => ({
    requireLogin: vi.fn()
}));


describe('load function', () => {
    it('redirects to /dashboard if user exists', () => {
        (requireLogin as any).mockReturnValue({ id: 1, name: 'abc' });

        try {
            load();
        } catch (e) {
            const err = e as Error & { status: number; location: string };
            expect(err.status).toBe(307);
            expect(err.location).toBe('/dashboard');
        }
    });

    it('redirects to /login if no user', () => {
        (requireLogin as any).mockReturnValue(null);

        try {
            load();
        } catch (e) {
            const err = e as Error & { status: number; location: string };
            expect(err.status).toBe(307);
            expect(err.location).toBe('/login');
        }
    });
});
