<script lang="ts">
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { DataTable } from '$lib/components/data-table/index.js';
	import { createResponseColumns } from './columns.js';

	let { data } = $props();

	const tableData = $derived(data?.responses?.candidates || []);
	const columns = $derived(createResponseColumns());
</script>

<ListingPageLayout
	title={data.testName}
	subtitle=""
	backHref="/tests/test-session"
	showInfoIcon={false}
>
	{#snippet content()}
		<DataTable
			{columns}
			data={tableData}
			totalItems={tableData.length}
			totalPages={1}
			currentPage={1}
			pageSize={tableData.length || 1}
			emptyStateMessage="No responses found."
		/>
	{/snippet}
</ListingPageLayout>
