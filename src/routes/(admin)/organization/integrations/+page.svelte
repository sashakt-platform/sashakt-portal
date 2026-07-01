<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createColumns } from './columns';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';

	let { data } = $props();

	const tableData = $derived(data?.providers?.items || []);
	const totalItems = $derived(data?.providers?.total || 0);
	const totalPages = $derived(data?.totalPages || 0);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);

	const columns = $derived(createColumns());
</script>

<ListingPageLayout title="Integrations" subtitle="" showInfoIcon={false}>
	{#snippet content()}
		<DataTable data={tableData} {columns} {totalItems} {totalPages} {currentPage} {pageSize} />
	{/snippet}
</ListingPageLayout>
