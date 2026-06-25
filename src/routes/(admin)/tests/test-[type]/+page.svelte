<script lang="ts">
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Upload from '@lucide/svelte/icons/upload';
	import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { DataTable } from '$lib/components/data-table/index.js';
	import { createTestColumns, type Test } from './columns.js';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import TestReportDialog from './TestReportDialog.svelte';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import type { Filter } from '$lib/types/filters.js';
	import TagTypeSelection from '$lib/components/TagTypeSelection.svelte';
	import DistrictSelection from '$lib/components/DistrictSelection.svelte';
	import { canCreate, canRead, canDelete, hasLocation } from '$lib/utils/permissions.js';
	import { useTerms } from '$lib/nomenclature';
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import BatchActionsToolbar from '$lib/components/data-table/BatchActionsToolbar.svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	const term = useTerms();

	let {
		data
	}: {
		data: {
			test_taker_url: string;
			is_template: boolean;
			tests: any;
			params: any;
			user: any;
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
	const myTests = $derived(page.url.searchParams.get('my_tests'));

	const hasActiveFilters = $derived(
		search ||
			page.url.searchParams.getAll('tag_ids').length > 0 ||
			page.url.searchParams.getAll('state_ids').length > 0 ||
			page.url.searchParams.getAll('tag_type_ids').length > 0 ||
			page.url.searchParams.getAll('district_ids').length > 0 ||
			myTests !== null
	);

	function selectMyTestsFilter(value: string) {
		const url = new URL(page.url);
		if (value === 'all') {
			url.searchParams.delete('my_tests');
		} else {
			url.searchParams.set('my_tests', value);
		}
		url.searchParams.set('page', '1');
		goto(url, { keepFocus: true, invalidateAll: true });
	}
	const noTestCreatedYet = $derived(totalItems === 0 && !hasActiveFilters);

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
	const canReadTestTemplate = $derived(canRead(data.user, 'test-template'));

	// batch selection state
	let selectedTests: Test[] = $state([]);
	let selectedTestIds: string[] = $state([]);
	let batchDeleteMode = $state(false);
	let clearTableSelection = $state(false);

	const enableSelection = $derived(!noTestCreatedYet && canDelete(data.user, entityType));

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
			term,
			data.user,
			handleViewReport,
			enableSelection
		)
	);

	let filteredTags: Filter[] = $state([]);
	let filteredStates: Filter[] = $state([]);
	let filteredTagtypes: Filter[] = $state([]);
	let filteredDistricts: Filter[] = $state([]);
	let deleteAction: string | null = $state(null);
	let reportDialogOpen = $state(false);
	let reportTestId: string | null = $state(null);

	function handleViewReport(testId: string) {
		reportTestId = testId;
		reportDialogOpen = true;
	}

	const handleSelectionChange = (selectedRows: Test[], selectedRowIds: string[]) => {
		selectedTests = selectedRows;
		selectedTestIds = selectedRowIds;
	};

	const handleBatchAction = (actionId: string) => {
		if (actionId === 'delete') {
			batchDeleteMode = true;
		}
	};

	const handleBatchDeleteConfirm = () => {
		const form = document.getElementById('batch-delete-form') as HTMLFormElement;
		if (form) form.requestSubmit();
	};

	const handleBatchDeleteCancel = () => {
		batchDeleteMode = false;
	};

	const handleClearSelection = () => {
		selectedTests = [];
		selectedTestIds = [];
		batchDeleteMode = false;
		clearTableSelection = true;
		setTimeout(() => {
			clearTableSelection = false;
		}, 0);
	};

	$effect(() => {
		data?.is_template;
		handleClearSelection();
	});
</script>

<DeleteDialog
	bind:action={deleteAction}
	elementName={data?.is_template ? term('test_template') : term('test')}
	batchMode={batchDeleteMode}
	selectedCount={selectedTestIds.length}
	selectedItems={selectedTests}
	onBatchConfirm={handleBatchDeleteConfirm}
	onBatchCancel={handleBatchDeleteCancel}
/>

<TestReportDialog bind:open={reportDialogOpen} testId={reportTestId} />

<form
	id="batch-delete-form"
	method="POST"
	action="?/batchDelete"
	style="display: none;"
	use:enhance={() => {
		return async ({ result }) => {
			if (result.type === 'failure') {
				console.error('Batch delete failed');
				return;
			}
			batchDeleteMode = false;
			handleClearSelection();
			await invalidateAll();
		};
	}}
>
	<input type="hidden" name="testIds" value={JSON.stringify(selectedTestIds)} />
</form>

<ListingPageLayout
	title={data?.is_template ? term('test_templates') : term('tests')}
	subtitle=""
	showEmptyState={noTestCreatedYet}
	showFilters={selectedTestIds.length === 0}
	tooltipKey={data?.is_template ? 'test-templates' : 'tests'}
