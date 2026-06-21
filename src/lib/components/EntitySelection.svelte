<script lang="ts">
	import Filteration from './Filteration.svelte';

	let {
		entities = $bindable(),
		entityTypeId,
		...rest
	}: {
		entities: { id: string; name: string }[];
		entityTypeId: number | null;
		multiple?: boolean;
		[key: string]: unknown;
	} = $props();

	let entityList = $state<{ id: string; name: string }[]>([]);
	let isLoading = $state(false);

	async function loadEntities(search = '') {
		if (!entityTypeId) {
			entityList = [];
			return;
		}

		isLoading = true;
		try {
			const response = await fetch(
				`/api/filters/entities?search=${encodeURIComponent(search)}&entity_type_id=${encodeURIComponent(String(entityTypeId))}`
			);
			if (response.ok) {
				const data = await response.json();
				entityList = (data.items ?? []).map((item: { id: number | string; name: string }) => ({
					id: String(item.id),
					name: item.name
				}));
			}
		} catch (error) {
			console.error('Failed to fetch entities:', error);
			entityList = [];
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		loadEntities();
	});
</script>

<Filteration
	bind:items={entities}
	itemName="entity"
	bind:itemList={entityList}
	onSearch={loadEntities}
	{isLoading}
	{...rest}
/>
