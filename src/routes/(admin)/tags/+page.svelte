<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import Plus from '@lucide/svelte/icons/plus';
	import MessageSquareCode from '@lucide/svelte/icons/message-square-code';
	import TagTypeDialog from './TagTypeDialog.svelte';
	import TagDeleteDialog from './TagDeleteDialog.svelte';
	import { createTagManagementColumns } from './columns';
	import { useTerms } from '$lib/nomenclature';

	const { data } = $props();
	const term = useTerms();

	// Permissions
	const userCanCreate = $derived(canCreate(data.user, 'tag'));
	const userCanUpdate = $derived(canUpdate(data.user, 'tag'));
	const userCanDelete = $derived(canDelete(data.user, 'tag'));

	// Data
	const tagTypesData = $derived(data?.tagTypes?.items || []);
	const tagTypesTotalItems = $derived(data?.tagTypes?.total || 0);
	const totalPages = $derived(data?.totalPages || 0);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);
	const searchValue = $derived(data?.params?.search || '');
	const sortBy = $derived(data?.params?.sortBy || '');
	const sortOrder = $derived(data?.params?.sortOrder || 'asc');

	// Tag Type Dialog state
	let tagTypeDialogOpen = $state(false);
	let tagTypeDialogMode: 'create' | 'edit' = $state('create');
	let editingTagType: { id: number; name: string; description?: string | null } | null =
		$state(null);

	// Tag inline edit state
	let editingTagId: number | string | null = $state(null);
	let editingTagName = $state('');

	// Delete dialog state
	let deleteDialogOpen = $state(false);
	let deleteElementName = $state('');
	let deleteElementId: number | string | null = $state(null);
	let deleteElementType: 'tag' | 'tag type' = $state('tag');

	// Sorting
	function handleSort(columnId: string) {
		const url = new URL(page.url);
		const newOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
		url.searchParams.set('sort_by', columnId);
		url.searchParams.set('sort_order', newOrder);
		url.searchParams.set('page', '1');
		goto(resolve(url.pathname + url.search), { replaceState: false });
	}

	// Tag type actions
	function openCreateTagType() {
		tagTypeDialogMode = 'create';
		editingTagType = null;
		tagTypeDialogOpen = true;
	}

	function openEditTagType(tagType: { id: number | string; name: string; description?: string }) {
		tagTypeDialogMode = 'edit';
		editingTagType = {
			id: tagType.id as number,
			name: tagType.name,
			description: tagType.description
		};
		tagTypeDialogOpen = true;
	}

	function openDeleteTagType(tagType: { id: number | string; name: string }) {
		deleteElementType = 'tag type';
		deleteElementId = tagType.id;
		deleteElementName = tagType.name;
		deleteDialogOpen = true;
	}

	// Tag actions
	function startEditTag(tagId: number | string, tagName: string) {
		editingTagId = tagId;
		editingTagName = tagName;
	}

	function cancelEditTag() {
		editingTagId = null;
		editingTagName = '';
	}

	function openDeleteTag(tagId: number | string, tagName: string) {
		deleteElementType = 'tag';
		deleteElementId = tagId;
		deleteElementName = tagName;
		deleteDialogOpen = true;
	}

	// Columns
	const columns = $derived(
		createTagManagementColumns(sortBy, sortOrder, handleSort, term, {
			canEdit: userCanUpdate,
			canDelete: userCanDelete,
			canCreate: userCanCreate,
			editingTagId,
			editingTagName,
			onEditTagType: openEditTagType,
			onDeleteTagType: openDeleteTagType,
			onStartEditTag: startEditTag,
			onCancelEditTag: cancelEditTag,
			onDeleteTag: openDeleteTag
		})
	);

	const noTagTypesCreatedYet = $derived(tagTypesTotalItems === 0 && !searchValue);
</script>

<TagDeleteDialog
	bind:open={deleteDialogOpen}
	elementName={deleteElementName}
	elementId={deleteElementId}
	elementType={deleteElementType}
/>

<TagTypeDialog bind:open={tagTypeDialogOpen} mode={tagTypeDialogMode} tagType={editingTagType} />

<ListingPageLayout
	title={term('tag_management')}
	subtitle=""
	showEmptyState={noTagTypesCreatedYet}
	tooltipKey="tag-management"
>
	{#snippet headerActions()}
		{#if userCanCreate}
			<Button class="font-semibold" onclick={openCreateTagType}>
				<Plus />Create {term('tag_type')}
			</Button>
		{/if}
	{/snippet}

	{#snippet emptyState()}
		{#if noTagTypesCreatedYet}
			<div class="mx-4 mt-4 sm:mx-8 md:mx-10">
				<div
					class="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card"
				>
					<div class="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-xl">
						<MessageSquareCode class="text-primary h-7 w-7" />
					</div>
					<h2 class="mt-5 text-xl font-bold text-foreground sm:text-2xl">
						No {term('tag_types', 'lower')} yet
					</h2>
					<p class="mt-2 max-w-sm text-center text-sm text-subtle-foreground">
						Create your first {term('tag_type', 'lower')} to get started. {term('tag_types')} let you
						categorize and filter questions.
					</p>
					{#if userCanCreate}
						<div class="mt-6">
							<Button class="font-semibold" onclick={openCreateTagType}>
								<Plus />Create {term('tag_type')}
							</Button>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet filters()}
		<SearchInput
			placeholder={`Search ${term('tag_types', 'lower')} or ${term('tags', 'lower')}...`}
			value={searchValue}
			useResolve
		/>
	{/snippet}

	{#snippet content()}
		<DataTable
			data={tagTypesData}
			{columns}
			totalItems={tagTypesTotalItems}
			{totalPages}
			{currentPage}
			{pageSize}
		/>
	{/snippet}
</ListingPageLayout>
