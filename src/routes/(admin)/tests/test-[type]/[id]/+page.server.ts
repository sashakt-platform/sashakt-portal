import type { PageServerLoad, Actions } from './$types.js';
import { testSchema } from './schema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { getSessionTokenCookie } from '$lib/server/auth.js';
import { fail, redirect } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';


export const load: PageServerLoad = async ({ params,url }: any) => {
    console.log('current params-->', params);

    const token = getSessionTokenCookie();
    let testData = null;
    let templateID= url.searchParams.get('template_id') || null;
    const is_template = params.type === 'template' ;
    console.log('is_template-->', is_template);
    try {
        if (params?.id !== 'new') {
            let id= templateID || params.id;
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
    console.log("test data before conversion-->",testData);

    const responseQuestions = await fetch(
		`${BACKEND_URL}/questions/?skip=0&limit=100`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	);

	const questions = await responseQuestions.json();

    return {
        form,
        testData,
        questions
    }
}


export const actions: Actions = {
    save: async ({ request, params }) => {
        console.log("Saving tests with params:", params);
        const token = getSessionTokenCookie();
        const form = await superValidate(request, zod(testSchema));
        if (!form.valid) {
            return fail(400, { form });
        }
        console.log("Form data before saving new:", form.data);
            const response = await fetch(`${BACKEND_URL}/test${(params.id!=='new' && params.id!=='convert') ? `/${params.id}` : ''}`, {
                method: `${(params.id!=='new' && params.id!=='convert')? 'PUT' : 'POST'}`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(form.data)
            });

        if (!response.ok) {
            console.error("Failed to save test:", response.status, response.statusText);
                return fail(500, { form });
        }
        console.log("Response from save action:", response);
            await response.json();
            return redirect(303, `/tests/test-${form.data.is_template ? 'template' : 'session'}`);
    },
    delete: async ({ params }) => {
        console.log("Deleting test with params:", params);
        const token = getSessionTokenCookie();
        const response = await fetch(`${BACKEND_URL}/test/${params.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return fail(500, { error: 'Failed to delete test' });
        }
        return redirect(303, `/tests/test-${params.type === 'template' ? 'template' : 'session'}`);
    }
};