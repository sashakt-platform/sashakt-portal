<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';

	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';

	import { breadcrumbs } from '$lib/breadcrumb';
	import { toast } from 'svelte-sonner';

	let { children, data } = $props();
	const breadcrumb = $derived(breadcrumbs(page.url.pathname));
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
			<div class={['my-4 inline-flex items-center']}>
				<Sidebar.Trigger class="mx-4 w-14 rounded-none border-r-2" />

				<Breadcrumb.Root>
					<Breadcrumb.List>
						{#each breadcrumb as crumb, id (id)}
							<Breadcrumb.Item class={breadcrumb.length - 1 === id ? 'text-primary' : ''}>
								<Breadcrumb.Link class="text-base font-medium" href={crumb.href}
									>{crumb.label}</Breadcrumb.Link
								>
							</Breadcrumb.Item>
							<Breadcrumb.Separator class={breadcrumb.length - 1 === id ? 'hidden' : ''} />
						{/each}
					</Breadcrumb.List>
				</Breadcrumb.Root>
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
