import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import {
	createSelectionColumn,
	createSortableColumn
} from '$lib/components/data-table/column-helpers';
import Eye from '@lucide/svelte/icons/eye';

export interface QuestionForSelection {
	id: number;
	question_text: string;
	tags?: Array<{ name: string }>;
	options: Array<{ id: number; key: string; value: string }>;
	correct_answer: number[];
	latest_question_revision_id: number;
}

export const createQuestionSelectionColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void
): ColumnDef<QuestionForSelection>[] => [
	createSelectionColumn<QuestionForSelection>(),
	createSortableColumn<QuestionForSelection>(
		'question_text',
		'Name',
		currentSortBy,
		currentSortOrder,
		handleSort,
		{ size: 80 }
	),
	{
		id: 'answers',
		header: 'Answers',
		cell: ({ row }) => {
			return renderComponent(Eye, { class: 'text-gray-400 cursor-pointer' });
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
			return '';
		},
		size: 200
	}
];
