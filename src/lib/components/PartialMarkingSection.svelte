<script lang="ts">
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Plus from '@lucide/svelte/icons/plus';
	import Button from '$lib/components/ui/button/button.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';

	let {
		partial = $bindable(),
		labelClass = ''
	}: {
		partial: { correct_answers: { num_correct_selected: number; marks: number }[] } | undefined;
		labelClass?: string;
	} = $props();

	const partialMarking = $derived(!!partial);

	function togglePartialMarking(checked: boolean) {
		if (checked) {
			partial = { correct_answers: [{ num_correct_selected: 1, marks: 0 }] };
		} else {
			partial = undefined;
		}
	}
</script>

<label class={['flex cursor-pointer items-center gap-2', labelClass]}>
	<Checkbox checked={partialMarking} onCheckedChange={togglePartialMarking} />
	<span class="text-sm font-medium">Partial Marking</span>
</label>
{#if partialMarking && partial}
	<div class="rounded-lg border border-gray-200 p-3">
		<p class="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
			Partial Marking Rules
		</p>
		<div class="flex flex-col gap-2">
			{#each partial.correct_answers as answer, i (i)}
				<div
					class="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
				>
					<div class="flex items-center gap-2">
						<p class="text-sm whitespace-nowrap text-gray-600">Correct selected</p>
						<input
							type="number"
							name="marking_scheme.partial.correct_answers.{i}.num_correct_selected"
							value={partial!.correct_answers[i].num_correct_selected}
							min="1"
							oninput={(e) => {
								const val = (e.currentTarget as HTMLInputElement).valueAsNumber;
								partial = {
									...partial!,
									correct_answers: partial!.correct_answers.map((a, j) =>
										j === i ? { ...a, num_correct_selected: val } : a
									)
								};
							}}
							class="w-20 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
						/>
					</div>
					<div class="ml-auto flex items-center gap-2">
						<p class="text-sm whitespace-nowrap text-gray-600">Marks</p>
						<input
							type="number"
							name="marking_scheme.partial.correct_answers.{i}.marks"
							value={partial!.correct_answers[i].marks}
							min="0"
							oninput={(e) => {
								const val = (e.currentTarget as HTMLInputElement).valueAsNumber;
								partial = {
									...partial!,
									correct_answers: partial!.correct_answers.map((a, j) =>
										j === i ? { ...a, marks: val } : a
									)
								};
							}}
							class="w-16 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
						/>
					</div>
					<button
						type="button"
						data-testid="delete-partial-row"
						class="hover:text-destructive border-l border-gray-200 pl-3 text-gray-400 disabled:cursor-not-allowed disabled:opacity-30"
						disabled={partial.correct_answers.length <= 1}
						onclick={() => {
							partial = {
								...partial!,
								correct_answers: partial!.correct_answers.filter((_, idx) => idx !== i)
							};
						}}><Trash2 size={15} /></button
					>
				</div>
			{/each}
		</div>
		<div class="mt-3 flex justify-end">
			<Button
				type="button"
				variant="outline"
				class="text-primary border-primary h-8 gap-1 text-sm"
				onclick={() => {
					partial = {
						...partial!,
						correct_answers: [...partial!.correct_answers, { num_correct_selected: 1, marks: 0 }]
					};
				}}><Plus size={14} /> Add Row</Button
			>
		</div>
	</div>
{/if}
