<script lang="ts">
	import Filteration from './Filteration.svelte';

	let { tagTypes = $bindable(), ...rest } = $props();
	let tagTypeList = $state<{ id: string; name: string }[]>([]);
	let isLoading = $state(false);

	async function loadTagTypes(search = '') {
		isLoading = true;
		try {
			const response = await fetch(`/api/filters/tagtypes?search=${encodeURIComponent(search)}`);
			if (response.ok) {
				const data = await response.json();
				tagTypeList = data.items ?? [];
			}
		} catch (error) {
			console.error('Failed to fetch tag types:', error);
			tagTypeList = [];
		} finally {
			isLoading = false;
		}
	}

	// Load tag types on mount
	$effect(() => {
		loadTagTypes();
	});
</script>

<Filteration
	bind:items={tagTypes}
	itemName="tag_type"
	bind:itemList={tagTypeList}
	label="tag type"
	onSearch={loadTagTypes}
	{isLoading}
	{...rest}
/>