>
	{#snippet toolbar()}
		<BatchActionsToolbar
			selectedCount={selectedTestIds.length}
			selectedRows={selectedTests}
			selectedRowIds={selectedTestIds}
			onAction={handleBatchAction}
			onClearSelection={handleClearSelection}
			entityLabel={data?.is_template ? term('test_template') : term('test')}
		/>
	{/snippet}

	{#snippet headerActions()}
		{#if data?.is_template && canCreate(data.user, 'test-template')}
			<Button class="font-semibold" href={page.url.pathname + '/new'}
				><Plus />Create {term('test_template')}</Button
			>
		{:else if !data?.is_template && canCreate(data.user, 'test')}
			<a href={page.url.pathname + '/new'}>
				<Button
					variant="outline"
					class="{canReadTestTemplate
						? `border-primary text-primary bg-card font-semibold`
						: `border-primary text-primary-foreground bg-primary font-semibold`}}"
				>
					<Plus />{canReadTestTemplate ? 'Create Manually' : `Create New ${term('test')}`}
				</Button>
			</a>
		{/if}
		{#if !data?.is_template && canReadTestTemplate}
			<a href={page.url.pathname + '/convert'}
				><Button class="font-semibold"><Plus />Create from {term('test_template')}</Button></a
			>
		{/if}
	{/snippet}

	{#snippet emptyState()}
		{#if noTestCreatedYet}
			<div class="mx-4 mt-4 sm:mx-8 md:mx-10">
				<div
					class="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center rounded-2xl border border-border bg-card"
				>
					{#if data?.is_template}
						<div class="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-xl">
							<ClipboardList class="text-primary h-7 w-7" />
						</div>
						<h2 class="mt-5 text-xl font-bold text-foreground sm:text-2xl">
							No {term('test_templates', 'lower')} yet
						</h2>
						<p class="mt-2 max-w-md text-center text-sm text-muted-foreground">
							Create your first {term('test_template', 'lower')} to get started. {term(
								'test_templates'
							)} let you define question sets, scoring rules, and {term('test', 'lower')} configurations
							that can be reused across multiple {term('test', 'lower')} sessions.
						</p>
						{#if canCreate(data.user, 'test-template')}
							<div class="mt-6">
								<Button class="font-semibold" href={page.url.pathname + '/new'}
									><Plus />Create {term('test_template')}</Button
								>
							</div>
						{/if}
					{:else}
						<h2 class="text-xl font-bold text-foreground sm:text-2xl">
							Create your first {term('test', 'lower')}
						</h2>
						<p class="mt-2 text-sm text-subtle-foreground">Choose a method to get started</p>

						{#if canCreate(data.user, 'test')}
							<div class="mt-8 flex flex-col gap-6 sm:flex-row">
								<a
									href={page.url.pathname + '/new'}
									class="hover:border-primary hover:bg-primary/5 flex w-64 flex-col items-center rounded-xl border-2 border-dashed border-border px-8 py-10 transition-colors"
								>
									<div class="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-xl">
										<Upload class="text-primary h-6 w-6" />
									</div>
									<h3 class="mt-5 text-center text-base font-semibold text-foreground">
										Build from Scratch
									</h3>
									<p class="mt-1 text-center text-sm text-subtle-foreground">
										Configure everything from scratch, details, questions and rules.
									</p>
								</a>

								<a
									href={resolve('/tests/test-template')}
									class="hover:border-primary hover:bg-primary/5 flex w-64 flex-col items-center rounded-xl border-2 border-dashed border-border px-8 py-10 transition-colors"
								>
									<div class="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-xl">
										<FileSpreadsheet class="text-primary h-6 w-6" />
									</div>
									<h3 class="mt-5 text-center text-base font-semibold text-foreground">
										Build from {term('test_template')}
									</h3>
									<p class="mt-1 text-center text-sm text-subtle-foreground">
										Pick a pre-configured {term('test_template', 'lower')} and schedule a session.
									</p>
								</a>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet filters()}
		<div class="flex flex-col gap-4 lg:flex-row lg:items-start">
			<SearchInput
				placeholder={data?.is_template
					? `Search ${term('test_templates', 'lower')}...`
					: `Search ${term('tests', 'lower')}...`}
				value={search}
			/>

			<div class="flex flex-1 flex-wrap items-start justify-end gap-2">
				{#if !hasLocation(data.user)}
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
					<div class="mx-4 w-px self-stretch bg-border"></div>
				{/if}

				<div>
					<TagTypeSelection bind:tagTypes={filteredTagtypes} filteration={true} />
				</div>
				<div>
					<TagsSelection bind:tags={filteredTags} filteration={true} tagTypes={filteredTagtypes} />
				</div>
			</div>
		</div>

		{#if !data?.is_template}
			<div class="flex items-center gap-2">
				<span class="text-muted-foreground text-xs">Show:</span>
				<Tabs value={myTests ?? 'all'} onValueChange={selectMyTestsFilter} class="w-fit">
					<TabsList class="h-auto p-0.5">
						<TabsTrigger value="all" class="px-2 py-0.5 text-xs">All</TabsTrigger>
						<TabsTrigger value="true" class="px-2 py-0.5 text-xs">Mine</TabsTrigger>
						<TabsTrigger value="false" class="px-2 py-0.5 text-xs">Others</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>
		{/if}
	{/snippet}

	{#snippet content()}
		<DataTable
			{columns}
			data={tableData}
			{totalItems}
			{totalPages}
			{currentPage}
			{pageSize}
			emptyStateMessage={data?.is_template
				? `No ${term('test_templates', 'lower')} found matching your criteria.`
				: `No ${term('tests', 'lower')} found matching your criteria.`}
			{enableSelection}
			onSelectionChange={handleSelectionChange}
			getRowId={(row) => row.id}
			clearSelection={clearTableSelection}
		/>
	{/snippet}
</ListingPageLayout>
