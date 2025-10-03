<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Filteration from './Filteration.svelte';

	let districtList = $derived.by(() => page?.data?.districts?.items ?? []);
	let { districts = $bindable(), selectedStates = [], ...rest } = $props();

	let previousStateIds = '';

	$effect(() => {
		const stateIds = selectedStates?.map((state) => String(state.id)).join(',') || '';

		// update if state selection actually changed
		if (stateIds !== previousStateIds) {
			previousStateIds = stateIds;

			const url = new URL(page.url);

			// let's use values in state for updating url
			if (stateIds) {
				url.searchParams.set('selected_state_ids', stateIds);
			} else {
				url.searchParams.delete('selected_state_ids');
			}
			goto(url, { keepFocus: true, invalidateAll: true, replaceState: true });

			// only filter districts when states actually change
			if (selectedStates && districts && page?.data?.districts?.items) {
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
		}
	});
</script>

<Filteration bind:items={districts} itemName="district" bind:itemList={districtList} {...rest} />
