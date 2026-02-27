<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';

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
	<main class="flex h-screen w-full flex-col overflow-x-hidden">
		<div class="shadow-lg">
			<div class="my-4 flex items-center justify-between">
				<Sidebar.Trigger class="mx-2 w-14 rounded-none border-r-2 sm:mx-4" />
				<div class="mx-4 flex-1">
					<Breadcrumbs />
				</div>
			</div>
			<hr class="w-full" />
		</div>
		<div>
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
