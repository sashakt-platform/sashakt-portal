import { z } from 'zod';


export const questionSchema = z.object({
    question_text: z.string().nonempty({ message: "Question text is required" }),
    instructions: z.string().nullable().optional(),
    question_type: z.enum(["single-choice", "multi-choice"]),
    options: z.array(z.record(z.string())).min(2),
    correct_answer: z.array(z.number().int()).min(1),
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