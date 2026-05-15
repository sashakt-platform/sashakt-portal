import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import {
	createSelectionColumn,
	createSortableColumn
} from '$lib/components/data-table/column-helpers';
import TagCell from '$lib/components/data-table/TagCell.svelte';
import QuestionPreviewCell from '$lib/components/QuestionPreviewCell.svelte';
import QuestionTextCell from '$lib/components/data-table/QuestionTextCell.svelte';

export interface QuestionForSelection {
	id: number;
	question_text: string;
	question_type?: string;
	tags?: Array<{ name: string }>;
	options: Array<{ id: number; key: string; value: string }>;
	correct_answer: number[];
	latest_question_revision_id: number;
	instructions?: string;
	marking_scheme?: any;
	is_mandatory?: boolean;
	media?: any;
	matrix?: any;
}

export const createQuestionSelectionColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void
): ColumnDef<QuestionForSelection>[] => [
	createSelectionColumn<QuestionForSelection>(),
	createSortableColumn<QuestionForSelection>(
		'question_text',
		'Questions',
		currentSortBy,
		currentSortOrder,
		handleSort,
		{
			cell: ({ row }) => renderComponent(QuestionTextCell, { value: row.original.question_text }),
			meta: { grow: true }
		}
	),
	{
		id: 'answers',
		header: 'Answers',
		cell: ({ row }) => renderComponent(QuestionPreviewCell, { question: row.original }),
		size: 80,
		meta: { align: 'center' as const }
	},
	{
		accessorKey: 'tags',
		header: 'Tags',
		cell: ({ row }) => renderComponent(TagCell, { tags: row.original.tags ?? [] }),
		size: 200
	}
];
