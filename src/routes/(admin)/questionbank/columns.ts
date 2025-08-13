import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn
} from '$lib/components/data-table/column-helpers';
import { formatDate } from '$lib/utils';

export interface Question {
	id: string;
	question_text: string;
	tags?: Array<{ name: string }>;
	modified_date: string;
	options: Array<{ id: string; key: string; value: string }>;
	correct_answer: string[];
}

export const createQuestionColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	currentPage: number,
	pageSize: number
): ColumnDef<Question>[] => [
	{
		id: 'expand',
		header: '',
		cell: ({ row }) => {
			const isExpanded = row.getIsExpanded();
			const chevron = isExpanded ? '▼' : '▶';

			return chevron;
		},
		size: 40
	},
	createSortableColumn('question_text', 'Name', currentSortBy, currentSortOrder, handleSort),
	{
		accessorKey: 'tags',
		header: 'Tags',
		cell: ({ row }) => {
			const tags = row.original.tags;
			if (tags && tags.length > 0) {
				return tags.map((tag) => tag.name).join(', ');
			}
			return 'None';
		}
	},
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => formatDate(row.original.modified_date)
	}),
	createActionsColumn<Question>('Question', '/questionbank/single-question')
];
