import { getRequestEvent } from '$app/server';
import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth';
import { defaultNomenclatureSetting, type PlatformNomenclatureSetting } from '$lib/nomenclature';
import type { LayoutServerLoad } from './$types';

async function loadPlatformNomenclature(
	fetch: typeof globalThis.fetch,
	orgId: number
): Promise<PlatformNomenclatureSetting> {
	try {
		const token = getSessionTokenCookie();
		const res = await fetch(`${BACKEND_URL}/organization/${orgId}/settings`, {
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

export const load: LayoutServerLoad = async ({ fetch }) => {
	const { locals } = getRequestEvent();

	const platformNomenclature = locals.user?.organization_id
		? await loadPlatformNomenclature(fetch, locals.user.organization_id)
		: defaultNomenclatureSetting();

	return {
		user: locals.user,
		organization: locals.organization,
		platformNomenclature
	};
};
