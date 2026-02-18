<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';

	interface Props {
		text: string;
		maxWidth?: string;
	}
	let { text, maxWidth = 'max-w-[25vw]' }: Props = $props();
</script>

{#if text}
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<span class="block truncate {maxWidth}">{text}</span>
			</Tooltip.Trigger>
			<Tooltip.Content
				class="border-border bg-popover text-popover-foreground max-w-xs rounded-md border p-3 text-xs shadow-lg/20"
				side="bottom"
				sideOffset={8}
				align="start"
			>
				<p>{text}</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}
