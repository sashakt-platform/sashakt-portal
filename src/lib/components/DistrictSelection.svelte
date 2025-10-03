<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Filteration from './Filteration.svelte';

	let districtList = $derived.by(() => page?.data?.districts?.items ?? []);
	let { districts = $bindable(), selectedStates = [], ...rest } = $props();

	let previousStateIds = '';

	$effect(() => {
		const stateIds = selectedStates?.map((state) => String(state.id)).join(',') || '';

		// only filter districts when states actually change
		if (stateIds !== previousStateIds && selectedStates && districts && districtList.length > 0) {
			previousStateIds = stateIds;
			const selectedStateIds = selectedStates.map((state) => String(state.id));

			// get districts from derived districtList which includes layout data
			const currentDistricts = districtList;

			if (currentDistricts.length > 0) {
				const validDistricts = districts.filter((district) => {
					const districtStateId = currentDistricts.find(
						(d) => String(d.id) === String(district.id)
					)?.state_id;
					return selectedStateIds.includes(String(districtStateId));
				});

				if (validDistricts.length !== districts.length) {
					districts = validDistricts;
				}
			}
		}
	});
</script>

<Filteration bind:items={districts} itemName="district" bind:itemList={districtList} {...rest} />
