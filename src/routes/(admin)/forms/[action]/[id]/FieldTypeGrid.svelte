<script lang="ts">
	import { fieldTypeLabels, fieldTypeCategories, type FormFieldTypeValue } from './schema.js';
	import { fieldTypeIcons } from './fieldTypeIcons.js';

	interface Props {
		selectedType?: string;
		onSelect: (fieldType: FormFieldTypeValue) => void;
	}

	let { selectedType, onSelect }: Props = $props();
</script>

<div class="flex flex-col gap-4">
	{#each Object.entries(fieldTypeCategories) as [category, types] (category)}
		<div class="flex flex-col gap-2">
			<div class="flex items-center gap-2">
				<span class="text-primary text-xs font-semibold tracking-wider uppercase">
					{category}
				</span>
				<div class="bg-border h-px flex-1"></div>
			</div>

			<div class="grid grid-cols-4 gap-1">
				{#each types as type (type)}
					<button
						type="button"
						class="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors {type ===
						selectedType
							? 'bg-primary/10 text-primary'
							: 'hover:bg-accent'}"
						onclick={() => onSelect(type)}
					>
						{#if fieldTypeIcons[type]}
							<span
								class="flex h-4 w-4 shrink-0 items-center {type !== selectedType
									? 'text-muted-foreground'
									: ''}"
							>
								<svelte:component this={fieldTypeIcons[type]} size={16} />
							</span>
						{/if}
						<span>{fieldTypeLabels[type]}</span>
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>
