import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn
} from '$lib/components/data-table/column-helpers';
import { formatDate } from '$lib/utils';
import Eye from '@lucide/svelte/icons/eye';
import { renderComponent } from '$lib/components/ui/data-table/index.js';

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
	createSortableColumn('question_text', 'Name', currentSortBy, currentSortOrder, handleSort),
	{
		id: 'answers',
		header: 'Answers',
		cell: ({ row }) => {
			return renderComponent(Eye, { class: 'text-gray-400' });
		},
		size: 80
	},
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
