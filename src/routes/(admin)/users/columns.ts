import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn,
	createSelectionColumn
} from '$lib/components/data-table/column-helpers';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DateCell from '$lib/components/data-table/DateCell.svelte';

export const userSchema = z.object({
	id: z.number(),
	full_name: z.string(),
	email: z.string(),
	phone: z.string(),
	role_label: z.string().optional(),
	modified_date: z.string()
});

export type User = z.infer<typeof userSchema>;

export const createColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	enableSelection: boolean = false,
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	}
): ColumnDef<User>[] => [
	...(enableSelection ? [createSelectionColumn<User>()] : []),
	createSortableColumn('full_name', 'Name', currentSortBy, currentSortOrder, handleSort, {
		meta: { grow: true }
	}),
	createSortableColumn('role_label', 'Role', currentSortBy, currentSortOrder, handleSort, {
		size: 140
	}),
	createSortableColumn('email', 'Email', currentSortBy, currentSortOrder, handleSort, {
		size: 220
	}),
	createSortableColumn('phone', 'Phone', currentSortBy, currentSortOrder, handleSort, {
		size: 150
	}),
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(DateCell, { value: row.original.modified_date }),
		size: 160
	}),
	createActionsColumn<User>('User', '/users', {
		...permissions,
		editInline: true,
		deleteInline: true
	})
];
