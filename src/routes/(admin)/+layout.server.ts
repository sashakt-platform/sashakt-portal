import { getRequestEvent } from '$app/server';
import { defaultNomenclatureSetting } from '$lib/nomenclature';
import { loadOrganizationLayoutSettings } from '$lib/server/organization-layout-settings';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ fetch }) => {
	const { locals } = getRequestEvent();

	const layoutSettings = locals.user?.organization_id
		? await loadOrganizationLayoutSettings(locals.user.organization_id, fetch)
		: {
				platformNomenclature: defaultNomenclatureSetting(),
				platformGuideUrl: null,
				analyticsLinkUrl: null
			};

	return {
		user: locals.user,
		organization: locals.organization,
		platformNomenclature: layoutSettings.platformNomenclature,
		platformGuideUrl: layoutSettings.platformGuideUrl,
		analyticsLinkUrl: layoutSettings.analyticsLinkUrl
	};
};
