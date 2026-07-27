<script lang="ts">
	import { DataTable } from '$lib/components/data-table';
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { createColumns } from './columns';
	import { canUpdate } from '$lib/utils/permissions.js';

	let { data } = $props();

	const tableData = $derived(data?.roles || []);
	const totalItems = $derived(tableData.length);
	const totalPages = 1;
	const currentPage = 1;
	const pageSize = $derived(Math.max(tableData.length, 1));

	const columns = $derived(createColumns({ canEdit: canUpdate(data.user, 'role') }));
</script>

<ListingPageLayout title="Roles and Permission" subtitle="" showInfoIcon={false}>
	{#snippet content()}
		<DataTable data={tableData} {columns} {totalItems} {totalPages} {currentPage} {pageSize} />
	{/snippet}
</ListingPageLayout>
