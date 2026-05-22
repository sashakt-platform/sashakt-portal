<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createColumns } from './columns';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import Plus from '@lucide/svelte/icons/plus';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import { canCreate } from '$lib/utils/permissions.js';
	import SearchInput from '$lib/components/SearchInput.svelte';

	let { data } = $props();

	const tableData = $derived(data?.organisations?.items || []);
	const totalItems = $derived(data?.organisations?.total || 0);
	const totalPages = $derived(data?.totalPages || 0);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);
	const search = $derived(data?.params?.search || '');
	const sortBy = $derived(data?.params?.sortBy || '');
	const sortOrder = $derived(data?.params?.sortOrder || 'asc');
	const isActive = $derived(data?.params?.isActive || '');

	const STATUS_OPTIONS = [
		{ label: 'Active', value: 'true' },
		{ label: 'Inactive', value: 'false' }
	];

	const statusLabel = $derived(
		isActive === 'true' ? 'Active' : isActive === 'false' ? 'Inactive' : 'Status'
	);

	let statusOpen = $state(false);

	function handleSort(columnId: string) {
		const url = new URL(page.url);
		const newSortOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
		url.searchParams.set('sortBy', columnId);
		url.searchParams.set('sortOrder', newSortOrder);
		url.searchParams.set('page', '1');
		goto(resolve(url.pathname + url.search), { replaceState: false });
	}

	function selectStatus(value: string) {
		const url = new URL(page.url);
		if (isActive === value) {
			url.searchParams.delete('isActive');
		} else {
			url.searchParams.set('isActive', value);
		}
		url.searchParams.set('page', '1');
		statusOpen = false;
		goto(resolve(url.pathname + url.search), { replaceState: false });
	}

	const columns = $derived(createColumns(sortBy, sortOrder, handleSort));
</script>

<ListingPageLayout title="Select Organisation" subtitle="">
	{#snippet headerActions()}
		{#if canCreate(data.user, 'organization')}
			<a href={resolve('/organisations/add/new')}>
				<Button class="font-semibold"><Plus />Add Organisation</Button>
			</a>
		{/if}
	{/snippet}

	{#snippet filters()}
		<div class="flex items-center justify-between gap-2">
			<SearchInput placeholder="Search organisations..." value={search} />
			<Popover.Root bind:open={statusOpen}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							class="text-muted-foreground h-10 rounded-full {isActive !== ''
								? 'border-primary text-primary'
								: ''}"
						>
							{statusLabel}
							<ChevronDownIcon class="ml-1 opacity-50" />
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class="w-36 p-1">
					{#each STATUS_OPTIONS as option (option.value)}
						<button
							type="button"
							class="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
							onclick={() => selectStatus(option.value)}
						>
							<CheckIcon
								class="h-4 w-4 {isActive === option.value ? 'text-primary' : 'text-transparent'}"
							/>
							{option.label}
						</button>
					{/each}
				</Popover.Content>
			</Popover.Root>
		</div>
	{/snippet}

	{#snippet content()}
		<DataTable data={tableData} {columns} {totalItems} {totalPages} {currentPage} {pageSize} />
	{/snippet}
</ListingPageLayout>
