<script lang="ts">
	import EntityForm from './EntityForm.svelte';
	import EntityRecordList from './EntityRecordList.svelte';

	let { data } = $props();
</script>

{#if data.action === 'view'}
	<EntityRecordList {data} />
{:else}
	<EntityForm {data} />
{/if}
