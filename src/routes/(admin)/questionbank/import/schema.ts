import { z } from 'zod';
export const schema = z.object({
	file: z.instanceof(File, { error: 'File must be a valid File object' }),
	user_id: z.number()
});
