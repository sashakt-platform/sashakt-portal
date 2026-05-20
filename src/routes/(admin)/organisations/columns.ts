import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import { createSortableColumn } from '$lib/components/data-table/column-helpers';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DateCell from '$lib/components/data-table/DateCell.svelte';
import ActiveStatusBadge from '$lib/components/data-table/ActiveStatusBadge.svelte';
import ManageButton from './ManageButton.svelte';

export const organisationSchema = z.object({
	id: z.number(),
	name: z.string(),
	shortcode: z.string(),
	users_count: z.number().optional(),
	is_active: z.boolean(),
	modified_date: z.string()
});

export type Organisation = z.infer<typeof organisationSchema>;

export const createColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void
): ColumnDef<Organisation>[] => [
	createSortableColumn('name', 'Organisations', currentSortBy, currentSortOrder, handleSort, {
		meta: { grow: true }
	}),
	createSortableColumn('shortcode', 'Shortcode', currentSortBy, currentSortOrder, handleSort, {
		size: 160
	}),
	{
		accessorKey: 'users_count',
		header: 'Users',
		size: 100,
		cell: ({ row }) => (row.original.users_count ?? '—') as string
	},
	{
		accessorKey: 'is_active',
		header: 'Status',
		size: 150,
		cell: ({ row }) => renderComponent(ActiveStatusBadge, { active: row.original.is_active })
	},
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(DateCell, { value: row.original.modified_date }),
		size: 170
	}),
	{
		id: 'manage',
		enableSorting: false,
		enableHiding: false,
		size: 130,
		cell: ({ row }) => renderComponent(ManageButton, { shortcode: row.original.shortcode })
	}
];
