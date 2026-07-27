import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import TruncatedTextCell from '$lib/components/data-table/TruncatedTextCell.svelte';
import { renderComponent } from '$lib/components/ui/data-table/index.js';

export const roleSchema = z.object({
	id: z.number(),
	label: z.string()
});

export type Role = z.infer<typeof roleSchema>;

export const createColumns = (): ColumnDef<Role>[] => [
	{
		accessorKey: 'label',
		header: 'Role',
		cell: ({ row }) => renderComponent(TruncatedTextCell, { value: row.original.label }),
		meta: { cellClassName: 'py-5' }
	}
];
