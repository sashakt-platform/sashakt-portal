<script lang="ts" generics="T">
	import { Button } from '$lib/components/ui/button/index.js';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';

	type BatchActionsToolbarProps<T> = {
		selectedCount: number;
		selectedRows: T[];
		selectedRowIds: string[];
		actions?: Array<{
			id: string;
			label: string;
			icon?: any;
			variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
			disabled?: boolean;
		}>;
		onAction?: (actionId: string) => void;
		onClearSelection?: () => void;
	};

	let {
		selectedCount,
		selectedRows,
		selectedRowIds,
		actions = [
			{
				id: 'delete',
				label: 'Delete',
				icon: Trash2,
				variant: 'destructive' as const
			}
		],
		onAction,
		onClearSelection
	}: BatchActionsToolbarProps<T> = $props();

	const handleAction = (actionId: string) => {
		onAction?.(actionId);
	};

	const handleClearSelection = () => {
		onClearSelection?.();
	};
</script>

{#if selectedCount > 0}
	<div class="bg-muted/50 flex items-center justify-between rounded-lg border p-3">
		<div class="flex items-center gap-4">
			<span class="text-sm font-medium">
				{selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
			</span>
			<div class="flex items-center gap-2">
				{#each actions as action}
					<Button
						size="sm"
						variant={action.variant || 'default'}
						disabled={action.disabled}
						onclick={() => handleAction(action.id)}
					>
						{#if action.icon}
							{@const Icon = action.icon}
							<Icon class="mr-2 h-4 w-4" />
						{/if}
						{action.label}
					</Button>
				{/each}
			</div>
		</div>
		<Button size="sm" variant="ghost" onclick={handleClearSelection} aria-label="Clear selection">
			<X class="h-4 w-4" />
		</Button>
	</div>
{/if}
