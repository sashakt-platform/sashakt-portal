import { z } from 'zod';

// Form field types enum
export const FormFieldType = {
	FULL_NAME: 'full_name',
	EMAIL: 'email',
	PHONE: 'phone',
	TEXT: 'text',
	TEXTAREA: 'textarea',
	NUMBER: 'number',
	DATE: 'date',
	SELECT: 'select',
	RADIO: 'radio',
	CHECKBOX: 'checkbox',
	MULTI_SELECT: 'multi_select',
	ENTITY: 'entity',
	STATE: 'state',
	DISTRICT: 'district',
	BLOCK: 'block'
} as const;

export type FormFieldTypeValue = (typeof FormFieldType)[keyof typeof FormFieldType];

// Field type labels for UI
export const fieldTypeLabels: Record<FormFieldTypeValue, string> = {
	full_name: 'Full Name',
	email: 'Email',
	phone: 'Phone',
	text: 'Text',
	textarea: 'Text Area',
	number: 'Number',
	date: 'Date',
	select: 'Dropdown Select',
	radio: 'Radio Buttons',
	checkbox: 'Checkbox',
	multi_select: 'Multi Select',
	entity: 'Entity',
	state: 'State',
	district: 'District',
	block: 'Block'
};

// Group field types by category for UI
export const fieldTypeCategories = {
	'Core User Fields': [FormFieldType.FULL_NAME, FormFieldType.EMAIL, FormFieldType.PHONE],
	'Text Fields': [FormFieldType.TEXT, FormFieldType.TEXTAREA],
	'Choice Fields': [
		FormFieldType.SELECT,
		FormFieldType.RADIO,
		FormFieldType.CHECKBOX,
		FormFieldType.MULTI_SELECT
	],
	'Other Fields': [FormFieldType.NUMBER, FormFieldType.DATE],
	'Location Fields': [FormFieldType.STATE, FormFieldType.DISTRICT, FormFieldType.BLOCK],
	'Entity Fields': [FormFieldType.ENTITY]
};

// Field option schema
export const fieldOptionSchema = z.object({
	id: z.number().optional(),
	label: z.string().min(1, 'Option label is required'),
	value: z.string().min(1, 'Option value is required')
});

// Field validation schema
export const fieldValidationSchema = z.object({
	min_length: z.number().optional().nullable(),
	max_length: z.number().optional().nullable(),
	min_value: z.number().optional().nullable(),
	max_value: z.number().optional().nullable(),
	pattern: z.string().optional().nullable(),
	custom_error_message: z.string().optional().nullable()
});

// Form field schema
export const formFieldSchema = z.object({
	id: z.number().optional(),
	field_type: z.string().min(1, 'Field type is required'),
	label: z.string().min(1, 'Label is required'),
	name: z.string().min(1, 'Field name is required'),
	placeholder: z.string().optional().nullable(),
	help_text: z.string().optional().nullable(),
	is_required: z.boolean().default(false),
	order: z.number().default(0),
	options: z.array(fieldOptionSchema).optional().nullable(),
	validation: fieldValidationSchema.optional().nullable(),
	default_value: z.string().optional().nullable(),
	entity_type_id: z.number().optional().nullable()
});

export type FormField = z.infer<typeof formFieldSchema>;
export type FieldOption = z.infer<typeof fieldOptionSchema>;
export type FieldValidation = z.infer<typeof fieldValidationSchema>;

// Base form schema
const baseFormSchema = z.object({
	name: z.string().min(1, { error: 'Form name is required' }),
	description: z.string().optional().nullable(),
	is_active: z.boolean().default(true),
	organization_id: z.number().optional()
});

export const createFormSchema = baseFormSchema;
export const editFormSchema = baseFormSchema;
export const formSchema = createFormSchema;

export type CreateFormSchema = typeof createFormSchema;
export type EditFormSchema = typeof editFormSchema;
export type FormFormSchema = typeof formSchema;
