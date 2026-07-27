<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';

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
	<Dialog.Content class="gap-0 overflow-hidden bg-background p-0 sm:max-w-3xl">
		<Dialog.Header class="bg-card rounded-t-lg border-b px-6 py-5">
			<Dialog.Title class="text-xl font-semibold">Form Responses</Dialog.Title>
		</Dialog.Header>

		<div class="p-6">
			{#if entries.length === 0}
				<p class="text-muted-foreground text-sm">No form responses submitted.</p>
			{:else}
				<dl
					class="bg-card grid max-h-[60vh] grid-cols-1 gap-x-8 gap-y-4 overflow-y-auto rounded-lg border p-5 sm:grid-cols-2"
				>
					{#each entries as [name, value] (name)}
						<div class="flex flex-col gap-0.5">
							<dt class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
								{humanize(name)}
							</dt>
							<dd class="text-sm ">{value}</dd>
						</div>
					{/each}
				</dl>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
