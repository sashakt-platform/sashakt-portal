import { z } from 'zod';


export const optionSchema = z.object({
    id: z.number().int(),
    key: z.string(),
    value: z.string()
});

export const questionSchema = z.object({
        question_text: z.string().nonempty({ message: "Question text is required" }),
        instructions: z.string().nullable().optional(),
        question_type: z.enum(["single-choice", "multi-choice"]).default("single-choice"),
        options: z.array(optionSchema).min(2).default([]),
        correct_answer: z.array(z.number().int()).min(1).default([]),
        subjective_answer_limit: z.number().int().positive().nullable().optional(),
        is_mandatory: z.boolean().default(true),
        solution: z.string().nullable().optional(),
        organization_id: z.number().int().positive(),
        created_by_id: z.number().int().positive(),
        state_ids: z.array(z.string()).default([]),
        district_ids: z.array(z.string()).default([]),
        block_ids: z.array(z.string()).default([]),
        tag_ids: z.array(z.string()).default([]),
});

export type FormSchema = typeof questionSchema;



export const tagSchema = z.object({
    description: z.string().nullable().optional(),
    name: z.string().nonempty({ message: "Tag name is required" }),
    tag_type_id: z.string(),
    created_by_id: z.number().int().positive(),
});

export type TagFormSchema = typeof tagSchema;