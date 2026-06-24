import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DateCell from '$lib/components/data-table/DateCell.svelte';
import CandidateStatusBadge from '$lib/components/data-table/CandidateStatusBadge.svelte';
import type { CandidateStatus } from '$lib/types/test.js';

export interface CandidateResponse {
	candidate_uuid: string;
	status: CandidateStatus;
	obtained_marks: number | null;
	start_time: string | null;
	end_time: string | null;
	time_taken_seconds: number | null;
}

export const createResponseColumns = (): ColumnDef<CandidateResponse>[] => [
	{
		accessorKey: 'candidate_uuid',
		header: 'Candidate',
		meta: { grow: true }
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) =>
			renderComponent(CandidateStatusBadge, { status: row.original.status }),
		size: 150
	},
	{
		accessorKey: 'obtained_marks',
		header: 'Marks',
		cell: ({ row }) => row.original.obtained_marks ?? '—',
		size: 100
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
	}
];
