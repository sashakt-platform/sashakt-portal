<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { enhance } from '$app/forms';
	import TagChip from './TagChip.svelte';

	let {
		tags = [],
		tagTypeId,
		canCreate = false,
		canEdit = false,
		canDelete = false,
		editingTagId = null,
		editingTagName = $bindable(''),
		onStartEdit,
		onCancelEdit,
		onDeleteTag
	}: {
		tags: { id: number | string; name: string }[];
		tagTypeId: number | string;
		canCreate?: boolean;
		canEdit?: boolean;
		canDelete?: boolean;
		editingTagId?: number | string | null;
		editingTagName?: string;
		onStartEdit?: (tagId: number | string, tagName: string) => void;
		onCancelEdit?: () => void;
		onDeleteTag?: (tagId: number | string, tagName: string) => void;
	} = $props();

	let addingTag = $state(false);
</script>

<div class="flex flex-wrap items-center gap-2">
	{#each tags as tag (tag.id)}
		<TagChip
			{tag}
			isEditing={editingTagId === tag.id}
			bind:editName={editingTagName}
			{canEdit}
			{canDelete}
			onEdit={onStartEdit}
			onDelete={onDeleteTag}
			{onCancelEdit}
		/>
	{/each}

	{#if addingTag}
		<form
			method="POST"
			action="?/createTag"
			use:enhance={() => {
				return async ({ update }) => {
					addingTag = false;
					await update();
				};
			}}
			class="inline-flex"
		>
			<input type="hidden" name="tag_type_id" value={tagTypeId} />
			<div
				class="border-primary bg-primary/5 inline-flex items-center gap-1 rounded-full border px-3 py-1"
			>
				<input
					type="text"
					name="name"
					placeholder="Tag name..."
					class="w-24 border-none bg-transparent text-xs font-medium outline-none"
					autofocus
					onkeydown={(e) => {
						if (e.key === 'Escape') addingTag = false;
					}}
				/>
				<button type="submit" class="text-primary hover:text-primary/80">
					<Check class="h-3.5 w-3.5" />
				</button>
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground"
					onclick={() => (addingTag = false)}
				>
					<X class="h-3.5 w-3.5" />
				</button>
			</div>
		</form>
	{:else if canCreate}
		<button
			type="button"
			class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-xs transition-colors"
			onclick={() => (addingTag = true)}
		>
			<Plus class="h-3.5 w-3.5" />
			Add tag
		</button>
	{/if}
</div>
