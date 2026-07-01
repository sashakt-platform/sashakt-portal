import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DateCell from '$lib/components/data-table/DateCell.svelte';
import ActiveStatusBadge from '$lib/components/data-table/ActiveStatusBadge.svelte';
import TruncatedTextCell from '$lib/components/data-table/TruncatedTextCell.svelte';

export const providerSchema = z.object({
	provider_type: z.string(),
	name: z.string(),
	description: z.string().optional().nullable(),
	is_active: z.boolean(),
	id: z.number(),
	created_date: z.string(),
	modified_date: z.string()
});

export const organizationProviderSchema = z.object({
	id: z.number(),
	organization_id: z.number(),
	provider_id: z.number(),
	is_enabled: z.boolean(),
	last_sync_timestamp: z.string().nullable(),
	created_date: z.string(),
	modified_date: z.string(),
	provider: providerSchema
});

export type OrganizationProvider = z.infer<typeof organizationProviderSchema>;

export const createColumns = (): ColumnDef<OrganizationProvider>[] => [
	{
		accessorKey: 'provider.name',
		header: 'NAME',
		cell: ({ row }) => renderComponent(TruncatedTextCell, { value: row.original.provider.name }),
		meta: { grow: true }
	},
	{
		accessorKey: 'provider.provider_type',
		header: 'Type',
		cell: ({ row }) =>
			renderComponent(TruncatedTextCell, { value: row.original.provider.provider_type }),
		size: 160
	},
	{
		accessorKey: 'provider.description',
		header: 'Description',
		cell: ({ row }) =>
			renderComponent(TruncatedTextCell, { value: row.original.provider.description ?? '' }),
		size: 220,
		meta: { cellClassName: 'max-w-[220px] overflow-hidden' }
	},
	{
		accessorKey: 'is_enabled',
		header: 'Status',
		cell: ({ row }) => renderComponent(ActiveStatusBadge, { active: row.original.is_enabled }),
		size: 130,
		meta: { align: 'center' }
	},
	{
		accessorKey: 'modified_date',
		header: 'Updated',
		cell: ({ row }) => renderComponent(DateCell, { value: row.original.modified_date }),
		size: 160
	},
	{
		accessorKey: 'last_sync_timestamp',
		header: 'Last Synced',
		cell: ({ row }) =>
			row.original.last_sync_timestamp
				? renderComponent(DateCell, { value: row.original.last_sync_timestamp })
				: 'Never',
		size: 160
	}
];
