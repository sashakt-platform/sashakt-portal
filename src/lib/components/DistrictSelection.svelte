<script lang="ts">
	import { page } from '$app/state';
	import Filteration from './Filteration.svelte';

	let districtList = $derived.by(() => page?.data?.districts?.items ?? []);
	let { districts = $bindable(), ...rest } = $props();
</script>

<Filteration bind:items={districts} itemName="district" bind:itemList={districtList} {...rest} />
