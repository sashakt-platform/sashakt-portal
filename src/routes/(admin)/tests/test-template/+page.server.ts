import type { PageServerLoad, Actions } from './$types.js';
import { testTemplateSchema } from './schema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';



export const load: PageServerLoad = async () => {
    return {
        form: await superValidate(zod(testTemplateSchema))
    };
};

