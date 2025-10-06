<script lang="ts">
	import { page } from '$app/state';
	import Filteration from './Filteration.svelte';

	let tagTypeList = $derived.by(() => page?.data?.tagtypes?.items ?? []);
	let { tagTypes = $bindable(), ...rest } = $props();
</script>

<Filteration
	bind:items={tagTypes}
	itemName="tag_type"
	bind:itemList={tagTypeList}
	label="tag type"
	{...rest}
/>
