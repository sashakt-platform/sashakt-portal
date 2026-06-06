import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn,
	createSelectionColumn
} from '$lib/components/data-table/column-helpers';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DateCell from '$lib/components/data-table/DateCell.svelte';
import { resolve } from '$app/paths';

export const entityTypeSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().optional(),
	modified_date: z.string(),
	total_records: z.number().optional().default(0)
});

export type EntityType = z.infer<typeof entityTypeSchema>;

export const createColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	enableSelection: boolean = false,
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	}
): ColumnDef<EntityType>[] => [
	...(enableSelection ? [createSelectionColumn<EntityType>()] : []),
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort, {
		meta: { grow: true }
	}),
	{
		accessorKey: 'description',
		header: 'Description',
		enableSorting: false
	},
	{
		accessorKey: 'total_records',
		header: 'NO. OF RECORDS',
		enableSorting: false,
		size: 130,
		meta: { align: 'center' }
	},
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(DateCell, { value: row.original.modified_date }),
		size: 160
	}),
	createActionsColumn<EntityType>('Entity', '/entity', {
		...permissions,
		editInline: true,
		deleteInline: true,
		customActions: (row) => [
			{
				label: 'View Records',
				href: resolve(`/entity/view/${row.id}`),
				icon: 'external-link',
				inline: true
			}
		]
	})
];
