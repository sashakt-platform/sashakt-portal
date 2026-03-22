<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { enhance } from '$app/forms';

	let {
		tag,
		isEditing = false,
		editName = $bindable(''),
		canEdit = false,
		canDelete = false,
		onEdit,
		onDelete,
		onCancelEdit
	}: {
		tag: { id: number | string; name: string };
		isEditing?: boolean;
		editName?: string;
		canEdit?: boolean;
		canDelete?: boolean;
		onEdit?: (tagId: number | string, tagName: string) => void;
		onDelete?: (tagId: number | string, tagName: string) => void;
		onCancelEdit?: () => void;
	} = $props();

	let hovered = $state(false);
</script>

{#if isEditing}
	<form
		method="POST"
		action="?/updateTag"
		use:enhance={() => {
			return async ({ update }) => {
				onCancelEdit?.();
				await update();
			};
		}}
		class="inline-flex"
	>
		<input type="hidden" name="id" value={tag.id} />
		<div
			class="border-primary bg-primary/5 inline-flex items-center gap-1 rounded-full border px-3 py-1"
		>
			<input
				type="text"
				name="name"
				bind:value={editName}
				class="w-24 border-none bg-transparent text-xs font-medium outline-none"
				autofocus
				onkeydown={(e) => {
					if (e.key === 'Escape') onCancelEdit?.();
				}}
			/>
			<button type="submit" class="text-primary hover:text-primary/80" disabled={!editName.trim()}>
				<Check class="h-3.5 w-3.5" />
			</button>
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground"
				onclick={() => onCancelEdit?.()}
			>
				<X class="h-3.5 w-3.5" />
			</button>
		</div>
	</form>
{:else}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<span
		class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors
			{hovered && (canEdit || canDelete) ? 'border-primary bg-primary/5' : 'border-border bg-muted/50'}"
		onmouseenter={() => (hovered = true)}
		onmouseleave={() => (hovered = false)}
	>
		<span>{tag.name}</span>
		{#if hovered && canEdit}
			<button
				type="button"
				class="text-primary hover:text-primary/80"
				onclick={() => onEdit?.(tag.id, tag.name)}
			>
				<Check class="h-3.5 w-3.5" />
			</button>
		{/if}
		{#if hovered && canDelete}
			<button
				type="button"
				class="text-muted-foreground hover:text-destructive"
				onclick={() => onDelete?.(tag.id, tag.name)}
			>
				<X class="h-3.5 w-3.5" />
			</button>
		{/if}
	</span>
{/if}
