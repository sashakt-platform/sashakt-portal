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
			const currentStateIds = url.searchParams.get('selected_state_ids') || '';

			// update URL if it's different from current
			if (stateIds !== currentStateIds) {
				if (stateIds) {
					url.searchParams.set('selected_state_ids', stateIds);
				} else {
					url.searchParams.delete('selected_state_ids');
				}
				goto(url, { keepFocus: true, invalidateAll: true, replaceState: true });
			}

			// remove districts that don't belong to selected states
			if (selectedStates && districts) {
				const selectedStateIds = selectedStates.map((state) => String(state.id));
				const currentDistricts = page?.data?.districts?.items ?? [];

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
