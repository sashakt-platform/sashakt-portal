<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import AlignJustify from '@lucide/svelte/icons/align-justify';
	import Hash from '@lucide/svelte/icons/hash';
	import Equal from '@lucide/svelte/icons/equal';
	import Route from '@lucide/svelte/icons/route';
	import CircleDot from '@lucide/svelte/icons/circle-dot';
	import { QuestionTypeEnum } from '$lib/types/question';

	let { open = $bindable(false), onSelect } = $props<{
		open: boolean;
		onSelect: (type: QuestionTypeEnum) => void;
	}>();

	const commonTypes = [
		{ label: 'Single/Multiple Choice', icon: ListChecks, type: QuestionTypeEnum.SingleChoice },
		{ label: 'Subjective', icon: AlignJustify, type: QuestionTypeEnum.Subjective },
		{ label: 'Numerical', icon: Hash, type: QuestionTypeEnum.NumericalInteger }
	];

	const advancedTypes = [
		{ label: 'Matrix Text', icon: Equal, type: QuestionTypeEnum.MatrixString },
		{ label: 'Matrix Number', icon: Equal, type: QuestionTypeEnum.MatrixNumber },
		{ label: 'Matrix Match', icon: Route, type: QuestionTypeEnum.MatrixMatch },
		{ label: 'Matrix Rating', icon: CircleDot, type: QuestionTypeEnum.MatrixRating }
	];

	function handleSelect(type: QuestionTypeEnum) {
		onSelect(type);
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title class="text-xl font-semibold">Choose Question Type</Dialog.Title>
		</Dialog.Header>

		<div class="flex flex-col gap-6 py-4">
			<!-- Commonly Used -->
			<div class="flex flex-col gap-3">
				<span class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
					>Commonly Used</span
				>
				<div class="grid grid-cols-3 gap-3">
					{#each commonTypes as { label, icon: Icon, type } (type)}
						<button
							type="button"
							class="hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
							onclick={() => handleSelect(type)}
						>
							<Icon size={18} class="text-muted-foreground" />
							{label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Advanced -->
			<div class="flex flex-col gap-3">
				<span class="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
					>Advanced</span
				>
				<div class="grid grid-cols-3 gap-3">
					{#each advancedTypes as { label, icon: Icon, type } (type)}
						<button
							type="button"
							class="hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
							onclick={() => handleSelect(type)}
						>
							<Icon size={18} class="text-muted-foreground" />
							{label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
