import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn
} from '$lib/components/data-table/column-helpers';

export const entitySchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().optional()
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
	createSortableColumn('description', 'Description', currentSortBy, currentSortOrder, handleSort),
	createActionsColumn<Entity>('Entity', `/entity/view/${entityTypeId}`, permissions)
];
