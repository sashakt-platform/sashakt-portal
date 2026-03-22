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
	phone: z.string(),
	role_label: z.string().optional()
});

export type User = z.infer<typeof userSchema>;

export const createColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	}
): ColumnDef<User>[] => [
	createSortableColumn('full_name', 'Name', currentSortBy, currentSortOrder, handleSort, {
		meta: { grow: true }
	}),
	createSortableColumn('email', 'Email', currentSortBy, currentSortOrder, handleSort, {
		size: 220
	}),
	createSortableColumn('phone', 'Phone', currentSortBy, currentSortOrder, handleSort, {
		size: 150
	}),
	createSortableColumn('role_label', 'Role', currentSortBy, currentSortOrder, handleSort, {
		size: 140
	}),
	createActionsColumn<User>('User', '/users', { ...permissions, editInline: true })
];
