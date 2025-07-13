<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
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
	<main>
		<div class="shadow-lg">
			<div class={['my-4']}>
				<Sidebar.Trigger class="mx-4 w-14 rounded-none border-r-2" />
				<span class="my-auto align-middle text-sm"
					>... <ChevronRight class="inline w-4 text-sm" /></span
				>
			</div>
			<hr class="w-screen" />
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
