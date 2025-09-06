import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import { DataTableActions, DataTableSortButton } from './index.js';
import { Checkbox } from '$lib/components/ui/checkbox/index.js';

/**
 *  Function to create a sortable column with the given configuration
 */
export const createSortableColumn = <T>(
	accessorKey: keyof T,
	title: string,
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	options?: Partial<ColumnDef<T>>
): ColumnDef<T> => ({
	accessorKey: accessorKey as string,
	header: () => {
		return renderComponent(DataTableSortButton, {
			title,
			columnId: accessorKey as string,
			currentSortBy,
			currentSortOrder,
			handleSort
		});
	},
	...options
});

/**
 * Function to create an actions column
 */
export const createActionsColumn = <T extends { id: string | number }>(
	entityName: string,
	baseUrl: string
): ColumnDef<T> => ({
	id: 'actions',
	enableSorting: false,
	enableHiding: false,
	cell: ({ row }) => {
		return renderComponent(DataTableActions, {
			id: row.original.id,
			entityName,
			editUrl: `${baseUrl}/edit/${row.original.id}`,
			deleteUrl: `${baseUrl}/delete/${row.original.id}?/delete`
		});
	}
});

/**
 * Function to create a selection column with checkboxes
 */
export const createSelectionColumn = <T>(): ColumnDef<T> => ({
	id: 'select',
	header: ({ table }) =>
		renderComponent(Checkbox, {
			checked: table.getIsAllPageRowsSelected(),
			indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
			onCheckedChange: (value: boolean) => table.toggleAllPageRowsSelected(!!value),
			'aria-label': 'Select all'
		}),
	cell: ({ row }) =>
		renderComponent(Checkbox, {
			checked: row.getIsSelected(),
			onCheckedChange: (value: boolean) => {
				row.toggleSelected(!!value);
			},
			'aria-label': 'Select row'
		}),
	enableSorting: false,
	enableHiding: false,
	size: 50
});
