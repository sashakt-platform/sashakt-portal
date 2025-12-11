<script lang="ts">
	import Filteration from './Filteration.svelte';

	let { states = $bindable(), ...rest } = $props();
	let stateList = $state<{ id: string; name: string }[]>([]);
	let isLoading = $state(false);

	async function loadStates(search = '') {
		isLoading = true;
		try {
			const response = await fetch(`/api/filters/states?search=${encodeURIComponent(search)}`);
			if (response.ok) {
				const data = await response.json();
				stateList = data.items ?? [];
			}
		} catch (error) {
			console.error('Failed to fetch states:', error);
			stateList = [];
		} finally {
			isLoading = false;
		}
	}

	// Load states on mount
	$effect(() => {
		loadStates();
	});
</script>

<Filteration
	bind:items={states}
	itemName="state"
	bind:itemList={stateList}
	onSearch={loadStates}
	{isLoading}
	{...rest}
/>
