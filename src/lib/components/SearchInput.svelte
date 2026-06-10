<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Input from '$lib/components/ui/input/input.svelte';
	import { cn } from '$lib/utils.js';

	let {
		placeholder = 'Search...',
		value = '',
		class: className,
		useResolve = false,
		debounceMs = 300,
		searchParam = 'search',
		pageParam = 'page'
	}: {
		placeholder?: string;
		value?: string;
		class?: string;
		useResolve?: boolean;
		debounceMs?: number;
		searchParam?: string;
		pageParam?: string;
	} = $props();

	let searchTimeout: ReturnType<typeof setTimeout>;

	$effect(() => () => clearTimeout(searchTimeout));

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		const inputValue = event.currentTarget.value;
		const url = new URL(page.url);
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			if (inputValue) {
				url.searchParams.set(searchParam, inputValue);
			} else {
				url.searchParams.delete(searchParam);
			}
			url.searchParams.set(pageParam, '1');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const target = useResolve ? resolve((url.pathname + url.search) as any) : url;
			goto(target, { keepFocus: true, invalidateAll: true });
		}, debounceMs);
	}
</script>

<div class={cn('relative shrink-0 lg:w-80', className)}>
	<SearchIcon
		class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-subtle-foreground"
	/>
	<Input
		class="rounded-full border border-border pl-9 placeholder:text-subtle-foreground"
		{placeholder}
		{value}
		oninput={handleInput}
	/>
</div>
