import type { PageServerLoad, Actions } from './$types.js';
import { questionSchema, tagSchema } from './schema.js';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { getSessionTokenCookie } from '$lib/server/auth.js';
import { fail } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { redirect,setFlash } from 'sveltekit-flash-message/server';

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
	save: async ({ request, params,cookies }) => {
		const token = getSessionTokenCookie();
		const form = await superValidate(request, zod(questionSchema));
		if (!form.valid) {
			setFlash({ type: 'error', message: "Question not Created. Please check all the details." }, cookies);
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
				setFlash({ type: 'error', message: "Question not Created. Please check all the details." }, cookies);
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
				setFlash({ type: 'error', message: `Failed to update question: ${response.statusText}` }, cookies);
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
				setFlash({ type: 'error', message: `Failed to update tags: ${tagResponse.statusText}` }, cookies);
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
				setFlash({ type: 'error', message: `Failed to update states: ${stateResponse.statusText}` }, cookies);
				return fail(500, { form });
			}
		}
		redirect('/questionbank', { type: 'success', message: 'Question saved successfully' },cookies);
	},

	tagSave: async ({ request,cookies }) => {
		const token = getSessionTokenCookie();
		const tagForm = await superValidate(request, zod(tagSchema));
		if (!tagForm.valid) {
			setFlash({ type: 'error', message: `Tag Details not Valid` }, cookies);
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
			setFlash({ type: 'error', message: `Tag not Saved: ${response.statusText}` }, cookies);
			return fail(500, { tagForm });
		}
		setFlash({ type: 'success', message: 'Tag saved successfully' }, cookies);
	},
	delete: async ({ params,cookies }) => {
		const token = getSessionTokenCookie();
		const response = await fetch(`${BACKEND_URL}/questions/${params.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			redirect(500,'/questionbank', { type: 'error', message: `Failed to delete question: ${response.statusText}` }, cookies);
		}
		redirect('/questionbank', { type: 'success', message: 'Question deleted successfully' }, cookies);
	}
};