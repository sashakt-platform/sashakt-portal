import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn
} from '$lib/components/data-table/column-helpers';

export const userSchema = z.object({
	id: z.number(),
	full_name: z.string(),
	email: z.string(),
	phone: z.string()
});

export type User = z.infer<typeof userSchema>;

export const createColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void
): ColumnDef<User>[] => [
	createSortableColumn('full_name', 'Name', currentSortBy, currentSortOrder, handleSort),
	createSortableColumn('email', 'Email', currentSortBy, currentSortOrder, handleSort),
	createSortableColumn('phone', 'Phone', currentSortBy, currentSortOrder, handleSort),
	createActionsColumn<User>('User', '/users')
];
