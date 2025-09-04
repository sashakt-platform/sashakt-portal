import type { PageServerLoad, Actions } from './$types.js';
import { testSchema } from './schema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { getSessionTokenCookie } from '$lib/server/auth.js';
import { fail } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';
import { redirect, setFlash } from 'sveltekit-flash-message/server';

export const load: PageServerLoad = async ({ params, url }) => {
	const token = getSessionTokenCookie();
	let testData = null;
	let templateID = url.searchParams.get('template_id') || null;
	const is_template = params?.type === 'template';
	try {
		if (params?.id !== 'new') {
			let id = templateID || params.id;
			const testResponse = await fetch(`${BACKEND_URL}/test/${id}/?is_template=${is_template}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			if (!testResponse.ok) {
				console.error(`Failed to fetch question data: ${testResponse.statusText}`);
				throw new Error('Failed to fetch question data');
			}

			testData = await testResponse.json();
			if (templateID) {
				testData.is_template = false;
				testData.template_id = templateID;
				testData.link = null;
			}
		}
	} catch (error) {
		console.error('Error fetching test data:', error);
		testData = null;
	}

	const form = await superValidate(zod(testSchema));
	form.data.is_template = is_template;

	const responseQuestions = await fetch(`${BACKEND_URL}/questions/?page=1&size=100`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	let questions = [];
	if (!responseQuestions.ok) {
		console.error(
			'Failed to fetch questions:',
			responseQuestions.status,
			responseQuestions.statusText
		);
	} else {
		questions = await responseQuestions.json();
	}

	return {
		form,
		testData,
		questions
	};
};

export const actions: Actions = {
	save: async ({ request, params, cookies }) => {
		const token = getSessionTokenCookie();
		const form = await superValidate(request, zod(testSchema));
		if (!form.valid) {
			setFlash(
				{ type: 'error', message: 'Test not Created. Please check all the details.' },
				cookies
			);
			return fail(400, { form });
		}
		const response = await fetch(
			`${BACKEND_URL}/test${params.id !== 'new' && params.id !== 'convert' ? `/${params.id}` : ''}`,
			{
				method: `${params.id !== 'new' && params.id !== 'convert' ? 'PUT' : 'POST'}`,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(form.data)
			}
		);

		if (!response.ok) {
			const errorMessage = await response.json();
			setFlash(
				{
					type: 'error',
					message: `Test not Created. Details: ${errorMessage.detail || response.statusText}`
				},
				cookies
			);
			return fail(500, { form });
		}
		redirect(
			`/tests/test-${form.data.is_template ? 'template' : 'session'}`,
			{
				type: 'success',
				message: `Test ${form.data.is_template ? 'template' : 'session'} saved successfully`
			},
			cookies
		);
	},
	delete: async ({ params, cookies }) => {
		const token = getSessionTokenCookie();
		const test_type = params.type === 'template' ? 'template' : 'session';
		const response = await fetch(`${BACKEND_URL}/test/${params.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			const errorMessage = await response.json();
			redirect(
				`/tests/test-${test_type}`,
				{
					type: 'error',
					message: `${errorMessage.detail || response.statusText}`
				},
				cookies
			);
		}
		redirect(
			`/tests/test-${test_type}`,
			{ type: 'success', message: `Test ${test_type} deleted successfully` },
			cookies
		);
	},
	clone: async ({ params, cookies }) => {
		const token = getSessionTokenCookie();
		const response = await fetch(`${BACKEND_URL}/test/${params.id}/clone`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			const errorMessage = await response.json();
			redirect(
				500,
				`/tests/test-session`,
				{
					type: 'error',
					message: `Failed to clone test session. Details: ${errorMessage.detail || response.statusText}`
				},
				cookies
			);
		}
		redirect(
			`/tests/test-session`,
			{ type: 'success', message: `Test session cloned successfully` },
			cookies
		);
	}
};
