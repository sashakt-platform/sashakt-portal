<script lang="ts">
	import EntityTypeForm from './EntityTypeForm.svelte';
	import EntityListView from './EntityListView.svelte';

	let { data } = $props();
</script>

{#if data.action === 'view'}
	<EntityListView {data} />
{:else}
	<EntityTypeForm {data} />
{/if}
