import type { PageServerLoad, Actions } from './$types.js';
import { questionSchema } from './schema.js';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { getSessionTokenCookie } from '$lib/server/auth.js';
import { fail, redirect } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';


export const load: PageServerLoad = async ({ params }: any) => {
    console.log('Loading question form...', params);
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

    const form = await superValidate(zod(questionSchema));

    return {
        form,
        questionData,
    }
}


export const actions: Actions = {
    save: async ({ request,params }) => {
        console.log('Saving question...',params);
        const token = getSessionTokenCookie();
        const form = await superValidate(request, zod(questionSchema));
        if (!form.valid) {
        console.log('Form validation failed:', form.errors);
            return fail(400, { form });
        }
            const response = await fetch(`${BACKEND_URL}/questions${params.id!=='new' ? `/${params.id}/revisions` : ''}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(form.data)
            });

        if (!response.ok) {
                console.log('Failed to save question:', response.status, response.statusText);
                return fail(500, { form });
        }
        console.log('Question saved successfully');
            await response.json();
            return redirect(303, `/questionbank`);
    }
};