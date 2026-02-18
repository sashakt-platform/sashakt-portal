import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn,
	createSelectionColumn,
	formatTags
} from '$lib/components/data-table/column-helpers';
import { formatDate } from '$lib/utils';
import Eye from '@lucide/svelte/icons/eye';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import { TruncatedCell } from '$lib/components/data-table/index.js';

export interface Question {
	id: string;
	question_text: string;
	tags?: Array<{ name: string; tag_type?: { name: string } }>;
	modified_date: string;
	options: Array<{ id: string; key: string; value: string }>;
	correct_answer: string[];
}

export const createQuestionColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	enableSelection: boolean = false,
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	}
): ColumnDef<Question>[] => [
	...(enableSelection ? [createSelectionColumn<Question>()] : []),
	createSortableColumn('question_text', 'Name', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(TruncatedCell, { text: row.original.question_text })
	}),
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
		cell: ({ row }) => renderComponent(TruncatedCell, { text: formatTags(row.original.tags ?? []) })
	},
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => formatDate(row.original.modified_date)
	}),
	createActionsColumn<Question>('Question', '/questionbank/single-question', permissions)
];
