import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import { DataTableActions, DataTableSortButton, DataTableExpandButton } from './index.js';

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
	header: ({ column }) => {
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
 * Function to create an expand/collapse column for expandable rows
 */
export const createExpandColumn = <T>(): ColumnDef<T> => ({
	id: 'expand',
	header: '',
	size: 40,
	enableSorting: false,
	enableHiding: false,
	cell: ({ row }) => {
		if (!row.getCanExpand()) return '';

		return renderComponent(DataTableExpandButton, {
			isExpanded: row.getIsExpanded(),
			canExpand: row.getCanExpand(),
			onToggle: () => {
				row.toggleExpanded();
			}
		});
	}
});
