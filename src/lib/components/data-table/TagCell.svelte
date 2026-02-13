<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';

	interface Props {
		tags: Array<{ name: string; tag_type?: { name: string } }>;
	}
	let { tags = [] }: Props = $props();

	const formatted = $derived(
		tags
			.map((tag) => {
				const tagTypeName = tag.tag_type?.name ?? '';
				return tagTypeName ? `${tag.name} (${tagTypeName})` : tag.name;
			})
			.join(', ')
	);
</script>

{#if formatted}
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<span class="block max-w-[25vw] truncate">{formatted}</span>
			</Tooltip.Trigger>
			<Tooltip.Content
				class="border-border bg-popover text-popover-foreground max-w-xs rounded-md border p-3 text-xs shadow-lg/20"
				side="bottom"
				sideOffset={8}
				align="start"
			>
				<p>{formatted}</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}
