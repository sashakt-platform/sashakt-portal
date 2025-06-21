import type { PageServerLoad, Actions } from './$types.js';
import { questionSchema,tagSchema } from './schema.js';
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
    }
    catch (error) {
        console.error('Error fetching tag types:', error);
    }

    const form = await superValidate(zod(questionSchema));
    const tagForm = await superValidate(zod(tagSchema));

    return {
        form,
        tagForm,
        questionData,
        tagTypes
    }
}


export const actions: Actions = {
    save: async ({ request,params }) => {
        const token = getSessionTokenCookie();
        const form = await superValidate(request, zod(questionSchema));
        if (!form.valid) {
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
                return fail(500, { form });
        }
            await response.json();
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