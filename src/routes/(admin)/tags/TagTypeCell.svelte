<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { useTerms } from '$lib/nomenclature';

	const term = useTerms();

	let {
		tagType,
		canEdit = false,
		canDelete = false,
		onEdit,
		onDelete
	}: {
		tagType: {
			id: number | string;
			name: string;
			description?: string;
			tags?: { id: number | string; name: string }[];
		};
		canEdit?: boolean;
		canDelete?: boolean;
		onEdit?: (tagType: { id: number | string; name: string; description?: string }) => void;
		onDelete?: (tagType: { id: number | string; name: string }) => void;
	} = $props();
</script>

<div class="group flex items-start justify-between">
	<div>
		<div class="font-semibold">
			{tagType.name}
			{#if tagType.tags !== undefined}
				<span class="ml-1 text-muted-foreground font-normal">
					({tagType.tags.length})
				</span>
			{/if}
		</div>
		{#if tagType.description}
			<div class="text-muted-foreground text-sm">{tagType.description}</div>
		{/if}
	</div>
	{#if canEdit || canDelete}
		<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
			{#if canEdit}
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground rounded p-1"
					onclick={() => onEdit?.(tagType)}
					title={`Edit ${term('tag_type', 'lower')}`}
				>
					<Pencil class="h-3.5 w-3.5" />
				</button>
			{/if}
			{#if canDelete}
				<button
					type="button"
					class="text-muted-foreground hover:text-destructive rounded p-1"
					onclick={() => onDelete?.(tagType)}
					title={`Delete ${term('tag_type', 'lower')}`}
				>
					<Trash2 class="h-3.5 w-3.5" />
				</button>
			{/if}
		</div>
	{/if}
</div>
