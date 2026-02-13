import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { forgotPasswordSchema } from './schema';
import { setOrganizationCookie, deleteOrganizationCookie } from '$lib/server/auth.js';

export const load: PageServerLoad = async ({ url, fetch, cookies, locals }) => {
	const orgParam = url.searchParams.get('organization');
	const org = orgParam?.trim() || null;
	let organizationData: App.Locals['organization'] | null = null;

	if (org) {
		if (locals?.organization?.shortcode === org) {
			// Cookie still valid — hook already fetched it
			organizationData = locals.organization;
		} else {
			// Cookie expired or different org — fetch directly and refresh cookie
			const res = await fetch(`${BACKEND_URL}/organization/public/${encodeURIComponent(org)}`);
			if (res.ok) {
				organizationData = await res.json();
				setOrganizationCookie(cookies, org);
			} else {
				deleteOrganizationCookie(cookies);
			}
		}
	} else {
		organizationData = locals.organization;
	}

	return {
		form: await superValidate(zod4(forgotPasswordSchema)),
		organizationData
	};
};

export const actions: Actions = {
	default: async ({ fetch, request }) => {
		const form = await superValidate(request, zod4(forgotPasswordSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const res = await fetch(`${BACKEND_URL}/password-recovery/${form.data.email}`, {
			method: 'POST',
			headers: { accept: 'application/json' }
		});

		const data = await res.json();

		if (!res.ok) {
			form.errors = { email: [data.detail ?? 'Failed to send reset link'] };
			return fail(res.status, { form });
		}

		return message(form, 'Password reset email sent successfully');
	}
};
