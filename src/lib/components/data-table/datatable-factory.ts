import type { ColumnDef } from '@tanstack/table-core';
import { createSortableColumn, createActionsColumn } from './column-helpers.js';

export interface ColumnConfig<T> {
	key: keyof T;
	title: string;
	sortable?: boolean;
}

export interface DataTableConfig<T extends { id: string | number }> {
	columns: ColumnConfig<T>[];
	entityName: string;
	baseUrl: string;
}

/**
 * Function to create column configuration for a datatable
 */
export const createDataTableColumns = <T extends { id: string | number }>(
	config: DataTableConfig<T>
) => (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void
): ColumnDef<T>[] => {
	const columns: ColumnDef<T>[] = config.columns.map((col) => {
		if (col.sortable !== false) {
			return createSortableColumn(
				col.key,
				col.title,
				currentSortBy,
				currentSortOrder,
				handleSort
			);
		} else {
			return {
				accessorKey: col.key as string,
				header: col.title
			};
		}
	});

	// add actions column
	columns.push(createActionsColumn<T>(config.entityName, config.baseUrl));

	return columns;
};
