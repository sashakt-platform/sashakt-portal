import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn
} from '$lib/components/data-table/column-helpers';

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
		.nullable()
});

export type Entity = z.infer<typeof entitySchema>;

export const createEntityColumns = (
	entityTypeId: string,
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	}
): ColumnDef<Entity>[] => [
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort),
	{
		id: 'state',
		header: 'State',
		cell: ({ row }) => row.original.state?.name || '',
		enableSorting: false
	},
	{
		id: 'district',
		header: 'District',
		cell: ({ row }) => row.original.district?.name || '',
		enableSorting: false
	},
	{
		id: 'block',
		header: 'Block',
		cell: ({ row }) => row.original.block?.name || '',
		enableSorting: false
	},
	createActionsColumn<Entity>('Entity', `/entity/view/${entityTypeId}`, permissions)
];
