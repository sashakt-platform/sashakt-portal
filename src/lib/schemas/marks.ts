import { z } from 'zod';

export const marksSchema = z.object({
	correct: z.number().int().default(1),
	wrong: z.number().int().default(0),
	skipped: z.number().int().default(0),
	partial: z
		.object({
			correct_answers: z
				.array(
					z.object({
						num_correct_selected: z.number().int().min(1),
						marks: z.number().int().min(0)
					})
				)
				.default([])
		})
		.optional()
});
