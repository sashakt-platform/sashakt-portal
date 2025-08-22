import { z } from 'zod';


export const basedateSchema = z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional()

});
export type FormSchema = typeof basedateSchema