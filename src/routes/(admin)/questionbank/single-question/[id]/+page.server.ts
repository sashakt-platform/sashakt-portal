import type { PageServerLoad, Actions } from './$types.js';
import { questionSchema, tagSchema } from './schema.js';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { getSessionTokenCookie } from '$lib/server/auth.js';
import { fail, redirect } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';

export const load: PageServerLoad = async ({ params }: any) => {
	const token = getSessionTokenCookie();
	let questionData = null;

	try {
		if (params.id && params.id !== 'new') {
			const questionResponse = await fetch(`${BACKEND_URL}/questions/${params.id}`, {
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
		const tagTypesResponse = await fetch(`${BACKEND_URL}/tagtype/`, {
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

		tagTypes = await tagTypesResponse.json();
	} catch (error) {
		console.error('Error fetching tag types:', error);
	}

	const form = await superValidate(zod(questionSchema));
	const tagForm = await superValidate(zod(tagSchema));

	return {
		form,
		tagForm,
		questionData,
		tagTypes
	};
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const token = getSessionTokenCookie();
		const form = await superValidate(request, zod(questionSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		if (params.id === 'new') {
			const response = await fetch(`${BACKEND_URL}/questions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(form.data)
			});

			if (!response.ok) {
				return fail(500, { form });
			}
		}

		if (params.id !== 'new') {
			const response = await fetch(`${BACKEND_URL}/questions/${params.id}/revisions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(form.data)
			});

			if (!response.ok) {
				console.error(`Failed to update question: ${response.statusText}`);
				return fail(500, { form });
			}

			const tagResponse = await fetch(`${BACKEND_URL}/questions/${params.id}/tags`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ tag_ids: form.data.tag_ids })
			});

			if (!tagResponse.ok) {
				console.error(`Failed to update tags: ${tagResponse.statusText}`);
				return fail(500, { form });
			}

			// Transform state_ids array into the required format
			const stateDataArray = form.data.state_ids.map((stateId) => ({
				state_id: stateId
			}));

			// Send the transformed array to the API
			const stateResponse = await fetch(`${BACKEND_URL}/questions/${params.id}/locations`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ locations: stateDataArray })
			});

			if (!stateResponse.ok) {
				console.error(`Failed to update states: ${stateResponse.statusText}`);
				return fail(500, { form });
			}
		}
		return redirect(303, `/questionbank`);
	},

	tagSave: async ({ request }) => {
		const token = getSessionTokenCookie();
		const tagForm = await superValidate(request, zod(tagSchema));
		if (!tagForm.valid) {
			return fail(400, { tagForm });
		}
		const response = await fetch(`${BACKEND_URL}/tag`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(tagForm.data)
		});

		if (!response.ok) {
			return fail(500, { tagForm });
		}
		await response.json();
	},
	delete: async ({ params }) => {
		const token = getSessionTokenCookie();
		const response = await fetch(`${BACKEND_URL}/questions/${params.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			return fail(500, { error: 'Failed to delete question' });
		}
		return redirect(303, `/questionbank`);
	}
};