import { z } from 'zod';

const baseCertificateSchema = z.object({
	name: z.string().min(1, { error: 'Certificate name is required' }),
	description: z.string().optional().nullable(),
	url: z.string().min(1, { error: 'Certificate URL is required' }),
	is_active: z.boolean().default(true),
	organization_id: z.number().optional()
});

export const createCertificateSchema = baseCertificateSchema;

export const editCertificateSchema = baseCertificateSchema;

export const certificateSchema = createCertificateSchema;

export type CreateCertificateSchema = typeof createCertificateSchema;
export type EditCertificateSchema = typeof editCertificateSchema;
export type CertificateFormSchema = typeof certificateSchema;
