<script lang="ts">
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { DataTable } from '$lib/components/data-table/index.js';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import { createResponseColumns } from './columns.js';
	import { canDelete } from '$lib/utils/permissions.js';

	let { data } = $props();

	const tableData = $derived(data?.responses?.candidates || []);
	const userCanDelete = $derived(canDelete(data.user, 'candidate'));

	let deleteAction: string | null = $state(null);

	function handleDelete(candidateId: number) {
		deleteAction = `?/deleteCandidate&candidate_id=${candidateId}`;
	}

	const columns = $derived(createResponseColumns(handleDelete, userCanDelete));
</script>

<DeleteDialog bind:action={deleteAction} elementName="Candidate" />

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
