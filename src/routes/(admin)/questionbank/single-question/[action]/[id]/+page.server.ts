import type { PageServerLoad, Actions } from './$types.js';
import { questionSchema, tagSchema } from './schema.js';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { getSessionTokenCookie, requireLogin } from '$lib/server/auth.js';
import { fail } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

export const load: PageServerLoad = async ({ params }: any) => {
	const user = requireLogin();
	const token = getSessionTokenCookie();

	// Check permissions based on action
	if (params.action === 'add') {
		requirePermission(user, PERMISSIONS.CREATE_QUESTION);
	} else if (params.action === 'edit') {
		requirePermission(user, PERMISSIONS.UPDATE_QUESTION);
	} else if (params.action === 'delete') {
		requirePermission(user, PERMISSIONS.DELETE_QUESTION);
	}
	let questionData = null;
	let questionRevisions = null;

	try {
		if (params.id && params.id !== 'new') {
			const questionResponse = await fetch(`${BACKEND_URL}/questions/${params.id}/`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!questionResponse.ok) {
				console.error(`Failed to fetch question data: ${questionResponse.statusText}`);
				throw new Error('Failed to fetch question data');
			}

			questionData = await questionResponse.json();
		}
	} catch (error) {
		console.error('Error fetching question data:', error);
		questionData = null;
	}
	let tagTypes = [];
	try {
		const tagTypesResponse = await fetch(`${BACKEND_URL}/tagtype/?page=1&size=100`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!tagTypesResponse.ok) {
			console.error(`Failed to fetch tag types: ${tagTypesResponse.statusText}`);
			throw new Error('Failed to fetch tag types');
		}

		const tagTypesRes = await tagTypesResponse.json();
		tagTypes = tagTypesRes.items || [];
	} catch (error) {
		console.error('Error fetching tag types:', error);
	}

	try {
		const questionRevisionsResponse = await fetch(
			`${BACKEND_URL}/questions/${params.id}/revisions/`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			}
		);
		if (!questionRevisionsResponse.ok) {
			console.error(`Failed to fetch Question Revision: ${questionRevisionsResponse.statusText}`);
			throw new Error('Failed to fetch Question Revision');
		}

		questionRevisions = await questionRevisionsResponse.json();
	} catch (error) {
		console.error('Error fetching Question Revision:', error);
	}

	const form = await superValidate(zod(questionSchema));
	const tagForm = await superValidate(zod(tagSchema));

	return {
		form,
		tagForm,
		questionData,
		tagTypes,
		questionRevisions
	};
};

export const actions: Actions = {
	save: async ({ request, params, cookies }) => {
		const user = requireLogin();
		const token = getSessionTokenCookie();

		// Check permissions based on action
		if (params.action === 'edit') {
			requirePermission(user, PERMISSIONS.UPDATE_QUESTION);
		} else if (params.action === 'add') {
			requirePermission(user, PERMISSIONS.CREATE_QUESTION);
		}
		const form = await superValidate(request, zod(questionSchema));
		if (!form.valid) {
			setFlash(
				{ type: 'error', message: 'Question not Created. Please check all the details.' },
				cookies
			);
			return fail(400, { form });
		}

		const transformedFormData = {
			...form.data,
			state_ids: form.data.state_ids.map((s) => s.id),
			tag_ids: form.data.tag_ids.map((t) => t.id)
		};

		if (params.id === 'new') {
			const response = await fetch(`${BACKEND_URL}/questions/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(transformedFormData)
			});

			if (!response.ok) {
				const errorMessage = await response.json();
				setFlash(
					{
						type: 'error',
						message: errorMessage.detail || 'Question not Created. Please check all the details.'
					},
					cookies
				);
				return fail(500, { form });
			}
		}

		if (params.id !== 'new') {
			const response = await fetch(`${BACKEND_URL}/questions/${params.id}/revisions/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(form.data)
			});

			if (!response.ok) {
				const errorMessage = await response.json();
				setFlash(
					{
						type: 'error',
						message: `Failed to update question: ${errorMessage.detail || response.statusText}`
					},
					cookies
				);
				return fail(500, { form });
			}

			// Transform tag_ids array into the required format
			const tagsDataArray = form.data.tag_ids.map((tagId) => tagId.id);
			const tagResponse = await fetch(`${BACKEND_URL}/questions/${params.id}/tags/`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ tag_ids: tagsDataArray })
			});

			if (!tagResponse.ok) {
				const errorMessage = await tagResponse.json();
				setFlash(
					{
						type: 'error',
						message: `Failed to update tags: ${errorMessage.detail || tagResponse.statusText}`
					},
					cookies
				);
				return fail(500, { form });
			}

			// Transform state_ids array into the required format
			const stateDataArray = form.data.state_ids.map((stateId) => ({
				state_id: stateId.id
			}));

			// Send the transformed array to the API
			const stateResponse = await fetch(`${BACKEND_URL}/questions/${params.id}/locations/`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ locations: stateDataArray })
			});

			if (!stateResponse.ok) {
				const errorMessage = await stateResponse.json();
				setFlash(
					{
						type: 'error',
						message: `Failed to update states: ${errorMessage.detail || stateResponse.statusText}`
					},
					cookies
				);
				return fail(500, { form });
			}
		}
		redirect('/questionbank', { type: 'success', message: 'Question saved successfully' }, cookies);
	},

	tagSave: async ({ request, cookies }) => {
		const token = getSessionTokenCookie();
		const tagForm = await superValidate(request, zod(tagSchema));
		if (!tagForm.valid) {
			setFlash({ type: 'error', message: `Tag Details not Valid` }, cookies);
			return fail(400, { tagForm });
		}
		const response = await fetch(`${BACKEND_URL}/tag/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(tagForm.data)
		});

		if (!response.ok) {
			const errorMessage = await response.json();
			setFlash(
				{ type: 'error', message: `Tag not Saved: ${errorMessage.detail || response.statusText}` },
				cookies
			);
			return fail(500, { tagForm });
		}
		setFlash({ type: 'success', message: 'Tag saved successfully' }, cookies);
	},
	delete: async ({ params, cookies }) => {
		const user = requireLogin();
		requirePermission(user, PERMISSIONS.DELETE_QUESTION);
		const token = getSessionTokenCookie();
		const response = await fetch(`${BACKEND_URL}/questions/${params.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			const failMessage = await response.json();
			redirect(
				'/questionbank',
				{
					type: 'error',
					message: `${failMessage.detail || response.statusText}`
				},
				cookies
			);
		}
		redirect(
			'/questionbank',
			{ type: 'success', message: 'Question deleted successfully' },
			cookies
		);
	}
};
