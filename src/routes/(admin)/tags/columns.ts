import type { ColumnDef } from '@tanstack/table-core';
import { createSortableColumn } from '$lib/components/data-table/column-helpers';
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import TagTypeCell from './TagTypeCell.svelte';
import TagsCell from './TagsCell.svelte';

export interface TagType {
	id: number | string;
	name: string;
	description?: string;
	tags: { id: number | string; name: string }[];
}

export const createTagManagementColumns = (
	currentSortBy: string,
	currentSortOrder: string,
	handleSort: (columnId: string) => void,
	callbacks: {
		canEdit: boolean;
		canDelete: boolean;
		canCreate: boolean;
		editingTagId: number | string | null;
		editingTagName: string;
		onEditTagType: (tagType: TagType) => void;
		onDeleteTagType: (tagType: TagType) => void;
		onStartEditTag: (tagId: number | string, tagName: string) => void;
		onCancelEditTag: () => void;
		onDeleteTag: (tagId: number | string, tagName: string) => void;
	}
): ColumnDef<TagType>[] => [
	createSortableColumn<TagType>('name', 'Tag Types', currentSortBy, currentSortOrder, handleSort, {
		cell: ({ row }) =>
			renderComponent(TagTypeCell, {
				tagType: row.original,
				canEdit: callbacks.canEdit,
				canDelete: callbacks.canDelete,
				onEdit: callbacks.onEditTagType,
				onDelete: callbacks.onDeleteTagType
			}),
		size: 600
	}),
	{
		id: 'tags',
		header: 'Tags',
		enableSorting: false,
		cell: ({ row }) =>
			renderComponent(TagsCell, {
				tags: row.original.tags || [],
				tagTypeId: row.original.id,
				canCreate: callbacks.canCreate,
				canEdit: callbacks.canEdit,
				canDelete: callbacks.canDelete,
				editingTagId: callbacks.editingTagId,
				editingTagName: callbacks.editingTagName,
				onStartEdit: callbacks.onStartEditTag,
				onCancelEdit: callbacks.onCancelEditTag,
				onDeleteTag: callbacks.onDeleteTag
			}),
		meta: { grow: true }
	}
];
