import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie } from '$lib/server/auth.js';
import { PERMISSIONS, requireAnyPermission } from '$lib/utils/permissions.js';
import { error, fail } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import {
	fillMissingNomenclatureKeys,
	organizationSettingsSchema,
	trimSeconds,
	withSeconds,
	type OrganizationSettings
} from './schema.js';

function normalizeSettingsFromBackend(raw: OrganizationSettings): OrganizationSettings {
	return {
		...raw,
		test_timings: {
			...raw.test_timings,
			value: {
				...raw.test_timings.value,
				start_time: trimSeconds(raw.test_timings.value.start_time),
				end_time: trimSeconds(raw.test_timings.value.end_time)
			}
		},
		platform_nomenclature: {
			mode: raw.platform_nomenclature?.mode ?? 'default',
			value: fillMissingNomenclatureKeys(raw.platform_nomenclature?.value)
		},
		platform_guide: {
			value: { file_path: raw.platform_guide?.value?.file_path ?? null }
		},
		analytics_link: {
			value: { url: raw.analytics_link?.value?.url ?? null }
		}
	};
}

function normalizeSettingsForBackend(input: OrganizationSettings): OrganizationSettings {
	return {
		...input,
		test_timings: {
			...input.test_timings,
			value: {
				...input.test_timings.value,
				start_time: withSeconds(input.test_timings.value.start_time),
				end_time: withSeconds(input.test_timings.value.end_time)
			}
		}
	};
}

export const load: PageServerLoad = async ({ fetch, locals }) => {
	requireAnyPermission(locals.user, [
		PERMISSIONS.UPDATE_ORGANIZATION_SETTINGS,
		PERMISSIONS.UPDATE_MY_ORGANIZATION_SETTINGS
	]);

	const token = getSessionTokenCookie();
	const orgId = locals.user.organization_id;

	const res = await fetch(`${BACKEND_URL}/organization/${orgId}/settings`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	});

	if (!res.ok) {
		throw error(res.status, 'Failed to load organization settings');
	}

	const body = await res.json();
	const settings = normalizeSettingsFromBackend(body.settings as OrganizationSettings);

	return {
		form: await superValidate(settings, zod4(organizationSettingsSchema)),
		organizationId: orgId
	};
};

export const actions: Actions = {
	save: async ({ request, fetch, cookies, locals }) => {
		requireAnyPermission(locals.user, [
			PERMISSIONS.UPDATE_ORGANIZATION_SETTINGS,
			PERMISSIONS.UPDATE_MY_ORGANIZATION_SETTINGS
		]);

		const token = getSessionTokenCookie();
		const orgId = locals.user.organization_id;

		const form = await superValidate(request, zod4(organizationSettingsSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const payload = normalizeSettingsForBackend(form.data);

		const res = await fetch(`${BACKEND_URL}/organization/${orgId}/settings`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ settings: payload })
		});

		if (!res.ok) {
			return fail(res.status, { form });
		}

		throw redirect(
			303,
			`/organization/settings`,
			{ type: 'success', message: 'Organisation settings updated.' },
			cookies
		);
	}
};
