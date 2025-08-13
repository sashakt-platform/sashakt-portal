import type { ColumnDef } from '@tanstack/table-core';
import { createSortableColumn } from '$lib/components/data-table/column-helpers';
import { formatDate } from '$lib/utils';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import { DataTableActions } from '$lib/components/data-table/index.js';

export interface Test {
	id: string;
	name: string;
	tags?: Array<{ name: string }>;
	modified_date: string;
	is_template: boolean;
	link?: string;
}

export const createTestColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	currentPage: number,
	pageSize: number,
	isTemplate: boolean,
	testTakerUrl: string,
	onDelete: (testId: string) => void
): ColumnDef<Test>[] => [
	createSortableColumn('name', 'Name', currentSortBy, currentSortOrder, handleSort),
	{
		accessorKey: 'tags',
		header: 'Tags',
		cell: ({ row }) => {
			const tags = row.original.tags;
			if (tags && tags.length > 0) {
				return tags.map((tag) => tag.name).join(', ');
			}
			return '';
		}
	},
	createSortableColumn('modified_date', 'Updated', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) => formatDate(row.original.modified_date)
	}),
	{
		id: 'actions',
		header: '',
		enableSorting: false,
		enableHiding: false,
		cell: ({ row }) => {
			const test = row.original;
			const baseUrl = `/tests/test-${isTemplate ? 'template' : 'session'}`;

			// Create custom actions array
			const customActions = [];

			// Add template-specific actions
			if (isTemplate) {
				customActions.push({
					label: 'Make a Test',
					href: `/tests/test-session/convert/?template_id=${test.id}`,
					icon: 'file-plus'
				});
			} else {
				// Add session-specific actions
				customActions.push({
					label: 'Clone',
					href: `${baseUrl}/${test.id}/?/clone`,
					icon: 'copy',
					method: 'POST'
				});

				if (test.link) {
					customActions.push({
						label: 'Conduct Test',
						action: () => window.open(`${testTakerUrl}/test/${test.link}`, '_blank'),
						icon: 'external-link'
					});
				}
			}

			return renderComponent(DataTableActions, {
				id: test.id,
				entityName: isTemplate ? 'Test Template' : 'Test Session',
				editUrl: `${baseUrl}/${test.id}/`,
				deleteUrl: `${baseUrl}/${test.id}?/delete`,
				customActions,
				onDelete: () => onDelete(test.id)
			});
		}
	}
];
