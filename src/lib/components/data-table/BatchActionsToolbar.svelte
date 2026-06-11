<script lang="ts" generics="T">
	import { Button } from '$lib/components/ui/button/index.js';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';

	type BatchActionsToolbarProps<T> = {
		selectedCount: number;
		selectedRows: T[];
		selectedRowIds: string[];
		entityLabel?: string;
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
		entityLabel = 'item',
		actions = [
			{
				id: 'delete',
				label: 'Delete',
				icon: Trash2,
				variant: 'ghost' as const
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
	<div class="bg-accent flex h-10 items-center justify-between rounded-2xl border px-3">
		<div class="flex items-center gap-1">
			<span class="text-primary text-sm font-medium">
				{selectedCount}
				{selectedCount !== 1 ? `${entityLabel}s` : entityLabel} selected
			</span>
			<span class="text-muted-foreground mx-1">|</span>
			<div class="flex items-center gap-2">
				{#each actions as action}
					<Button
						size="sm"
						variant={action.variant || 'ghost'}
						class={action.variant === 'ghost' || !action.variant
							? 'text-destructive hover:text-destructive hover:bg-destructive/10'
							: ''}
						disabled={action.disabled}
						onclick={() => handleAction(action.id)}
					>
						{#if action.icon}
							{@const Icon = action.icon}
							<Icon class="mr-1 h-4 w-4" />
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
