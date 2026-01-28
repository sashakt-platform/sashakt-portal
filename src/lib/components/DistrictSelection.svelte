<script lang="ts">
	import Filteration from './Filteration.svelte';

	type State = { id: string; name: string };

	let { districts = $bindable(), selectedStates = [] as State[], ...rest } = $props();
	let districtList = $state<{ id: string; name: string; state_id?: string }[]>([]);
	let isLoading = $state(false);
	let previousStateIds = '';

	async function loadDistricts(search = '') {
		isLoading = true;
		try {
			const params = new URLSearchParams();
			params.set('search', search);

			// Add state_ids if states are selected
			for (const state of selectedStates) {
				params.append('state_ids', String(state.id));
			}

			const response = await fetch(`/api/filters/districts?${params.toString()}`);
			if (response.ok) {
				const data = await response.json();
				districtList = data.items ?? [];
			}
		} catch (error) {
			console.error('Failed to fetch districts:', error);
			districtList = [];
		} finally {
			isLoading = false;
		}
	}

	// Load districts on mount
	$effect(() => {
		loadDistricts();
	});

	// Re-fetch districts when selected states change
	$effect(() => {
		const stateIds = selectedStates?.map((state) => String(state.id)).join(',') || '';

		if (stateIds !== previousStateIds) {
			previousStateIds = stateIds;
			loadDistricts();

			// Filter out districts that don't belong to selected states
			if (selectedStates.length > 0 && districts.length > 0 && districtList.length > 0) {
				const selectedStateIds = selectedStates.map((state) => String(state.id));
				const validDistricts = districts.filter((district: { id: string; name: string }) => {
					const districtData = districtList.find((d) => String(d.id) === String(district.id));
					return districtData && selectedStateIds.includes(String(districtData.state_id));
				});

				if (validDistricts.length !== districts.length) {
					districts = validDistricts;
				}
			}
		}
	});
</script>

<Filteration
	bind:items={districts}
	itemName="district"
	bind:itemList={districtList}
	onSearch={loadDistricts}
	{isLoading}
	{...rest}
/>
