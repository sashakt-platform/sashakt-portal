<script lang="ts">
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Upload from '@lucide/svelte/icons/upload';
	import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
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
	import {
		canCreate,
		canUpdate,
		canDelete,
		isStateAdmin,
		hasAssignedDistricts
	} from '$lib/utils/permissions.js';

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
			},
			data.user
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

<ListingPageLayout
	title={data?.is_template ? 'Test Templates' : 'Test Sessions'}
	subtitle=""
	showEmptyState={noTestCreatedYet}
	infoLabel={data?.is_template ? 'Help: Test templates' : 'Help: Test sessions'}
	infoDescription={data?.is_template
		? 'This panel lists all your test templates. You can create, edit, or delete a template using the available actions.'
		: 'This panel lists all your test sessions. You can create, edit, or delete a test ,clone an existing test setup, or download the test’s QR code for easy sharing.'}
>
	{#snippet headerActions()}
		{#if data?.is_template && canCreate(data.user, 'test-template')}
			<Button class="font-semibold" href={page.url.pathname + '/new'}
				><Plus />Create Test Template</Button
			>
		{:else if !data?.is_template && canCreate(data.user, 'test')}
			<a href={page.url.pathname + '/new'}
				><Button
					class="border-primary bg-white text-primary font-semibold hover:bg-primary/5"
					variant="outline"><Plus />Create Manually</Button
				></a
			>
			<a href="/tests/test-template"
				><Button class="font-semibold"><Plus />Create from Template</Button></a
			>
		{/if}
	{/snippet}

	{#snippet emptyState()}
		{#if noTestCreatedYet}
			<div class="mx-4 mt-4 sm:mx-8 md:mx-10">
				<div
					class="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white"
				>
					{#if data?.is_template}
						<div class="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
							<ClipboardList class="h-7 w-7 text-primary" />
						</div>
						<h2 class="mt-5 text-xl font-bold text-gray-800 sm:text-2xl">
							No test templates yet
						</h2>
						<p class="mt-2 max-w-md text-center text-sm text-gray-400">
							Create your first test template to get started. Templates let you define question
							sets, scoring rules, and test configurations that can be reused across multiple test
							sessions.
						</p>
						{#if canCreate(data.user, 'test-template')}
							<div class="mt-6">
								<Button class="font-semibold" href={page.url.pathname + '/new'}
									><Plus />Create Test Template</Button
								>
							</div>
						{/if}
					{:else}
						<h2 class="text-xl font-bold text-gray-800 sm:text-2xl">
							Create your first test session
						</h2>
						<p class="mt-2 text-sm text-gray-400">Choose a method to get started</p>

						{#if canCreate(data.user, 'test')}
							<div class="mt-8 flex flex-col gap-6 sm:flex-row">
								<a
									href={page.url.pathname + '/new'}
									class="flex w-64 flex-col items-center rounded-xl border-2 border-dashed border-gray-200 px-8 py-10 transition-colors hover:border-primary hover:bg-primary/5"
								>
									<div
										class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10"
									>
										<Upload class="h-6 w-6 text-primary" />
									</div>
									<h3 class="mt-5 text-center text-base font-semibold text-gray-800">
										Build from Scratch
									</h3>
									<p class="mt-1 text-center text-sm text-gray-400">
										Configure everything from scratch, details, questions and rules.
									</p>
								</a>

								<a
									href="/tests/test-template"
									class="flex w-64 flex-col items-center rounded-xl border-2 border-dashed border-gray-200 px-8 py-10 transition-colors hover:border-primary hover:bg-primary/5"
								>
									<div
										class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10"
									>
										<FileSpreadsheet class="h-6 w-6 text-primary" />
									</div>
									<h3 class="mt-5 text-center text-base font-semibold text-gray-800">
										Build from Template
									</h3>
									<p class="mt-1 text-center text-sm text-gray-400">
										Pick a pre-configured test template and schedule a session.
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

			{#if !isStateAdmin(data.user)}
				<div>
					<StateSelection bind:states={filteredStates} filteration={true} />
				</div>
			{/if}

			{#if !hasAssignedDistricts(data.user)}
				<div>
					<DistrictSelection
						bind:districts={filteredDistricts}
						selectedStates={filteredStates}
						filteration={true}
					/>
				</div>
			{/if}

			<div>
				<TagsSelection bind:tags={filteredTags} filteration={true} />
			</div>

			<div>
				<TagTypeSelection bind:tagTypes={filteredTagtypes} filteration={true} />
			</div>
		</div>
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
				? 'No test templates found matching your criteria.'
				: 'No test sessions found matching your criteria.'}
		/>
	{/snippet}
</ListingPageLayout>
