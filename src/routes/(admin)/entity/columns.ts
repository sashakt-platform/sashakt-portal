import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn
} from '$lib/components/data-table/column-helpers';

export const entityTypeSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().optional()
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
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort),
	createSortableColumn('description', 'Description', currentSortBy, currentSortOrder, handleSort),
	createActionsColumn<EntityType>('Entity Type', '/entity', permissions)
];
