import { load } from '../+page.server';
import { getSessionTokenCookie } from '$lib/server/auth';


const BACKEND_URL = 'http://localhost:8000/api/v1';
vi.stubEnv('BACKEND_URL', BACKEND_URL);
vi.mock('$lib/server/auth', () => ({
    getSessionTokenCookie: vi.fn()
}));

global.fetch = vi.fn();

describe('Dashboard load()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return stats when API succeeds', async () => {
        (getSessionTokenCookie).mockReturnValue('mock-token');
        (global.fetch).mockResolvedValue({
            ok: true,
            json: async () => ({
                total_questions: 10,
                total_users: 5,
                total_tests: 3
            })
        });

        const result = await load();
        expect(global.fetch).toHaveBeenCalledWith(
            `${BACKEND_URL}/organization/aggregated_data`,
            expect.objectContaining({
                method: 'GET',
                headers: { Authorization: 'Bearer mock-token' }
            })
        );
        expect(result).toMatchObject({
            stats: { total_questions: 10, total_users: 5, total_tests: 3 }
        });
    });

    it('should return default stats when API fails', async () => {
        (getSessionTokenCookie).mockReturnValue('mock-token');
        global.fetch = vi.fn().mockResolvedValue({
            ok: false
        });

        const result = await load();
        expect(result).toMatchObject({
            stats: { total_questions: 0, total_users: 0, total_tests: 0 }
        });
    });


});
