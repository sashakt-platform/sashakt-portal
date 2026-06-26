<script lang="ts">
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { DataTable } from '$lib/components/data-table/index.js';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';
	import { createResponseColumns } from './columns.js';
	import { canDelete } from '$lib/utils/permissions.js';
	import { DEFAULT_PAGE_SIZE } from '$lib/constants';

	let { data } = $props();

	const tableData = $derived(data?.responses?.items || []);
	const totalItems = $derived(data?.responses?.total || 0);
	const totalPages = $derived(data?.totalPages || 0);
	const currentPage = $derived(data?.params?.page || 1);
	const pageSize = $derived(data?.params?.size || DEFAULT_PAGE_SIZE);

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
			{totalItems}
			{totalPages}
			{currentPage}
			{pageSize}
			emptyStateMessage="No responses found."
		/>
	{/snippet}
</ListingPageLayout>
