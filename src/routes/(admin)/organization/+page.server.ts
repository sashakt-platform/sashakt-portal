import { BACKEND_URL } from '$env/static/private';
import {
	getSessionTokenCookie,
	organizationCookieName,
	setOrganizationCookie
} from '$lib/server/auth.js';
import { invalidateOrganizationCache } from '$lib/server/organization-cache.js';
import { fail } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import { editOrganizationSchema } from './schema.js';

async function fetchOrganizationSettings(
	fetchFn: typeof fetch,
	token: string | undefined,
	orgId: number | undefined
) {
	if (!orgId) return null;
	try {
		const res = await fetchFn(`${BACKEND_URL}/organization/${orgId}/settings`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

function deriveFilename(url: string | null): string | null {
	if (!url) return null;
	try {
		const pathname = new URL(url).pathname;
		const name = pathname.split('/').pop();
		return name ? decodeURIComponent(name) : null;
	} catch {
		const name = url.split('/').pop();
		return name ?? null;
	}
}

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const token = getSessionTokenCookie();
	let organizationData = null;

	try {
		const orgResponse = await fetch(`${BACKEND_URL}/organization/current`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!orgResponse.ok) {
			console.error(`Failed to fetch organization data: ${orgResponse.statusText}`);
			throw new Error('Failed to fetch organization data');
		}

		organizationData = await orgResponse.json();
	} catch (error) {
		console.error('Error fetching organization data:', error);
		organizationData = null;
	}

	const settingsBody = await fetchOrganizationSettings(fetch, token, locals.user?.organization_id);
	const settings = settingsBody?.settings ?? null;
	const platformGuideUrl: string | null = settings?.platform_guide?.value?.file_path ?? null;
	const analyticsLinkUrl: string | null = settings?.analytics_link?.value?.url ?? null;

	const form = await superValidate(
		{ analytics_link: analyticsLinkUrl ?? '' },
		zod4(editOrganizationSchema)
	);

	return {
		form,
		currentOrganization: organizationData,
		platformGuideUrl,
		platformGuideFilename: deriveFilename(platformGuideUrl),
		analyticsLinkUrl
	};
};

export const actions: Actions = {
	save: async ({ request, fetch, cookies, locals }) => {
		const token = getSessionTokenCookie();

		const form = await superValidate(request, zod4(editOrganizationSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const formData = new FormData();
		formData.append('name', form.data.name);
		formData.append('shortcode', form.data.shortcode);

		// append logo file if provided
		if (form.data.logo && form.data.logo.size > 0) {
			formData.append('logo', form.data.logo);
		}

		const res = await fetch(`${BACKEND_URL}/organization/current`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`
			},
			body: formData
		});

		if (!res.ok) {
			return fail(401, { form });
		}

		await res.json();

		const orgId = locals.user?.organization_id;

		// Upload platform guide PDF if provided.
		if (orgId && form.data.platform_guide && form.data.platform_guide.size > 0) {
			const pdfData = new FormData();
			pdfData.append('file', form.data.platform_guide);
			const pdfRes = await fetch(`${BACKEND_URL}/organization/${orgId}/platform_guide`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
				body: pdfData
			});
			if (!pdfRes.ok) {
				return fail(pdfRes.status, { form });
			}
		}

		// Persist analytics link changes via the settings endpoint (full-replace PUT).
		if (orgId) {
			const submitted = (form.data.analytics_link ?? '').trim();
			const newUrl: string | null = submitted === '' ? null : submitted;
			const settingsBody = await fetchOrganizationSettings(fetch, token, orgId);
			const currentUrl: string | null = settingsBody?.settings?.analytics_link?.value?.url ?? null;
			if (settingsBody?.settings && currentUrl !== newUrl) {
				const nextSettings = {
					...settingsBody.settings,
					analytics_link: { value: { url: newUrl } }
				};
				const settingsRes = await fetch(`${BACKEND_URL}/organization/${orgId}/settings`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify({ settings: nextSettings })
				});
				if (!settingsRes.ok) {
					return fail(settingsRes.status, { form });
				}
			}
		}

		const previousShortcode = cookies.get(organizationCookieName);
		if (previousShortcode) {
			invalidateOrganizationCache(previousShortcode);
		}
		if (form.data.shortcode && form.data.shortcode !== previousShortcode) {
			invalidateOrganizationCache(form.data.shortcode);
			setOrganizationCookie(cookies, form.data.shortcode);
		}

		throw redirect(
			303,
			`/organization`,
			{ type: 'success', message: 'Organization updated successfully.' },
			cookies
		);
	}
};
