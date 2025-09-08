<script lang="ts">
	import { page } from '$app/state';
	import Filteration from './Filteration.svelte';

	let tagList = $derived.by(() => page?.data?.tags?.items ?? []);
	let { tags = $bindable(), ...rest } = $props();
</script>

<Filteration bind:items={tags} itemName="tag" bind:itemList={tagList} {...rest} />
