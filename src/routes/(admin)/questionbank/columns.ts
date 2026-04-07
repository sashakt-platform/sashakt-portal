import type { ColumnDef } from '@tanstack/table-core';
import {
	createSortableColumn,
	createActionsColumn,
	createSelectionColumn
} from '$lib/components/data-table/column-helpers';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import TruncatedTextCell from '$lib/components/data-table/TruncatedTextCell.svelte';
import DateCell from '$lib/components/data-table/DateCell.svelte';
import QuestionPreviewCell from '$lib/components/QuestionPreviewCell.svelte';
import { QUESTION_TYPE_LABELS } from '$lib/types/question';

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
	createSortableColumn('question_text', 'Questions', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(TruncatedTextCell, { value: row.original.question_text }),
		meta: { grow: true }
	}),
	{
		id: 'answers',
		header: 'Answers',
		cell: ({ row }) => {
			return renderComponent(QuestionPreviewCell, { question: row.original });
		},
		size: 80,
		meta: { align: 'center' as const }
	},
	{
		accessorKey: 'question_type',
		header: 'Question Type',
		cell: ({ row }) => {
			const type = (row.original as any).question_type;
			return type ? (QUESTION_TYPE_LABELS[type] ?? type) : '';
		},
		size: 140
	},
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(DateCell, { value: row.original.modified_date }),
		size: 160
	}),
	createActionsColumn<Question>('Question', '/questionbank/single-question', {
		...permissions,
		editInline: true
	})
];
