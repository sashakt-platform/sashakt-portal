<script lang="ts">
	import Filteration from './Filteration.svelte';

	let { tags = $bindable(), ...rest } = $props();
	let tagList = $state<{ id: string; name: string }[]>([]);
	let isLoading = $state(false);

	async function loadTags(search = '') {
		isLoading = true;
		try {
			const response = await fetch(`/api/filters/tags?search=${encodeURIComponent(search)}`);
			if (response.ok) {
				const data = await response.json();
				tagList = data.items ?? [];
			}
		} catch (error) {
			console.error('Failed to fetch tags:', error);
			tagList = [];
		} finally {
			isLoading = false;
		}
	}

	// Load tags on mount
	$effect(() => {
		loadTags();
	});
</script>

<Filteration
	bind:items={tags}
	itemName="tag"
	bind:itemList={tagList}
	onSearch={loadTags}
	{isLoading}
	{...rest}
/>
