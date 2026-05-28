import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn,
	createSelectionColumn
} from '$lib/components/data-table/column-helpers';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DateCell from '$lib/components/data-table/DateCell.svelte';
import ActiveStatusBadge from '$lib/components/data-table/ActiveStatusBadge.svelte';
import TruncatedTextCell from '$lib/components/data-table/TruncatedTextCell.svelte';

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
	enableSelection: boolean = false,
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	}
): ColumnDef<Form>[] => [
	...(enableSelection ? [createSelectionColumn<Form>()] : []),
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort, {
		meta: { grow: true }
	}),
	{
		accessorKey: 'description',
		header: 'Description',
		cell: ({ row }) =>
			renderComponent(TruncatedTextCell, { value: row.original.description ?? '' }),
		size: 220,
		meta: { cellClassName: 'max-w-[220px] overflow-hidden' }
	},
	{
		accessorKey: 'is_active',
		header: 'Status',
		enableSorting: false,
		cell: ({ row }) => renderComponent(ActiveStatusBadge, { active: row.original.is_active }),
		size: 130,
		meta: { align: 'center' }
	},
	{
		accessorKey: 'fields_count',
		header: 'Fields',
		cell: ({ row }) => row.original.fields_count ?? 0,
		size: 100
	},
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(DateCell, { value: row.original.modified_date }),
		size: 160
	}),
	createActionsColumn<Form>('Form', '/forms', {
		...permissions,
		editInline: true,
		deleteInline: true
	})
];
