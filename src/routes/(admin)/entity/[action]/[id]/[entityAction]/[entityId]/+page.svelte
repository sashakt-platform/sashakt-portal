<script lang="ts">
	import EntityForm from './EntityForm.svelte';

	let { data } = $props();
</script>

<EntityForm {data} />
