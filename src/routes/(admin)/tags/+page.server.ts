import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';
import { error, fail } from '@sveltejs/kit';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { serverTerms } from '$lib/server/nomenclature';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const user = requireLogin();
	requirePermission(user, PERMISSIONS.READ_TAG);
	const token = getSessionTokenCookie();

	// extract query params fo tag types
	const page = Number(url.searchParams.get('page')) || 1;
	const size = Number(url.searchParams.get('size')) || DEFAULT_PAGE_SIZE;
	const sortBy = url.searchParams.get('sort_by') || '';
	const sortOrder = url.searchParams.get('sort_order') || 'asc';
	const search = url.searchParams.get('search') || '';

	// build query string
	const tagTypesQueryParams = new URLSearchParams({
		page: page.toString(),
		size: size.toString(),
		...(search && { name: search }),
		...(sortBy && { sort_by: sortBy, sort_order: sortOrder })
	});

	const tagTypesResponse = await fetch(`${BACKEND_URL}/tagtype/?${tagTypesQueryParams}`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!tagTypesResponse.ok) {
		const errorText = await tagTypesResponse.text();
		error(tagTypesResponse.status, `Failed to fetch tag types: ${errorText}`);
	}

	const tagTypes: { items: Record<string, unknown>[]; total: number; pages: number } =
		await tagTypesResponse.json();

	return {
		tagTypes,
		totalPages: tagTypes.pages || 0,
		params: { page, size, search, sortBy, sortOrder }
	};
};

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
	try {
		const text = await response.text();
		try {
			const json = JSON.parse(text);
			return json.detail || json.message || fallback;
		} catch {
			return text || fallback;
		}
	} catch {
		return response.statusText || fallback;
	}
}

export const actions: Actions = {
	createTagType: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.CREATE_TAG);
		const token = getSessionTokenCookie();
		const term = await serverTerms(user.organization_id);

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const description = formData.get('description')?.toString() || null;

		if (!name) {
			setFlash({ type: 'error', message: `${term('tag_type')} name is required.` }, cookies);
			return fail(400);
		}

		const response = await fetch(`${BACKEND_URL}/tagtype/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ name, description, organization_id: user.organization_id })
		});

		if (!response.ok) {
			const message = await getErrorMessage(response, `Failed to create ${term('tag_type')}.`);
			setFlash({ type: 'error', message }, cookies);
			return fail(response.status);
		}

		setFlash(
			{ type: 'success', message: `${term('tag_type')} created successfully!` },
			cookies
		);
	},

	updateTagType: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.UPDATE_TAG);
		const token = getSessionTokenCookie();
		const term = await serverTerms(user.organization_id);

		const formData = await request.formData();
		const id = formData.get('id');
		const name = formData.get('name')?.toString().trim();
		const description = formData.get('description')?.toString() || null;

		if (!id || !name) {
			setFlash({ type: 'error', message: `${term('tag_type')} name is required.` }, cookies);
			return fail(400);
		}

		const response = await fetch(`${BACKEND_URL}/tagtype/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ name, description, organization_id: user.organization_id })
		});

		if (!response.ok) {
			const message = await getErrorMessage(response, `Failed to update ${term('tag_type')}.`);
			setFlash({ type: 'error', message }, cookies);
			return fail(response.status);
		}

		setFlash(
			{ type: 'success', message: `${term('tag_type')} updated successfully!` },
			cookies
		);
	},

	createTag: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.CREATE_TAG);
		const token = getSessionTokenCookie();
		const term = await serverTerms(user.organization_id);

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const tag_type_id = Number(formData.get('tag_type_id'));

		if (!name) {
			setFlash({ type: 'error', message: `${term('tag')} name is required.` }, cookies);
			return fail(400);
		}

		if (!Number.isFinite(tag_type_id)) {
			setFlash({ type: 'error', message: `${term('tag_type')} is required.` }, cookies);
			return fail(400);
		}

		const response = await fetch(`${BACKEND_URL}/tag/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ name, tag_type_id })
		});

		if (!response.ok) {
			const message = await getErrorMessage(response, `Failed to create ${term('tag')}.`);
			setFlash({ type: 'error', message }, cookies);
			return fail(response.status);
		}

		setFlash({ type: 'success', message: `${term('tag')} created successfully!` }, cookies);
	},

	updateTag: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.UPDATE_TAG);
		const token = getSessionTokenCookie();
		const term = await serverTerms(user.organization_id);

		const formData = await request.formData();
		const id = formData.get('id');
		const name = formData.get('name')?.toString().trim();

		if (!id || !name) {
			setFlash({ type: 'error', message: `${term('tag')} name is required.` }, cookies);
			return fail(400);
		}

		const response = await fetch(`${BACKEND_URL}/tag/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ name })
		});

		if (!response.ok) {
			const message = await getErrorMessage(response, `Failed to update ${term('tag')}.`);
			setFlash({ type: 'error', message }, cookies);
			return fail(response.status);
		}

		setFlash({ type: 'success', message: `${term('tag')} updated successfully!` }, cookies);
	},

	deleteTag: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_TAG);
		const token = getSessionTokenCookie();
		const term = await serverTerms(user.organization_id);

		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) {
			setFlash({ type: 'error', message: `${term('tag')} ID is required.` }, cookies);
			return fail(400);
		}

		const response = await fetch(`${BACKEND_URL}/tag/${id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			const message = await getErrorMessage(response, `Failed to delete ${term('tag')}.`);
			setFlash({ type: 'error', message }, cookies);
			return fail(response.status);
		}

		setFlash({ type: 'success', message: `${term('tag')} deleted successfully!` }, cookies);
	},

	deleteTagType: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_TAG);
		const token = getSessionTokenCookie();
		const term = await serverTerms(user.organization_id);

		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) {
			setFlash({ type: 'error', message: `${term('tag_type')} ID is required.` }, cookies);
			return fail(400);
		}

		const response = await fetch(`${BACKEND_URL}/tagtype/${id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			const message = await getErrorMessage(response, `Failed to delete ${term('tag_type')}.`);
			setFlash({ type: 'error', message }, cookies);
			return fail(response.status);
		}

		setFlash(
			{ type: 'success', message: `${term('tag_type')} deleted successfully!` },
			cookies
		);
	}
};
