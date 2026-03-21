<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createColumns } from './columns';
	import { Button } from '$lib/components/ui/button';
	import Plus from '@lucide/svelte/icons/plus';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import Input from '$lib/components/ui/input/input.svelte';
	import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';
	import FileText from '@lucide/svelte/icons/file-text';

	let { data } = $props();
	let searchTimeout: ReturnType<typeof setTimeout>;

	const tableData = $derived(data?.forms?.items || []);
	const totalItems = $derived(data?.forms?.total || 0);
	const totalPages = $derived(data?.totalPages || 0);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);
	const search = $derived(data?.params?.search || '');
	const sortBy = $derived(data?.params?.sortBy || '');
	const sortOrder = $derived(data?.params?.sortOrder || 'asc');

	function handleSort(columnId: string) {
		const url = new URL(page.url);

		const newSortOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
		url.searchParams.set('sortBy', columnId);
		url.searchParams.set('sortOrder', newSortOrder);
		url.searchParams.set('page', '1');

		goto(url.toString(), { replaceState: false });
	}

	const columns = $derived(
		createColumns(sortBy, sortOrder, handleSort, {
			canEdit: canUpdate(data.user, 'form'),
			canDelete: canDelete(data.user, 'form')
		})
	);

	const noFormsCreatedYet = $derived(totalItems === 0 && !search);
</script>

<ListingPageLayout
	title="Forms"
	subtitle=""
	showEmptyState={noFormsCreatedYet}
	infoLabel="Help: Forms"
	infoDescription="This panel displays all forms in the system. Forms are used to collect candidate information before tests. You can create, edit, or delete forms by using the actions."
>
	{#snippet headerActions()}
		{#if canCreate(data.user, 'form')}
			<a href="/forms/add/new">
				<Button class="font-semibold">
					<Plus />Create Form
				</Button>
			</a>
		{/if}
	{/snippet}

	{#snippet emptyState()}
		{#if noFormsCreatedYet}
			<div class="mx-4 mt-4 sm:mx-8 md:mx-10">
				<div
					class="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white"
				>
					<div class="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-xl">
						<FileText class="text-primary h-7 w-7" />
					</div>
					<h2 class="mt-5 text-xl font-bold text-gray-800 sm:text-2xl">No forms yet</h2>
					<p class="mt-2 max-w-sm text-center text-sm text-gray-400">
						Create your first form to get started. Forms let you create questions that test takers
						must answer before starting the test.
					</p>
					{#if canCreate(data.user, 'form')}
						<div class="mt-6">
							<a href="/forms/add/new"><Button class="font-semibold"><Plus />Create Form</Button></a
							>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet filters()}
		<Input
			placeholder="Search forms..."
			value={search}
			oninput={(event: Event & { currentTarget: HTMLInputElement }) => {
				const value = event.currentTarget.value;
				const url = new URL(page.url);
				clearTimeout(searchTimeout);
				searchTimeout = setTimeout(() => {
					if (value) {
						url.searchParams.set('search', value);
					} else {
						url.searchParams.delete('search');
					}
					url.searchParams.set('page', '1');
					goto(url, { keepFocus: true, invalidateAll: true });
				}, 300);
			}}
			class="max-w-sm"
		/>
	{/snippet}

	{#snippet content()}
		<DataTable data={tableData} {columns} {totalItems} {totalPages} {currentPage} {pageSize} />
	{/snippet}
</ListingPageLayout>
