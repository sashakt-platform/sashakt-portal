import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn,
	createSelectionColumn
} from '$lib/components/data-table/column-helpers';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DateCell from '$lib/components/data-table/DateCell.svelte';

export const entitySchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().optional(),
	state: z
		.object({
			name: z.string().optional()
		})
		.optional()
		.nullable(),
	district: z
		.object({
			name: z.string().optional()
		})
		.optional()
		.nullable(),
	block: z
		.object({
			name: z.string().optional()
		})
		.optional()
		.nullable(),
	modified_date: z.string()
});

export type Entity = z.infer<typeof entitySchema>;

export const createEntityColumns = (
	entityTypeId: string,
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	enableSelection: boolean = false,
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	}
): ColumnDef<Entity>[] => [
	...(enableSelection ? [createSelectionColumn<Entity>()] : []),
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort),
	createSortableColumn<Entity>(
		'state' as keyof Entity,
		'State',
		currentSortBy,
		currentSortOrder,
		handleSort,
		{
			cell: ({ row }) => row.original.state?.name || ''
		}
	),
	createSortableColumn<Entity>(
		'district' as keyof Entity,
		'District',
		currentSortBy,
		currentSortOrder,
		handleSort,
		{
			cell: ({ row }) => row.original.district?.name || ''
		}
	),
	createSortableColumn<Entity>(
		'block' as keyof Entity,
		'Block',
		currentSortBy,
		currentSortOrder,
		handleSort,
		{
			cell: ({ row }) => row.original.block?.name || ''
		}
	),
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(DateCell, { value: row.original.modified_date })
	}),
	createActionsColumn<Entity>('Record', `/entity/view/${entityTypeId}`, {
		...permissions,
		editInline: true,
		deleteInline: true
	})
];
