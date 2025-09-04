<script lang="ts">
	import EmptyBox from '$lib/components/first-data-box.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Info from '@lucide/svelte/icons/info';
	import Button from '$lib/components/ui/button/button.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { DataTable } from '$lib/components/data-table/index.js';
	import { createTestColumns, type Test } from './columns.js';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import Input from '$lib/components/ui/input/input.svelte';
	import type { StateFilter } from '$lib/types/filters.js';

	let {
		data
	}: {
		data: {
			test_taker_url: string;
			is_template: boolean;
			tests: any;
			params: any;
		};
	} = $props();

	// extract data and pagination info
	const tableData = $derived(data?.tests?.items || data?.tests || []);
	const totalItems = $derived(data?.tests?.total || data?.tests?.length || 0);
	const totalPages = $derived(
		data?.tests?.pages || Math.ceil(totalItems / (data?.params?.size || DEFAULT_PAGE_SIZE))
	);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);
	const search = $derived(data?.params?.search || '');
	const sortBy = $derived(data?.params?.sortBy || '');
	const sortOrder = $derived(data?.params?.sortOrder || 'asc');

	let noTestCreatedYet = $state(true);

	$effect(() => {
		// check if there are any meaningful search/filter parameters (exclude pagination params)
		const meaningfulParams = ['search', 'name', 'tag_ids', 'state_ids', 'sortBy', 'sortOrder'];
		const hasFilters = meaningfulParams.some((param) => {
			const value = page.url.searchParams.get(param);
			return value && value.trim() !== '';
		});

		const hasTagFilters = page.url.searchParams.getAll('tag_ids').length > 0;
		const hasStateFilters = page.url.searchParams.getAll('state_ids').length > 0;

		noTestCreatedYet = totalItems === 0 && !hasFilters && !hasTagFilters && !hasStateFilters;
	});

	// handle sorting
	function handleSort(columnId: string) {
		const url = new URL(page.url);
		const currentSortBy = url.searchParams.get('sortBy');
		const currentSortOrder = url.searchParams.get('sortOrder');

		if (currentSortBy === columnId) {
			url.searchParams.set('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			url.searchParams.set('sortBy', columnId);
			url.searchParams.set('sortOrder', 'asc');
		}

		goto(url, { keepFocus: true, invalidateAll: true });
	}

	// Handle delete action
	function handleDelete(testId: string) {
		deleteAction = `${page.url.pathname}/${testId}?/delete`;
	}

	// create columns
	const columns = $derived(
		createTestColumns(
			sortBy,
			sortOrder,
			handleSort,
			currentPage,
			pageSize,
			data?.is_template,
			data?.test_taker_url,
			handleDelete
		)
	);

	let filteredTags: string[] = $state([]);
	let filteredStates: StateFilter[] = $state([]);
	let deleteAction: string | null = $state(null);
	let searchTimeout: ReturnType<typeof setTimeout>;
</script>

<DeleteDialog
	bind:action={deleteAction}
	elementName={data?.is_template ? 'Test template' : 'Test session'}
/>

<div id="mainpage" class="flex flex-col">
	<div class="mx-10 flex flex-row py-4">
		<div class="my-auto flex flex-col">
			<div class=" flex w-full items-center align-middle">
				<div class="flex flex-row">
					<h2
						class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
					>
						{data?.is_template ? 'Test templates' : 'Test sessions'}
					</h2>
					<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
				</div>
			</div>
			<Label class="my-auto align-middle text-sm font-extralight"
				>{data?.is_template
					? 'Create, edit and update all the test templates'
					: 'Create, edit,conduct and update all the test session'}</Label
			>
		</div>
		<div class="my-auto ml-auto p-4">
			{#if !noTestCreatedYet}
				<Button class="font-bold" href={page.url.pathname + '/new'}
					><Plus />{data?.is_template ? 'Create a test template' : 'Create a test session'}</Button
				>
			{/if}
		</div>
	</div>

	{#if noTestCreatedYet}
		<EmptyBox
			title={data?.is_template
				? 'Create your first test template'
				: 'Create your first test session'}
			subtitle={data?.is_template
				? 'Click on create a test template to create test templates to be assigned'
				: 'Click on create a test to create tests to be conducted'}
			leftButton={{
				title: `${data?.is_template ? 'Create Test Template' : 'Create Custom Test'}`,
				link: '/tests/test-' + (data?.is_template ? 'template' : 'session') + '/new',
				click: () => {
					return null;
				}
			}}
			rightButton={!data?.is_template
				? {
						title: `Create from test Template`,
						link: '/tests/test-template',
						click: () => {
							return null;
						}
					}
				: null}
		/>
	{:else}
		<div class="mx-8 mt-10 flex flex-col gap-8">
			<div class="flex flex-row items-center gap-4">
				<div class="w-1/3">
					<Input
						placeholder={data?.is_template ? 'Search test templates...' : 'Search test sessions...'}
						value={search}
						oninput={(event) => {
							const url = new URL(page.url);
							clearTimeout(searchTimeout);
							searchTimeout = setTimeout(() => {
								if (event.target?.value) {
									url.searchParams.set('search', event.target.value);
								} else {
									url.searchParams.delete('search');
								}
								goto(url, { keepFocus: true, invalidateAll: true });
							}, 300);
						}}
					/>
				</div>

				<div class="w-1/3">
					<TagsSelection
						bind:tags={filteredTags}
						onOpenChange={(e: boolean) => {
							if (!e) {
								const url = new URL(page.url);
								url.searchParams.delete('tag_ids');
								filteredTags.map((tag_id: string) => {
									url.searchParams.append('tag_ids', tag_id);
								});
								goto(url, { keepFocus: true, invalidateAll: true });
							}
						}}
					/>
				</div>

				<div class="w-1/3">
					<StateSelection
						bind:states={filteredStates}
						onOpenChange={(e: boolean) => {
							if (!e) {
								const url = new URL(page.url);
								url.searchParams.delete('state_ids');
								filteredStates.map((state_id: StateFilter) => {
									url.searchParams.append('state_ids', state_id.id);
								});
								goto(url, { keepFocus: true, invalidateAll: true });
							}
						}}
					/>
				</div>
			</div>

			<DataTable
				{columns}
				data={tableData}
				{totalItems}
				{totalPages}
				{currentPage}
				{pageSize}
				emptyStateMessage={data?.is_template
					? 'No test templates found matching your criteria.'
					: 'No test sessions found matching your criteria.'}
			/>
		</div>
	{/if}
</div>
