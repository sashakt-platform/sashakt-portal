import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn
} from '$lib/components/data-table/column-helpers';
import { formatDate } from '$lib/utils';

export interface Tag {
	id: string;
	name: string;
	tag_type?: {
		name: string;
	};
	modified_date: string;
}

export const createTagsColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void
): ColumnDef<Tag>[] => [
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort),
	{
		accessorKey: 'tag_type',
		header: 'Type',
		cell: ({ row }) => row.original.tag_type?.name || 'None'
	},
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => formatDate(row.original.modified_date)
	}),
	createActionsColumn<Tag>('Tag', '/tags/tag')
];
