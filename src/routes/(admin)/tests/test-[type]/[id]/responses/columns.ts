import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DateCell from '$lib/components/data-table/DateCell.svelte';
import CandidateStatusBadge from '$lib/components/data-table/CandidateStatusBadge.svelte';
import { DataTableActions } from '$lib/components/data-table/index.js';
import { createSelectionColumn } from '$lib/components/data-table/column-helpers';

type CandidateStatus = 'submitted' | 'not_submitted';
export interface CandidateResult {
	correct_answer: number;
	incorrect_answer: number;
	mandatory_not_attempted: number;
	optional_not_attempted: number;
	total_questions: number;
	marks_obtained: number | null;
	marks_maximum: number | null;
	certificate_download_url: string | null;
}

export interface CandidateResponse {
	candidate_id: number;
	candidate_uuid: string;
	status: CandidateStatus;
	start_time: string | null;
	end_time: string | null;
	time_taken_seconds: number | null;
	result: CandidateResult | null;
}

export const createResponseColumns = (
	onDelete?: (candidateId: number) => void,
	canDelete = true,
	enableSelection = false
): ColumnDef<CandidateResponse>[] => [
	...(enableSelection ? [createSelectionColumn<CandidateResponse>()] : []),
	{
		accessorKey: 'candidate_uuid',
		header: 'Candidate',
		meta: { grow: true }
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => renderComponent(CandidateStatusBadge, { status: row.original.status }),
		size: 150
	},
	{
		id: 'marks',
		header: 'Marks',
		cell: ({ row }) => {
			const result = row.original.result;
			if (!result || result.marks_obtained == null) return '—';
			if (result.marks_maximum == null) return `${result.marks_obtained}`;
			return `${result.marks_obtained} / ${result.marks_maximum}`;
		},
		size: 130
	},
	{
		accessorKey: 'start_time',
		header: 'Start Time',
		cell: ({ row }) => renderComponent(DateCell, { value: row.original.start_time ?? '' }),
		size: 180
	},
	{
		accessorKey: 'end_time',
		header: 'End Time',
		cell: ({ row }) => renderComponent(DateCell, { value: row.original.end_time ?? '' }),
		size: 180
	},
	{
		accessorKey: 'time_taken_seconds',
		header: 'Time Taken',
		cell: ({ row }) => {
			const seconds = row.original.time_taken_seconds;
			if (seconds == null) return '—';
			const mins = Math.floor(seconds / 60);
			const secs = seconds % 60;
			return `${mins}m ${secs}s`;
		},
		size: 120
	},
	...(canDelete
		? [
				{
					id: 'actions',
					enableSorting: false,
					enableHiding: false,
					size: 60,
					cell: ({ row }: { row: { original: CandidateResponse } }) => {
						return renderComponent(DataTableActions, {
							entityName: 'Candidate',
							editUrl: '',
							deleteUrl: '',
							canEdit: false,
							canDelete: true,
							deleteInline: true,
							onDelete: () => onDelete?.(row.original.candidate_id)
						});
					}
				} satisfies ColumnDef<CandidateResponse>
			]
		: [])
];
