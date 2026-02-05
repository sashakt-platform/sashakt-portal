<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createTagsColumns } from './tags-columns';
	import { createTagTypesColumns } from './tag-types-columns';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import Input from '$lib/components/ui/input/input.svelte';
	import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';

	const { data } = $props();
	let deleteAction: string | null = $state(null);
	let tagsSearchTimeout: ReturnType<typeof setTimeout>;
	let tagTypesSearchTimeout: ReturnType<typeof setTimeout>;

	// Tags related fields
	const tagsData = $derived(data?.tags?.items || []);
	const tagsTotalItems = $derived(data?.tags?.total || 0);
	const tagsTotalPages = $derived(data?.tagsTotalPages || 0);
	const tagsCurrentPage = $derived(data?.tagsParams?.page || 1);
	const tagsPageSize = $derived(data?.tagsParams?.size || DEFAULT_PAGE_SIZE);
	const tagsSearch = $derived(data?.tagsParams?.search || '');
	const tagsSortBy = $derived(data?.tagsParams?.sortBy || '');
	const tagsSortOrder = $derived(data?.tagsParams?.sortOrder || 'asc');

	// Tag Types related fields
	const tagTypesData = $derived(data?.tagTypes?.items || []);
	const tagTypesTotalItems = $derived(data?.tagTypes?.total || 0);
	const tagTypesTotalPages = $derived(data?.tagTypesTotalPages || 0);
	const tagTypesCurrentPage = $derived(data?.tagTypesParams?.page || 1);
	const tagTypesPageSize = $derived(data?.tagTypesParams?.size || DEFAULT_PAGE_SIZE);
	const tagTypesSearch = $derived(data?.tagTypesParams?.search || '');
	const tagTypesSortBy = $derived(data?.tagTypesParams?.sortBy || '');
	const tagTypesSortOrder = $derived(data?.tagTypesParams?.sortOrder || 'asc');

	function handleTagsSort(columnId: string) {
		const url = new URL(page.url);
		const newSortOrder = tagsSortBy === columnId && tagsSortOrder === 'asc' ? 'desc' : 'asc';

		url.searchParams.set('tagsSortBy', columnId);
		url.searchParams.set('tagsSortOrder', newSortOrder);
		url.searchParams.set('tagsPage', '1');

		goto(url.toString(), { replaceState: false });
	}

	function handleTagTypesSort(columnId: string) {
		const url = new URL(page.url);
		const newSortOrder =
			tagTypesSortBy === columnId && tagTypesSortOrder === 'asc' ? 'desc' : 'asc';

		url.searchParams.set('tagTypesSortBy', columnId);
		url.searchParams.set('tagTypesSortOrder', newSortOrder);
		url.searchParams.set('tagTypesPage', '1');

		goto(url.toString(), { replaceState: false });
	}

	// get active tab from URL parameter
	const activeTab = $derived(page.url.searchParams.get('tab') === 'tagtype' ? 'tagtype' : 'tag');

	function handleTabChange(value: string) {
		const url = new URL(page.url);

		// set the tab parameter
		url.searchParams.set('tab', value);

		// reset all URL parameters for both tabs when switching
		const paramsToReset = [
			'tagsPage',
			'tagsSortBy',
			'tagsSortOrder',
			'tagTypesPage',
			'tagTypesSortBy',
			'tagTypesSortOrder',
			'search'
		];

		paramsToReset.forEach((param) => {
			url.searchParams.delete(param);
		});

		goto(url.toString(), { replaceState: false });
	}

	const tagsColumns = $derived(
		createTagsColumns(tagsSortBy, tagsSortOrder, handleTagsSort, {
			canEdit: canUpdate(data.user, 'tag'),
			canDelete: canDelete(data.user, 'tag')
		})
	);
	const tagTypesColumns = $derived(
		createTagTypesColumns(tagTypesSortBy, tagTypesSortOrder, handleTagTypesSort, {
			canEdit: canUpdate(data.user, 'tag'),
			canDelete: canDelete(data.user, 'tag')
		})
	);
</script>

<DeleteDialog
	bind:action={deleteAction}
	elementName={deleteAction?.includes('tagtype') ? 'Tag Type' : 'Tag'}
/>

<ListingPageLayout
	title="Tags"
	subtitle="Manage Tags and Tag Types"
	infoLabel="Help: Tag Management"
	infoDescription="Manage all tags and tag types here. You can create, edit, or delete tags and tag types using the available actions."
>
	{#snippet headerActions()}
		{#if canCreate(data.user, 'tag')}
			<a href="/tags/tag/add/new"><Button class="font-bold"><Plus />Create a Tag</Button></a>
			<a href="/tags/tagtype/add/new"><Button class="font-bold"><Plus />Create Tag Type</Button></a>
		{/if}
	{/snippet}

	{#snippet content()}
		<Tabs.Root value={activeTab} onValueChange={handleTabChange} class="w-full">
			<Tabs.List>
				<Tabs.Trigger value="tag">Tags</Tabs.Trigger>
				<Tabs.Trigger value="tagtype">Tag Types</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="tag">
				<div class="flex items-center py-4">
					<Input
						placeholder="Search tags..."
						value={tagsSearch}
						oninput={(event) => {
							const url = new URL(page.url);
							clearTimeout(tagsSearchTimeout);
							tagsSearchTimeout = setTimeout(() => {
								if (event.target?.value) {
									url.searchParams.set('search', event.target.value);
								} else {
									url.searchParams.delete('search');
								}
								url.searchParams.set('tagsPage', '1');
								goto(url, { keepFocus: true, invalidateAll: true });
							}, 300);
						}}
						class="max-w-sm"
					/>
				</div>
				<DataTable
					data={tagsData}
					columns={tagsColumns}
					totalItems={tagsTotalItems}
					totalPages={tagsTotalPages}
					currentPage={tagsCurrentPage}
					pageSize={tagsPageSize}
					paramPrefix="tags"
				/>
			</Tabs.Content>
			<Tabs.Content value="tagtype">
				<div class="flex items-center py-4">
					<Input
						placeholder="Search tag types..."
						value={tagTypesSearch}
						oninput={(event) => {
							const url = new URL(page.url);
							clearTimeout(tagTypesSearchTimeout);
							tagTypesSearchTimeout = setTimeout(() => {
								if (event.target?.value) {
									url.searchParams.set('search', event.target.value);
								} else {
									url.searchParams.delete('search');
								}
								url.searchParams.set('tagTypesPage', '1');
								goto(url, { keepFocus: true, invalidateAll: true });
							}, 300);
						}}
						class="max-w-sm"
					/>
				</div>
				<DataTable
					data={tagTypesData}
					columns={tagTypesColumns}
					totalItems={tagTypesTotalItems}
					totalPages={tagTypesTotalPages}
					currentPage={tagTypesCurrentPage}
					pageSize={tagTypesPageSize}
					paramPrefix="tagTypes"
				/>
			</Tabs.Content>
		</Tabs.Root>
	{/snippet}
</ListingPageLayout>
