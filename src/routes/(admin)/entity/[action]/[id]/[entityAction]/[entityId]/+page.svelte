<script lang="ts">
	import EntityRecordForm from './EntityRecordForm.svelte';

	let { data } = $props();
</script>

<EntityRecordForm {data} />
