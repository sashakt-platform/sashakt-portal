import type { PageServerLoad, Actions } from './$types.js';
import { testTemplateSchema } from './schema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { BACKEND_URL } from '$env/static/private';

import { getSessionTokenCookie } from '$lib/server/auth';
// const token = getSessionTokenCookie();

export const load: PageServerLoad = async () => {
    return {
        form: await superValidate(zod(testTemplateSchema))
    };
};


export const actions: Actions = {

  
    default: async ({ request, cookies }) => {


        const token = getSessionTokenCookie();
        const form = await superValidate(request, zod(testTemplateSchema));
        if (!form.valid) {
            return fail(400, { form });
        }

        const response= await fetch(`${BACKEND_URL}/api/v1/test`, {
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

        return response
            .json()
            .then((data) => {
                if (response.ok) {
                    return redirect(303, '/tests/test-template');
                    
                } else {
                    return fail(500, { form });
                }
            });
    }
}