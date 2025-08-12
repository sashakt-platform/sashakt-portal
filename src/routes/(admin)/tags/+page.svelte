<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import { createTagsColumns } from './tags-columns';
	import { createTagTypesColumns } from './tag-types-columns';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Info from '@lucide/svelte/icons/info';
	import Plus from '@lucide/svelte/icons/plus';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';

	const { data } = $props();
	let deleteAction: string | null = $state(null);

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

	const tagsColumns = $derived(createTagsColumns(tagsSortBy, tagsSortOrder, handleTagsSort));
	const tagTypesColumns = $derived(
		createTagTypesColumns(tagTypesSortBy, tagTypesSortOrder, handleTagTypesSort)
	);
</script>

<div>
	<DeleteDialog
		bind:action={deleteAction}
		elementName={deleteAction?.includes('tagtype') ? 'Tag Type' : 'Tag'}
	/>
	<div class="mx-10 flex flex-row py-4">
		<div class="my-auto flex flex-col">
			<div class=" flex w-full items-center align-middle">
				<div class="flex flex-row">
					<h2
						class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
					>
						Tag Management
					</h2>
					<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
				</div>
			</div>
			<Label class="my-auto align-middle text-sm font-extralight"
				>Create, edit and update all the Tags and Tag Types</Label
			>
		</div>
		<div class={['my-auto ml-auto gap-3 p-4']}>
			<a href="/tags/tag/add/new"
				><Button class="font-bold" variant="outline"><Plus />Create a Tag</Button></a
			>
			<a href="/tags/tagtype/add/new"
				><Button class=" font-bold "><Plus />Create Tag Type</Button></a
			>
		</div>
	</div>

	<div class="mx-8 mt-10 flex flex-col gap-8">
		<Tabs.Root value={activeTab} class="w-full">
			<Tabs.List>
				<Tabs.Trigger value="tag">Tags</Tabs.Trigger>
				<Tabs.Trigger value="tagtype">Tag Types</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="tag">
				<DataTable
					data={tagsData}
					columns={tagsColumns}
					totalItems={tagsTotalItems}
					totalPages={tagsTotalPages}
					currentPage={tagsCurrentPage}
					pageSize={tagsPageSize}
					search={tagsSearch}
					paramPrefix="tags"
				/>
			</Tabs.Content>
			<Tabs.Content value="tagtype">
				<DataTable
					data={tagTypesData}
					columns={tagTypesColumns}
					totalItems={tagTypesTotalItems}
					totalPages={tagTypesTotalPages}
					currentPage={tagTypesCurrentPage}
					pageSize={tagTypesPageSize}
					search={tagTypesSearch}
					paramPrefix="tagTypes"
				/>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>
