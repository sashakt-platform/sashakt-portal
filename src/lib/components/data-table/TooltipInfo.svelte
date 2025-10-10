<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Info from '@lucide/svelte/icons/info';

	export let description: string;
	export let label: string = 'Help';
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<span
				role="button"
				aria-label={label}
				aria-describedby="tooltip-info"
				class="focus-visible:ring-primary inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded text-gray-600 hover:text-gray-900 focus-visible:ring-2 focus-visible:outline-none"
			>
				<Info class="h-4 w-4" />
			</span>
		</Tooltip.Trigger>

		<Tooltip.Content
			id="tooltip-info"
			class="bg-accent text-accent-foreground max-w-xs rounded-md p-2 text-xs shadow-md"
			side="bottom"
			sideOffset={8}
			align="start"
		>
			<p>{description}</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
