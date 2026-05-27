import { z } from 'zod';
import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn,
	createSelectionColumn
} from '$lib/components/data-table/column-helpers';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DateCell from '$lib/components/data-table/DateCell.svelte';
import ActiveStatusBadge from '$lib/components/data-table/ActiveStatusBadge.svelte';
import TruncatedTextCell from '$lib/components/data-table/TruncatedTextCell.svelte';
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
	enableSelection: boolean = false,
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	}
): ColumnDef<Certificate>[] => [
	...(enableSelection ? [createSelectionColumn<Certificate>()] : []),
	createSortableColumn('name', 'NAME', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(TruncatedTextCell, { value: row.original.name }),
		meta: { grow: true }
	}),
	createSortableColumn('description', 'Description', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) =>
			renderComponent(TruncatedTextCell, { value: row.original.description ?? '' }),
		size: 220,
		meta: { cellClassName: 'max-w-[220px] overflow-hidden' }
	}),
	{
		accessorKey: 'is_active',
		header: 'Status',
		enableSorting: false,
		cell: ({ row }) => renderComponent(ActiveStatusBadge, { active: row.original.is_active }),
		size: 130,
		meta: { align: 'center' }
	},
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(DateCell, { value: row.original.modified_date }),
		size: 160
	}),
	createActionsColumn<Certificate>('Certificate', '/certificate', {
		...permissions,
		editInline: true,
		deleteInline: true
	})
];
