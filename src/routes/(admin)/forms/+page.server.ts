import { BACKEND_URL } from '$env/static/private';
import { DEFAULT_PAGE_SIZE } from '$lib/constants.js';
import type { PageServerLoad, Actions } from './$types';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { setFlash } from 'sveltekit-flash-message/server';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_FORM);
	const token = getSessionTokenCookie();

	const page = Number(url.searchParams.get('page')) || 1;
	const size = Number(url.searchParams.get('size')) || DEFAULT_PAGE_SIZE;
	const search = url.searchParams.get('search') || '';
	const sortBy = url.searchParams.get('sortBy') || '';
	const sortOrder = url.searchParams.get('sortOrder') || 'asc';
	const isActive = url.searchParams.get('isActive') || '';

	const queryParams = new URLSearchParams({
		page: page.toString(),
		size: size.toString(),
		...(search && { name: search }),
		...(sortBy && { sort_by: sortBy, sort_order: sortOrder }),
		...(isActive && { is_active: isActive })
	});

	const res = await fetch(`${BACKEND_URL}/form/?${queryParams}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!res.ok) {
		let detail = res.statusText;
		try {
			const errorMessage = await res.json();
			detail = errorMessage.detail || detail;
		} catch {
			// Response was not JSON, fall back to statusText
		}

		setFlash(
			{
				type: 'error',
				message: `Failed to fetch forms: ${detail}`
			},
			cookies
		);

		return {
			forms: { items: [], total: 0, pages: 0 },
			totalPages: 0,
			params: { page, size, search, sortBy, sortOrder, isActive }
		};
	}

	const forms = await res.json();

	// Compute fields_count from the fields array
	if (forms.items) {
		forms.items = forms.items.map((form: Record<string, unknown>) => ({
			...form,
			fields_count: form.fields_count ?? (Array.isArray(form.fields) ? form.fields.length : 0)
		}));
	}

	return {
		forms,
		totalPages: forms.pages || 0,
		params: { page, size, search, sortBy, sortOrder, isActive }
	};
};

export const actions: Actions = {
	batchDelete: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_FORM);
		const token = getSessionTokenCookie();
		const formData = await request.formData();

		try {
			const response = await fetch(`${BACKEND_URL}/form/`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: formData.get('formIds')
			});

			if (!response.ok) {
				let message = 'Some forms have fields. Please delete all form fields before deleting these forms.';
				if (response.status !== 500) {
					try {
						const errorMessage = await response.json();
						message = `Failed to delete forms: ${errorMessage.detail || response.statusText}`;
					} catch {
						message = `Failed to delete forms: ${response.statusText}`;
					}
				}
				setFlash({ type: 'error', message }, cookies);
				return fail(500);
			}

			const deleteResponse = await response.json();
			const failCount = deleteResponse.delete_failure_list?.length || 0;
			setFlash(
				{
					type: failCount > 0 ? 'error' : 'success',
					message:
						failCount > 0
							? `${deleteResponse.delete_success_count} forms deleted. ${failCount} forms could not be deleted because they have fields. Please delete all form fields first.`
							: `Deletion complete: ${deleteResponse.delete_success_count} deleted successfully.`
				},
				cookies
			);
		} catch (error) {
			console.error('Batch delete error:', error);
			setFlash({ type: 'error', message: 'Failed to delete forms' }, cookies);
			return fail(500);
		}

		return { success: true };
	}
};
