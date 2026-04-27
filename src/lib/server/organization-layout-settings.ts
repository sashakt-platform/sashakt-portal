import { BACKEND_URL } from '$env/static/private';
import { defaultNomenclatureSetting, type PlatformNomenclatureSetting } from '$lib/nomenclature';
import { getSessionTokenCookie } from './auth';

export interface OrganizationLayoutSettings {
	platformNomenclature: PlatformNomenclatureSetting;
	platformGuideUrl: string | null;
	analyticsLinkUrl: string | null;
}

/**
 * Fetches the organisation settings needed by the admin layout (sidebar + nomenclature)
 * in a single request. Defensive: falls back to built-in defaults on any error so that
 * a broken settings call never blocks layout rendering.
 */
export async function loadOrganizationLayoutSettings(
	orgId: number,
	fetchFn: typeof globalThis.fetch = globalThis.fetch
): Promise<OrganizationLayoutSettings> {
	const fallback: OrganizationLayoutSettings = {
		platformNomenclature: defaultNomenclatureSetting(),
		platformGuideUrl: null,
		analyticsLinkUrl: null
	};
	try {
		const token = getSessionTokenCookie();
		const res = await fetchFn(`${BACKEND_URL}/organization/${orgId}/settings`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});
		if (!res.ok) return fallback;

		const body = await res.json();
		const settings = body?.settings;
		if (!settings) return fallback;

		const nom = settings.platform_nomenclature;
		const platformNomenclature: PlatformNomenclatureSetting =
			nom && typeof nom === 'object'
				? {
						mode: nom.mode === 'custom' ? 'custom' : 'default',
						value: { ...defaultNomenclatureSetting().value, ...(nom.value ?? {}) }
					}
				: defaultNomenclatureSetting();

		return {
			platformNomenclature,
			platformGuideUrl: settings?.platform_guide?.value?.file_path ?? null,
			analyticsLinkUrl: settings?.analytics_link?.value?.url ?? null
		};
	} catch {
		return fallback;
	}
}
