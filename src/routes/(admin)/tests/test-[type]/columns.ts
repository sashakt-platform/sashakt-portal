import type { ColumnDef } from '@tanstack/table-core';
import { toast } from 'svelte-sonner';
import {
	createSortableColumn,
	createSelectionColumn
} from '$lib/components/data-table/column-helpers';
import { downloadQRCode } from '$lib/utils';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DateCell from '$lib/components/data-table/DateCell.svelte';
import { DataTableActions } from '$lib/components/data-table/index.js';
import TagCell from '$lib/components/data-table/TagCell.svelte';
import TruncatedTextCell from '$lib/components/data-table/TruncatedTextCell.svelte';
import TestStatusBadge from '$lib/components/data-table/TestStatusBadge.svelte';
import { getUserDistrict, isOwnEntity, type User } from '$lib/utils/permissions.js';
import { resolve } from '$app/paths';
import type { NomenclatureKey } from '$lib/nomenclature';
import type { TestStatus } from '$lib/types/test.js';

export interface Test {
	id: string;
	name: string;
	created_by_id?: string | number | null;
	tags?: Array<{ name: string; tag_type?: { name: string } }>;
	modified_date: string;
	is_template: boolean;
	link?: string;
	states?: Array<{ id: string | number; name: string }>;
	districts?: Array<{ id: string | number; name: string }>;
	status: TestStatus;
}

export const createTestColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	currentPage: number,
	pageSize: number,
	isTemplate: boolean,
	testTakerUrl: string,
	onDelete: (testId: string) => void,
	term: (key: NomenclatureKey) => string,
	permissions?: {
		canEdit?: boolean;
		canDelete?: boolean;
	},
	user?: User | null,
	onViewReport?: (testId: string) => void,
	enableSelection: boolean = false
): ColumnDef<Test>[] => [
	...(enableSelection ? [createSelectionColumn<Test>()] : []),
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(TruncatedTextCell, { value: row.original.name }),
		meta: { grow: true }
	}),
	{
		accessorKey: 'tags',
		header: term('tags'),
		cell: ({ row }) => renderComponent(TagCell, { tags: row.original.tags ?? [] }),
		size: 200,
		meta: { headerClassName: 'min-w-[200px]', cellClassName: 'min-w-[200px]' }
	},
	...(!isTemplate
		? [
				{
					accessorKey: 'status',
					header: 'Status',
					cell: ({ row }: { row: { original: Test } }) =>
						renderComponent(TestStatusBadge, { status: row.original.status }),
					size: 100,
					meta: { align: 'center' }
				} satisfies ColumnDef<Test>
			]
		: []),
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => renderComponent(DateCell, { value: row.original.modified_date }),
		size: 160
	}),
	{
		id: 'actions',
		size: 240,
		header: '',
		enableSorting: false,
		enableHiding: false,
		cell: ({ row }) => {
			const test = row.original;
			const baseUrl = `/tests/test-${isTemplate ? 'template' : 'session'}`;

			// Create custom actions array
			const customActions = [];

			customActions.push({
				label: 'Duplicate',
				href: resolve(`${baseUrl}/${test.id}?/clone`),
				icon: 'copy',
				method: 'POST'
			});

			// Add template-specific actions
			if (isTemplate) {
				customActions.push({
					label: 'Make a Test',
					href: resolve(`/tests/test-session/convert/?template_id=${test.id}`),
					icon: 'null',
					inline: true
				});
			} else {
				// Add session-specific actions

				customActions.push({
					label: `Copy ${term('test')} Link`,
					action: async () => {
						try {
							// ClipboardItem with a Promise preserves the user gesture context
							// across the async fetch, avoiding NotAllowedError
							await navigator.clipboard.write([
								new ClipboardItem({
									'text/plain': fetch(`/api/test-link?test_id=${test.id}`)
										.then((res) => {
											if (!res.ok) throw new Error(`${res.status}`);
											return res.json();
										})
										.then(
											(data) =>
												new Blob([`${testTakerUrl}/test/${data.uuid}`], {
													type: 'text/plain'
												})
										)
								})
							]);
							toast.success(`${term('test')} link copied`);
						} catch (error) {
							console.error('Failed to copy test link:', error);
							toast.error('Failed to copy test link');
						}
					},
					icon: 'copy-link'
				});

				customActions.push({
					label: 'Download QR',
					action: async () => {
						const fileName = `qr-${test.name.replace(/\s+/g, '-').toLowerCase()}`;
						const districts = getUserDistrict(user ?? null);
						const districtName = districts?.map((d) => d.name).join(', ');
						try {
							const res = await fetch(`/api/test-link?test_id=${test.id}`);
							if (!res.ok) throw new Error('Failed to fetch link');
							const data = await res.json();
							await downloadQRCode(`${testTakerUrl}/test/${data.uuid}`, fileName, [
								{ label: term('test'), value: test.name },
								{ label: 'District', value: districtName ?? '' }
							]);
						} catch (error) {
							console.error('Failed to download QR code:', error);
							toast.error('Failed to download QR code');
						}
					},
					icon: 'null',
					inline: true
				});

				customActions.push({
					label: 'View Report',
					action: () => onViewReport?.(test.id),
					icon: 'chart-column-decreasing'
				});
			}

			const isOwner = isOwnEntity(user ?? null, test.created_by_id);

			return renderComponent(DataTableActions, {
				id: test.id,
				entityName: isTemplate ? term('test_template') : term('test'),
				editUrl: resolve(`${baseUrl}/${test.id}/`),
				deleteUrl: resolve(`${baseUrl}/${test.id}?/delete`),
				customActions,
				onDelete: () => onDelete(test.id),
				canEdit: isOwner,
				canDelete: isOwner,
				editInline: true
			});
		}
	}
];
