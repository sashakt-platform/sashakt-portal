import { BACKEND_URL } from '$env/static/private';
import {
	defaultNomenclatureSetting,
	resolveTerm,
	type NomenclatureKey,
	type PlatformNomenclatureSetting,
	type TermCase
} from '$lib/nomenclature';
import { getSessionTokenCookie } from './auth';

/**
 * Fetch `platform_nomenclature` for the given organisation directly from the
 * backend. Defensive: falls back to built-in defaults on any error so server
 * actions never fail because of a broken settings call.
 *
 * `fetchFn` defaults to `globalThis.fetch`; pass `event.fetch` from inside a
 * SvelteKit handler when you want SvelteKit's wrapped fetch (forwarded cookies,
 * SSR hooks). Defaulting to global fetch means existing server-action tests
 * that mock `global.fetch` keep working without needing to thread a fetch into
 * the event mock.
 */
export async function loadPlatformNomenclature(
	orgId: number,
	fetchFn: typeof globalThis.fetch = globalThis.fetch
): Promise<PlatformNomenclatureSetting> {
	try {
		const token = getSessionTokenCookie();
		const res = await fetchFn(`${BACKEND_URL}/organization/${orgId}/settings`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});
		if (!res.ok) return defaultNomenclatureSetting();

		const body = await res.json();
		const nom = body?.settings?.platform_nomenclature;
		if (!nom || typeof nom !== 'object') return defaultNomenclatureSetting();

		return {
			mode: nom.mode === 'custom' ? 'custom' : 'default',
			value: { ...defaultNomenclatureSetting().value, ...(nom.value ?? {}) }
		};
	} catch {
		return defaultNomenclatureSetting();
	}
}

/**
 * Returns a `(key, casing?) => string` resolver for use inside server actions.
 * Mirrors the client-side `useTerms` pattern (including the optional casing
 * modifier) but skips the Svelte context.
 */
export async function serverTerms(
	orgId: number,
	fetchFn: typeof globalThis.fetch = globalThis.fetch
): Promise<(key: NomenclatureKey, casing?: TermCase) => string> {
	const nomenclature = await loadPlatformNomenclature(orgId, fetchFn);
	return (key, casing = 'title') => resolveTerm(nomenclature, key, casing);
}
