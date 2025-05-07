<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let { children } = $props();
</script>

<Sidebar.Provider>
	<AppSidebar />
	<main>
		<div class="my-4 flex">
			<Sidebar.Trigger class="mx-4 w-14 rounded-none border-r-2" />
			<span class="my-auto align-middle text-sm"
				>... <ChevronRight class="inline w-4 text-sm" /></span
			>
		</div>
		<hr class="w-screen" />
		{@render children?.()}
	</main>
</Sidebar.Provider>

<style>
	:global(body) {
		background-color: #f0f9ff;
	}
</style>
