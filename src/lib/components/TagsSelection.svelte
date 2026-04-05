<script lang="ts">
	import Filteration from './Filteration.svelte';

	import type { Filter } from '$lib/types/filters';

	let { tags = $bindable(), tagTypes = [] as Filter[], ...rest } = $props();
	let tagList = $state<Filter[]>([]);
	let isLoading = $state(false);
	let isInitialMount = true;

	const tagTypeIds = $derived(tagTypes.map((t) => t.id));

	async function loadTags(search = '') {
		isLoading = true;
		try {
			const tagTypeParams = tagTypeIds.map((id) => `&tag_type_ids=${id}`).join('');
			const response = await fetch(
				`/api/filters/tags?search=${encodeURIComponent(search)}${tagTypeParams}`
			);
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

	// Re-fetch tags and clear selection when tagTypes changes
	$effect(() => {
		tagTypeIds;
		if (isInitialMount) {
			isInitialMount = false;
		} else {
			tags = [];
		}
		loadTags();
	});
</script>

<Filteration
	bind:items={tags}
	itemName="tag"
	label="Tag"
	bind:itemList={tagList}
	onSearch={loadTags}
	{isLoading}
	{...rest}
/>
