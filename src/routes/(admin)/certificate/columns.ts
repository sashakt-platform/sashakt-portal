import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn
} from '$lib/components/data-table/column-helpers';
import { formatDate } from '$lib/utils';
export const certificateSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().optional().nullable(),
	url: z.string(),
	modified_date: z.string(),
	is_active: z.boolean()
});

export type Certificate = z.infer<typeof certificateSchema>;

export const createColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	}
): ColumnDef<Certificate>[] => [
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort),
	createSortableColumn('is_active', 'Active', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => (row.original.is_active ? 'Yes' : 'No')
	}),
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => formatDate(row.original.modified_date)
	}),
	createActionsColumn<Certificate>('Certificate', '/certificate', permissions)
];
