import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableActions from './data-table-actions.svelte';

export const userSchema = z.object({
	id: z.string(),
	full_name: z.string(),
	email: z.string(),
	phone: z.string()
});

type User = z.infer<typeof userSchema>;

export const columns: ColumnDef<User>[] = [
	{
		accessorKey: 'full_name',
		header: 'Name'
	},
	{
		accessorKey: 'email',
		header: 'Email'
	},
	{
		accessorKey: 'phone',
		header: 'Phone'
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			return renderComponent(DataTableActions, { id: row.original.id });
		}
	}
];
