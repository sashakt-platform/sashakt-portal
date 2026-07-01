import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DateCell from '$lib/components/data-table/DateCell.svelte';
import ActiveStatusBadge from '$lib/components/data-table/ActiveStatusBadge.svelte';
import TruncatedTextCell from '$lib/components/data-table/TruncatedTextCell.svelte';

export const providerSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().optional().nullable(),
	provider_type: z.string(),
	is_active: z.boolean(),
	created_date: z.string(),
	modified_date: z.string()
});

export type Provider = z.infer<typeof providerSchema>;

export const createColumns = (): ColumnDef<Provider>[] => [
	{
		accessorKey: 'name',
		header: 'NAME',
		cell: ({ row }) => renderComponent(TruncatedTextCell, { value: row.original.name }),
		meta: { grow: true }
	},
	{
		accessorKey: 'provider_type',
		header: 'Type',
		cell: ({ row }) => renderComponent(TruncatedTextCell, { value: row.original.provider_type }),
		size: 160
	},
	{
		accessorKey: 'description',
		header: 'Description',
		cell: ({ row }) =>
			renderComponent(TruncatedTextCell, { value: row.original.description ?? '' }),
		size: 220,
		meta: { cellClassName: 'max-w-[220px] overflow-hidden' }
	},
	{
		accessorKey: 'is_active',
		header: 'Status',
		cell: ({ row }) => renderComponent(ActiveStatusBadge, { active: row.original.is_active }),
		size: 130,
		meta: { align: 'center' }
	},
	{
		accessorKey: 'modified_date',
		header: 'Updated',
		cell: ({ row }) => renderComponent(DateCell, { value: row.original.modified_date }),
		size: 160
	}
];
