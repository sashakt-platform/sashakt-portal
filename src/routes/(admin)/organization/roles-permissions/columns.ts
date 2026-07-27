import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import TruncatedTextCell from '$lib/components/data-table/TruncatedTextCell.svelte';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import { DataTableActions } from '$lib/components/data-table/index.js';
import { resolve } from '$app/paths';

export const roleSchema = z.object({
	id: z.number(),
	label: z.string()
});

export type Role = z.infer<typeof roleSchema>;

export const createColumns = (permissions?: { canEdit?: boolean }): ColumnDef<Role>[] => [
	{
		accessorKey: 'label',
		header: 'Role',
		cell: ({ row }) => renderComponent(TruncatedTextCell, { value: row.original.label }),
		meta: { cellClassName: 'py-5' }
	},
	{
		id: 'actions',
		enableSorting: false,
		enableHiding: false,
		size: 60,
		cell: ({ row }) =>
			renderComponent(DataTableActions, {
				entityName: 'Role',
				editUrl: resolve(`/organization/roles-permissions/edit/${row.original.id}`),
				deleteUrl: '',
				canEdit: permissions?.canEdit ?? true,
				canDelete: false,
				editInline: true
			})
	}
];
