<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import History from '@lucide/svelte/icons/history';
	import Button from '$lib/components/ui/button/button.svelte';

	const { data } = $props();

	let revisions = data?.questionRevisions;
	let openrevisionDialog: boolean = $state(false);
</script>

<Button variant="outline" onclick={() => (openrevisionDialog = true)} class="gap-2 text-sm">
	Revision History
</Button>

<Dialog.Root bind:open={openrevisionDialog}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="text-xl font-semibold">Revision History</Dialog.Title>
		</Dialog.Header>
		<div class="w-full overflow-y-auto py-4">
			{#if revisions && revisions.length > 0}
				{#each revisions as revision, i (revision.id || revision.created_date)}
					<div class="flex gap-4">
						<!-- Date/Time -->
						<div class="flex w-28 shrink-0 flex-col text-right text-sm">
							<span class="text-foreground font-medium">
								{new Date(revision.created_date).toLocaleDateString('en-GB', {
									day: 'numeric',
									month: 'short',
									year: 'numeric'
								})}
							</span>
							<span class="text-muted-foreground text-xs">
								{new Date(revision.created_date).toLocaleTimeString('en-GB', {
									hour: 'numeric',
									minute: '2-digit',
									hour12: true
								})}
							</span>
						</div>

						<!-- Timeline dot + line -->
						<div class="flex flex-col items-center">
							<div class="bg-primary mt-1.5 h-3 w-3 shrink-0 rounded-full"></div>
							{#if i < revisions.length - 1}
								<div class="bg-border w-px flex-1"></div>
							{/if}
						</div>

						<!-- Description + username -->
						<div class="flex flex-col pb-6">
							<span class="text-sm font-semibold">
								Revision #{revisions.length - i}
							</span>
							{#if revision.created_by_id?.full_name}
								<span class="text-muted-foreground text-xs">
									{revision.created_by_id.full_name}
								</span>
							{/if}
						</div>
					</div>
				{/each}
			{:else}
				<div class="text-muted-foreground flex items-center gap-2 px-4 text-sm">
					<History class="h-4 w-4" /> No revisions found.
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
