<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createColumns } from './columns';

	let { data } = $props();

	const tableData = $derived(data?.providers || []);
	const totalItems = $derived(tableData.length);
	const totalPages = 1;
	const currentPage = 1;
	const pageSize = $derived(Math.max(tableData.length, 1));

	const columns = $derived(createColumns());
</script>

<ListingPageLayout title="Integrations" subtitle="" showInfoIcon={false}>
	{#snippet content()}
		<DataTable data={tableData} {columns} {totalItems} {totalPages} {currentPage} {pageSize} />
	{/snippet}
</ListingPageLayout>
