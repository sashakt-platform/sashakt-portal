<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';

	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';

	let { children, data } = $props();

	const flash = getFlash(page);
	$effect(() => {
		if (!$flash) return;
		$flash.type === 'error' ? toast.error($flash.message) : toast.success($flash.message);
	});
</script>

<Sidebar.Provider>
	<AppSidebar {data} />
	<Sidebar.Trigger
		class="text-primary fixed top-1/2 left-0 z-20 hidden size-9 -translate-y-1/2 rounded-r-md border border-l-0 border-gray-300 bg-white shadow-sm peer-data-[state=collapsed]:flex hover:bg-gray-50"
	/>
	<main class="flex h-screen w-full flex-col overflow-x-hidden">
		<div class="flex-1 overflow-y-auto">
			<Toaster richColors />
			{@render children?.()}
		</div>
	</main>
</Sidebar.Provider>

<style>
	:global(body) {
		background-color: #f0f9ff;
	}
</style>
