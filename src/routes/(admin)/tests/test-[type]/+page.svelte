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
	import type { Filter } from '$lib/types/filters.js';
	import TagTypeSelection from '$lib/components/TagTypeSelection.svelte';
	import DistrictSelection from '$lib/components/DistrictSelection.svelte';
	import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';

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
		const meaningfulParams = [
			'search',
			'name',
			'tag_ids',
			'tag_type_ids',
			'state_ids',
			'sortBy',
			'sortOrder'
		];
		const hasFilters = meaningfulParams.some((param) => {
			const value = page.url.searchParams.get(param);
			return value && value.trim() !== '';
		});

		const hasTagFilters = page.url.searchParams.getAll('tag_ids').length > 0;
		const hasStateFilters = page.url.searchParams.getAll('state_ids').length > 0;
		const hasTagtypeFilters = page.url.searchParams.getAll('tag_type_ids').length > 0;
		const hasDistrictFilters = page.url.searchParams.getAll('district_ids').length > 0;

		noTestCreatedYet =
			totalItems === 0 &&
			!hasFilters &&
			!hasTagFilters &&
			!hasStateFilters &&
			!hasTagtypeFilters &&
			!hasDistrictFilters;
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
	const entityType = $derived(data?.is_template ? 'test-template' : 'test');
	const columns = $derived(
		createTestColumns(
			sortBy,
			sortOrder,
			handleSort,
			currentPage,
			pageSize,
			data?.is_template,
			data?.test_taker_url,
			handleDelete,
			{
				canEdit: canUpdate(data.user, entityType),
				canDelete: canDelete(data.user, entityType)
			}
		)
	);

	let filteredTags: Filter[] = $state([]);
	let filteredStates: Filter[] = $state([]);
	let filteredTagtypes: Filter[] = $state([]);
	let filteredDistricts: Filter[] = $state([]);
	let deleteAction: string | null = $state(null);
	let searchTimeout: ReturnType<typeof setTimeout>;
</script>

<DeleteDialog
	bind:action={deleteAction}
	elementName={data?.is_template ? 'Test template' : 'Test session'}
/>

<div id="mainpage" class="flex flex-col">
	<div class="mx-4 flex flex-col gap-4 py-4 sm:mx-10 sm:flex-row sm:gap-0">
		<div class="my-auto flex flex-col">
			<div class="flex w-full items-center align-middle">
				<div class="flex flex-row">
					<h2
						class="mr-2 w-fit scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 sm:text-3xl"
					>
						{data?.is_template ? 'Test templates' : 'Test sessions'}
					</h2>
					<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
				</div>
			</div>
			<Label class="my-auto align-middle text-sm font-extralight"
				>{data?.is_template ? 'Manage test templates' : 'Manage test sessions'}</Label
			>
		</div>
		<div class="my-auto flex gap-3 sm:ml-auto sm:p-4">
			{#if !noTestCreatedYet}
				{#if data?.is_template && canCreate(data.user, 'test-template')}
					<Button class="font-bold" href={page.url.pathname + '/new'}
						><Plus />Create a test template</Button
					>
				{:else if !data?.is_template && canCreate(data.user, 'test')}
					<Button class="font-bold" href={page.url.pathname + '/new'}
						><Plus />Create a test session</Button
					>
				{/if}
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
		<div class="mx-4 mt-6 flex flex-col gap-8 sm:mx-8 sm:mt-10">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
				<div>
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
								// reset pagination to page 1 when search changes
								url.searchParams.set('page', '1');
								goto(url, { keepFocus: true, invalidateAll: true });
							}, 300);
						}}
					/>
				</div>

				<div>
					<StateSelection bind:states={filteredStates} filteration={true} />
				</div>

				<div>
					<DistrictSelection
						bind:districts={filteredDistricts}
						selectedStates={filteredStates}
						filteration={true}
					/>
				</div>

				<div>
					<TagsSelection bind:tags={filteredTags} filteration={true} />
				</div>

				<div>
					<TagTypeSelection bind:tagTypes={filteredTagtypes} filteration={true} />
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
