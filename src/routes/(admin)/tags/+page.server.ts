import { BACKEND_URL } from '$env/static/private';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';
import { redirect } from 'sveltekit-flash-message/server';
import { fail } from '@sveltejs/kit';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

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

	let tagTypes: { items: Record<string, unknown>[]; total: number; pages: number } = {
		items: [],
		total: 0,
		pages: 0
	};

	// build query string
	const tagTypesQueryParams = new URLSearchParams({
		page: page.toString(),
		size: size.toString(),
		...(search && { name: search }),
		...(sortBy && { sort_by: sortBy }),
		...(sortOrder && { sort_order: sortOrder })
	});

	const tagTypesResponse = await fetch(`${BACKEND_URL}/tagtype/?${tagTypesQueryParams}`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${token}` }
	});

	if (tagTypesResponse.ok) {
		tagTypes = await tagTypesResponse.json();
	} else {
		console.error('Failed to fetch tag types:', await tagTypesResponse.text());
	}

	return {
		tagTypes,
		totalPages: tagTypes.pages || 0,
		params: { page, size, search, sortBy, sortOrder }
	};
};

export const actions: Actions = {
	createTagType: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.CREATE_TAG);
		const token = getSessionTokenCookie();

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const description = formData.get('description')?.toString() || null;

		if (!name) {
			setFlash({ type: 'error', message: 'Tag type name is required.' }, cookies);
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
			const errorMessage = await response.json();
			setFlash(
				{ type: 'error', message: errorMessage.detail || 'Failed to create Tag Type.' },
				cookies
			);
			return fail(500);
		}

		redirect('/tags', { type: 'success', message: 'Tag Type created successfully!' }, cookies);
	},

	updateTagType: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.UPDATE_TAG);
		const token = getSessionTokenCookie();

		const formData = await request.formData();
		const id = formData.get('id');
		const name = formData.get('name')?.toString().trim();
		const description = formData.get('description')?.toString() || null;

		if (!id || !name) {
			setFlash({ type: 'error', message: 'Tag type name is required.' }, cookies);
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
			const errorMessage = await response.json();
			setFlash(
				{ type: 'error', message: errorMessage.detail || 'Failed to update Tag Type.' },
				cookies
			);
			return fail(500);
		}

		redirect('/tags', { type: 'success', message: 'Tag Type updated successfully!' }, cookies);
	},

	createTag: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.CREATE_TAG);
		const token = getSessionTokenCookie();

		const formData = await request.formData();
		const name = formData.get('name')?.toString().trim();
		const tag_type_id = Number(formData.get('tag_type_id'));

		if (!name) {
			setFlash({ type: 'error', message: 'Tag name is required.' }, cookies);
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
			const errorMessage = await response.json();
			setFlash({ type: 'error', message: errorMessage.detail || 'Failed to create Tag.' }, cookies);
			return fail(500);
		}

		redirect('/tags', { type: 'success', message: 'Tag created successfully!' }, cookies);
	},

	updateTag: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.UPDATE_TAG);
		const token = getSessionTokenCookie();

		const formData = await request.formData();
		const id = formData.get('id');
		const name = formData.get('name')?.toString().trim();

		if (!id || !name) {
			setFlash({ type: 'error', message: 'Tag name is required.' }, cookies);
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
			const errorMessage = await response.json();
			setFlash({ type: 'error', message: errorMessage.detail || 'Failed to update Tag.' }, cookies);
			return fail(500);
		}

		redirect('/tags', { type: 'success', message: 'Tag updated successfully!' }, cookies);
	},

	deleteTag: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_TAG);
		const token = getSessionTokenCookie();

		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) {
			setFlash({ type: 'error', message: 'Tag ID is required.' }, cookies);
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
			const errorMessage = await response.json();
			setFlash({ type: 'error', message: errorMessage.detail || 'Failed to delete Tag.' }, cookies);
			return fail(500);
		}

		redirect('/tags', { type: 'success', message: 'Tag deleted successfully!' }, cookies);
	},

	deleteTagType: async ({ request, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_TAG);
		const token = getSessionTokenCookie();

		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) {
			setFlash({ type: 'error', message: 'Tag Type ID is required.' }, cookies);
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
			const errorMessage = await response.json();
			setFlash(
				{ type: 'error', message: errorMessage.detail || 'Failed to delete Tag Type.' },
				cookies
			);
			return fail(500);
		}

		redirect('/tags', { type: 'success', message: 'Tag Type deleted successfully!' }, cookies);
	}
};
