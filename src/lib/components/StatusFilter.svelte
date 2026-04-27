<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	const STATUS_OPTIONS = [
		{ label: 'Active', value: 'true' },
		{ label: 'Inactive', value: 'false' }
	];

	let {
		value = '',
		useResolve = false
	}: {
		value?: string;
		useResolve?: boolean;
	} = $props();

	let open = $state(false);

	const label = $derived(value === 'true' ? 'Active' : value === 'false' ? 'Inactive' : 'Status');

	function selectStatus(selected: string) {
		const url = new URL(page.url);
		if (value === selected) {
			url.searchParams.delete('isActive');
		} else {
			url.searchParams.set('isActive', selected);
		}
		url.searchParams.set('page', '1');
		open = false;
		const target = useResolve ? resolve((url.pathname + url.search) as any) : url;
		goto(target, { replaceState: false });
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class="text-muted-foreground h-10 rounded-full {value !== ''
					? 'border-primary text-primary'
					: ''}"
			>
				{label}
				<ChevronDownIcon class="ml-1 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-36 p-1">
		{#each STATUS_OPTIONS as option (option.value)}
			<button
				type="button"
				class="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
				onclick={() => selectStatus(option.value)}
			>
				<CheckIcon class="h-4 w-4 {value === option.value ? 'text-primary' : 'text-transparent'}" />
				{option.label}
			</button>
		{/each}
	</Popover.Content>
</Popover.Root>
