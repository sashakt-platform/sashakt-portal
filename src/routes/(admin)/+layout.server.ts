import { getRequestEvent } from '$app/server';
import { defaultNomenclatureSetting } from '$lib/nomenclature';
import { loadPlatformNomenclature } from '$lib/server/nomenclature';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ fetch }) => {
	const { locals } = getRequestEvent();

	const platformNomenclature = locals.user?.organization_id
		? await loadPlatformNomenclature(locals.user.organization_id, fetch)
		: defaultNomenclatureSetting();

	return {
		user: locals.user,
		organization: locals.organization,
		platformNomenclature
	};
};
