import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DateCell from '$lib/components/data-table/DateCell.svelte';
import CandidateStatusBadge from '$lib/components/data-table/CandidateStatusBadge.svelte';
import { DataTableActions } from '$lib/components/data-table/index.js';
import { createSelectionColumn, createSortableColumn } from '$lib/components/data-table/column-helpers';

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
	form_response?: Record<string, string | null> | null;
}

export const createResponseColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	onDelete?: (candidateId: number) => void,
	canDelete = true,
	enableSelection = false,
	onShowResponses?: (candidate: CandidateResponse) => void,
	downloadingCandidateIds: Set<number> = new Set(),
	onDownloadCertificate?: (
		candidateId: number,
		certificateDownloadUrl: string,
		candidateUuid: string
	) => void
): ColumnDef<CandidateResponse>[] => [
	...(enableSelection ? [createSelectionColumn<CandidateResponse>()] : []),
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
	createSortableColumn(
		'status',
		'Status',
		currentSortBy,
		currentSortOrder,
		handleSort,
		{
			cell: ({ row }) => renderComponent(CandidateStatusBadge, { status: row.original.status }),
			size: 150
		}
	),
	createSortableColumn(
		'start_time',
		'Start Time',
		currentSortBy,
		currentSortOrder,
		handleSort,
		{
			cell: ({ row }) => renderComponent(DateCell, { value: row.original.start_time ?? '' }),
			size: 180
		}
	),
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
						const certificateUrl = row.original.result?.certificate_download_url;
						const hasFormResponse = row.original.form_response != null;

						const customActions = [];

						if (certificateUrl) {
							customActions.push({
								label: 'Download Certificate',
								icon: 'download',
								inline: true,
								iconOnly: true,
								loading: downloadingCandidateIds.has(row.original.candidate_id),
								action: () =>
									onDownloadCertificate?.(
										row.original.candidate_id,
										certificateUrl,
										row.original.candidate_uuid
									)
							});
						}

						if (hasFormResponse) {
							customActions.push({
								label: 'Show Responses',
								icon: 'clipboard-list',
								inline: true,
								iconOnly: true,
								action: () => onShowResponses?.(row.original)
							});
						}
						return renderComponent(DataTableActions, {
							entityName: 'Candidate',
							editUrl: '',
							deleteUrl: '',
							canEdit: false,
							canDelete: true,
							deleteInline: true,
							customActions,
							onDelete: () => onDelete?.(row.original.candidate_id)
						});
					}
				} satisfies ColumnDef<CandidateResponse>
			]
		: [])
];
