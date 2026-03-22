import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn
} from '$lib/components/data-table/column-helpers';
import { formatDate } from '$lib/utils';
import { resolve } from '$app/paths';

export const entityTypeSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().optional(),
	modified_date: z.string()
});

export type EntityType = z.infer<typeof entityTypeSchema>;

export const createColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	}
): ColumnDef<EntityType>[] => [
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort, {
		meta: { grow: true }
	}),
	createSortableColumn('description', 'Description', currentSortBy, currentSortOrder, handleSort),
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => formatDate(row.original.modified_date),
		size: 140
	}),
	createActionsColumn<EntityType>('Entity', '/entity', {
		...permissions,
		editInline: true,
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
