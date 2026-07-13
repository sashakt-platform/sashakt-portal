import { z } from 'zod';

export const addProviderSchema = z.object({
	provider_id: z.number().min(1, { error: 'Please select a provider' }),
	config_json: z
		.string()
		.optional()
		.refine(
			(value) => {
				if (!value || value.trim() === '') return true;
				try {
					JSON.parse(value);
					return true;
				} catch {
					return false;
				}
			},
			{ error: 'Config must be valid JSON' }
		),
	is_enabled: z.boolean().default(true)
});

export type AddProviderSchema = typeof addProviderSchema;
