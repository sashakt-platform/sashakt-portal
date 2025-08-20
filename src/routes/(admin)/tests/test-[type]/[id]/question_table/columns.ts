import type { ColumnDef } from '@tanstack/table-core';

import Eye from '@lucide/svelte/icons/eye';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import Checkbox from './data-table-checkbox.svelte';
import { text } from '@sveltejs/kit';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Question = {
	latest_question_revision_id: number;
	question_text: string;
	options: string[];
	answer: number[];
	tags: string[];
};

function createFormattedTags(tags?: { name: string; tag_type?: { name: string } }[]): string {
	if (!tags || tags.length === 0) return 'None';
	return tags.map((tag) => tag.name + (tag.tag_type ? ` (${tag.tag_type.name})` : '')).join(' | ');
}

export const columns: ColumnDef<Question>[] = [
	{
		id: 'select',
		header: ({ table }) =>
			renderComponent(Checkbox, {
				checked: table.getIsAllPageRowsSelected(),
				indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
				onCheckedChange: (value) => {
					table.toggleAllPageRowsSelected(!!value);
					table.setRowSelection((old) => {
						if (!!value) {
							// Select all rows on the current page
							const newSelection = {};
							table.getRowModel().rows.forEach((row) => {
								newSelection[row.original.latest_question_revision_id] = {
									question_revision_id: row.original.latest_question_revision_id,
									question_text: row.original.question_text,
									tags: createFormattedTags(row.original.tags)
								};
							});
							return { ...old, ...newSelection }; // Merge with existing selection
						}
						// Deselect only rows on the current page
						const newSelection = { ...old };
						table.getRowModel().rows.forEach((row) => {
							delete newSelection[row.original.latest_question_revision_id];
						});
						return newSelection;
					});
				},
				'aria-label': 'Select all',
				class: 'bg-white', // Added white background
				maxSize: 1
			}),
		cell: ({ row, table }) =>
			renderComponent(Checkbox, {
				checked: row.getIsSelected(),
				id: `row-${row.original.latest_question_revision_id}`,
				onCheckedChange: (value) => {
					row.toggleSelected(!!value);
					table.setRowSelection((old) => {
						if (!!value)
							return {
								...old,
								[row.original.latest_question_revision_id]: {
									question_revision_id: row.original.latest_question_revision_id,
									question_text: row.original.question_text,
									tags: createFormattedTags(row.original.tags)
								}
							};
						// Return the previous state without the current row when unchecked
						const newSelection = { ...old };
						delete newSelection[row.original.latest_question_revision_id];
						return newSelection;
					});
				},
				'aria-label': 'Select row'
			}),
		enableSorting: false,
		enableHiding: false,
		size: -1,
		maxSize: 1
	},

	{
		accessorKey: 'question_text',
		header: 'Question',
		size: 200,
		maxSize: 2
	},
	{
		accessorKey: 'options',
		header: 'Options',
		cell: ({ row }) => {
			return row.original.options;
		},
		size: 1,
		maxSize: 1,
		enableHiding: true
	},
	{
		accessorKey: 'correct_answer',
		header: 'Answers',
		cell: ({ row }) => {
			// You can pass whatever you need from `row.original` to the component
			return renderComponent(Eye, { class: 'text-gray-400 border rounded-4xl' });
		},
		size: -1,
		maxSize: 1
	},
	{
		accessorKey: 'tags',
		header: 'Tags',
		cell: ({ row }) => {
			// Extract tag names from the JSON structure
			const tags = row.original.tags;
			return tags && tags.length ? createFormattedTags(tags) : 'None';
		},
		size: 1,
		maxSize: 1
	}
];
