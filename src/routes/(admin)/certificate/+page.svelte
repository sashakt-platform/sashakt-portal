<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createColumns } from './columns';
	import { Button } from '$lib/components/ui/button';
	import Plus from '@lucide/svelte/icons/plus';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';
	import Input from '$lib/components/ui/input/input.svelte';
	import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Search from '@lucide/svelte/icons/search';

	let { data } = $props();
	let searchTimeout: ReturnType<typeof setTimeout>;

	const tableData = $derived(data?.certificates?.items || []);
	const totalItems = $derived(data?.certificates?.total || 0);
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
			canEdit: canUpdate(data.user, 'certificate'),
			canDelete: canDelete(data.user, 'certificate')
		})
	);

	const noCertificatesCreatedYet = $derived(totalItems === 0 && !search);
</script>

<ListingPageLayout
	title="Certificates"
	subtitle=""
	showEmptyState={noCertificatesCreatedYet}
	infoLabel="Help: Certificate management"
	infoDescription="This panel displays all certificates in the system. You can edit or delete a certificate by clicking the three dots next to it."
>
	{#snippet headerActions()}
		{#if canCreate(data.user, 'certificate')}
			<a href={resolve('/certificate/add/new')}>
				<Button class="font-semibold">
					<Plus />Create Certificate
				</Button>
			</a>
		{/if}
	{/snippet}

	{#snippet emptyState()}
		{#if noCertificatesCreatedYet}
			<div class="mx-4 mt-4 sm:mx-8 md:mx-10">
				<div
					class="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white"
				>
					<div class="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-xl">
						<ShieldCheck class="text-primary h-7 w-7" />
					</div>
					<h2 class="mt-5 text-xl font-bold text-gray-800 sm:text-2xl">No certificates yet</h2>
					<p class="mt-2 max-w-sm text-center text-sm text-gray-400">
						Create your first certificate to get started. Certificates are awarded to candidates
						after they complete a test.
					</p>
					{#if canCreate(data.user, 'certificate')}
						<div class="mt-6">
							<a href={resolve('/certificate/add/new')}
								><Button class="font-semibold"><Plus />Create Certificate</Button></a
							>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet filters()}
		<div class="flex flex-col gap-4 lg:flex-row lg:items-center">
			<div class="relative lg:w-80">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
				<Input
					class="rounded-full pl-9"
					placeholder="Search certificates..."
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
							url.searchParams.set('page', '1');
							goto(url, { keepFocus: true, invalidateAll: true });
						}, 300);
					}}
				/>
			</div>
		</div>
	{/snippet}

	{#snippet content()}
		<DataTable data={tableData} {columns} {totalItems} {totalPages} {currentPage} {pageSize} />
	{/snippet}
</ListingPageLayout>
