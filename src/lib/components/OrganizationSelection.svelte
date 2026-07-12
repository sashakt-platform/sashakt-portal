<script lang="ts">
	import Filteration from './Filteration.svelte';

	let { organizations = $bindable(), ...rest } = $props();
	let organizationList = $state<{ id: string; name: string }[]>([]);
	let isLoading = $state(false);

	async function loadOrganizations(search = '') {
		isLoading = true;
		try {
			const response = await fetch(
				`/api/filters/organizations?search=${encodeURIComponent(search)}`
			);
			if (response.ok) {
				const data = await response.json();
				organizationList = data.items ?? [];
			}
		} catch (error) {
			console.error('Failed to fetch organizations:', error);
			organizationList = [];
		} finally {
			isLoading = false;
		}
	}

	// Load organizations on mount
	$effect(() => {
		loadOrganizations();
	});
</script>

<Filteration
	bind:items={organizations}
	itemName="organization"
	bind:itemList={organizationList}
	onSearch={loadOrganizations}
	{isLoading}
	{...rest}
/>
