<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Badge from '$lib/components/ui/badge/badge.svelte';

	interface Props {
		tags: Array<{ name: string; tag_type?: { name: string } }>;
	}
	let { tags = [] }: Props = $props();

	const formattedTags = $derived(
		tags.map((tag) => {
			const tagTypeName = tag.tag_type?.name ?? '';
			return tagTypeName ? `${tag.name} (${tagTypeName})` : tag.name;
		})
	);

	const visibleTags = $derived(formattedTags.slice(0, 2));
	const overflowCount = $derived(Math.max(0, formattedTags.length - 2));
	const tooltipText = $derived(formattedTags.join(', '));
</script>

{#if formattedTags.length > 0}
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<div class="flex max-w-full items-center gap-1 overflow-hidden">
					{#each visibleTags as tag}
						<Badge
							variant="secondary"
							class="bg-muted text-muted-foreground max-w-40 shrink-0 border-transparent"
						>
							<span class="truncate">{tag}</span>
						</Badge>
					{/each}
					{#if overflowCount > 0}
						<Badge
							variant="secondary"
							class="bg-muted text-muted-foreground shrink-0 border-transparent"
						>
							+{overflowCount}
						</Badge>
					{/if}
				</div>
			</Tooltip.Trigger>
			<Tooltip.Content
				class="border-border bg-popover text-popover-foreground max-w-xs rounded-md border p-3 text-xs shadow-lg/20"
				side="bottom"
				sideOffset={8}
				align="start"
			>
				<p>{tooltipText}</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}
