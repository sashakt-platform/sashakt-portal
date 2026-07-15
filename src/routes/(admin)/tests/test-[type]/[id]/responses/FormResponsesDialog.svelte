<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	let {
		open = $bindable(false),
		formResponse
	}: {
		open: boolean;
		formResponse: Record<string, string | null> | null;
	} = $props();

	function humanize(fieldName: string) {
		return fieldName
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (char) => char.toUpperCase());
	}

	const entries = $derived(
		Object.entries(formResponse ?? {}).filter(([, value]) => value != null && value !== 'N/A')
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="text-xl font-semibold">Form Responses</Dialog.Title>
		</Dialog.Header>

		<Separator />

		{#if entries.length === 0}
			<p class="text-muted-foreground text-sm">No form responses submitted.</p>
		{:else}
			<dl class="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
				{#each entries as [name, value] (name)}
					<div class="flex flex-col gap-0.5">
						<dt class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
							{humanize(name)}
						</dt>
						<dd class="text-sm">{value}</dd>
					</div>
				{/each}
			</dl>
		{/if}
	</Dialog.Content>
</Dialog.Root>
