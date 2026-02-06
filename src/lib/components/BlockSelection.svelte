<script lang="ts">
	import Filteration from './Filteration.svelte';

	type District = { id: string; name: string };

	let { blocks = $bindable(), selectedDistricts = [] as District[], ...rest } = $props();
	let blockList = $state<{ id: string; name: string; district_id?: string }[]>([]);
	let isLoading = $state(false);
	let previousDistrictIds = '';

	async function loadBlocks(search = '') {
		isLoading = true;
		try {
			const params = new URLSearchParams();
			params.set('search', search);

			// Add district_ids if districts are selected
			for (const district of selectedDistricts) {
				params.append('district_ids', String(district.id));
			}

			const response = await fetch(`/api/filters/blocks?${params.toString()}`);
			if (response.ok) {
				const data = await response.json();
				blockList = data.items ?? [];
			}
		} catch (error) {
			console.error('Failed to fetch blocks:', error);
			blockList = [];
		} finally {
			isLoading = false;
		}
	}

	// Load blocks on mount
	$effect(() => {
		loadBlocks();
	});

	// Re-fetch blocks when selected districts change
	$effect(() => {
		const districtIds = selectedDistricts?.map((district) => String(district.id)).join(',') || '';

		if (districtIds !== previousDistrictIds) {
			previousDistrictIds = districtIds;
			loadBlocks();

			// Filter out blocks that don't belong to selected districts
			if (selectedDistricts.length > 0 && blocks.length > 0 && blockList.length > 0) {
				const selectedDistrictIds = selectedDistricts.map((district) => String(district.id));
				const validBlocks = blocks.filter((block: { id: string; name: string }) => {
					const blockData = blockList.find((b) => String(b.id) === String(block.id));
					return blockData && selectedDistrictIds.includes(String(blockData.district_id));
				});

				if (validBlocks.length !== blocks.length) {
					blocks = validBlocks;
				}
			}
		}
	});
</script>

<Filteration
	bind:items={blocks}
	itemName="block"
	bind:itemList={blockList}
	onSearch={loadBlocks}
	{isLoading}
	{...rest}
/>
