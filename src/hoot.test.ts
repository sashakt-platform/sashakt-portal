import { describe, it, beforeEach, expect, vi } from 'vitest';
import * as auth from '$lib/server/auth.js';

import { handle } from './hooks.server';

vi.mock('$lib/server/auth.js', () => ({
    sessionCookieName: 'session',
    refreshCookieName: 'refresh',
    validateSessionToken: vi.fn(),
    refreshAccessToken: vi.fn(),
    setSessionTokenCookie: vi.fn(),
    setRefreshTokenCookie: vi.fn(),
    deleteAllTokenCookies: vi.fn(),
}));

vi.mock('@sveltejs/kit', async () => {
    const actual = await vi.importActual<typeof import('@sveltejs/kit')>('@sveltejs/kit');
    return {
        ...actual,
        redirect: vi.fn((status: number, location: string) => ({ status, location }))
    };
});

describe('handleAuth + admin', () => {
    let resolve: ReturnType<typeof vi.fn>;
    let event: any;


    beforeEach(() => {
        event = {
            cookies: {
                get: vi.fn(),
            },
            locals: {},
            route: { id: '/home' },
        };
        resolve = vi.fn().mockResolvedValue('resolved');
        vi.clearAllMocks();
    });

    it('continues as guest if no tokens', async () => {
        event.cookies.get.mockReturnValue(null);

        const result = await handle({ event, resolve });

        expect(event.locals.user).toBeNull();
        expect(event.locals.session).toBeNull();
        expect(result).toBe('resolved');
    });

    it('sets user if session token is valid', async () => {
        event.cookies.get.mockImplementation((name: string) => (name === 'session' ? 'token123' : null));
        (auth.validateSessionToken as any).mockResolvedValue({ user: { id: 1, name: 'abc' } });

        const result = await handle({ event, resolve });

        expect(event.locals.user).toEqual({ id: 1, name: 'abc' });
        expect(event.locals.session).toBe('token123');
        expect(result).toBe('resolved');
    });


    it('redirects to /login if refresh fails', async () => {
        event.cookies.get.mockImplementation((name: string) =>
            name === 'refresh' ? 'refresh123' : null
        );
        (auth.validateSessionToken as any).mockResolvedValue({ user: null });
        (auth.refreshAccessToken as any).mockResolvedValue({ success: false });

        await expect(handle({ event, resolve })).rejects.toMatchObject({
            status: 302,
            location: '/login',
        });
        expect(auth.deleteAllTokenCookies).toHaveBeenCalled();
    });


    it('redirects admin routes if user not logged in', async () => {
        event.route.id = '/(admin)/dashboard';
        event.locals.user = null;

        await expect(handle({ event, resolve })).rejects.toMatchObject({
            status: 302,
            location: '/login',
        });
    });


});
