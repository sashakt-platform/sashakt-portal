import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn
} from '$lib/components/data-table/column-helpers';
import { formatDate } from '$lib/utils';

export const formSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().optional().nullable(),
	is_active: z.boolean(),
	fields_count: z.number().optional(),
	modified_date: z.string()
});

export type Form = z.infer<typeof formSchema>;

export const createColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	}
): ColumnDef<Form>[] => [
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort),
	{
		accessorKey: 'fields_count',
		header: 'Fields',
		cell: ({ row }) => row.original.fields_count ?? 0
	},
	createSortableColumn('is_active', 'Active', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => (row.original.is_active ? 'Yes' : 'No')
	}),
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => formatDate(row.original.modified_date)
	}),
	createActionsColumn<Form>('Form', '/forms', permissions)
];
