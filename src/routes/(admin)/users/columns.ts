import { z } from 'zod';
import { createDataTableColumns } from '$lib/components/data-table/datatable-factory.js';

export const userSchema = z.object({
	id: z.number(),
	full_name: z.string(),
	email: z.string(),
	phone: z.string()
});

type User = z.infer<typeof userSchema>;

export const createColumns = createDataTableColumns<User>({
	columns: [
		{ key: 'full_name', title: 'Name' },
		{ key: 'email', title: 'Email' },
		{ key: 'phone', title: 'Phone' }
	],
	entityName: 'User',
	baseUrl: '/users'
});
