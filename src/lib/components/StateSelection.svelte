<script lang="ts">
	import { page } from '$app/state';
	import Filteration from './Filteration.svelte';

	let stateList = $derived.by(() => page?.data?.states?.items ?? []);
	let { states = $bindable(), ...rest } = $props();
</script>

<Filteration bind:items={states} itemName="state" bind:itemList={stateList} {...rest} />
