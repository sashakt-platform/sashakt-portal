<script lang="ts">
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import MoveRight from '@lucide/svelte/icons/move-right';

	let {
		partial = $bindable(),
		labelClass = '',
		bordered = true
	}: {
		partial: { correct_answers: { num_correct_selected: number; marks: number }[] } | undefined;
		labelClass?: string;
		bordered?: boolean;
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

<div
	class={[
		bordered && 'rounded-xl border  p-4',
		bordered && (partialMarking ? 'border-primary bg-primary/5' : 'border-gray-200'),
		labelClass
	]}
>
	<label class="flex cursor-pointer items-start gap-3">
		<Checkbox checked={partialMarking} onCheckedChange={togglePartialMarking} class="mt-0.5" />
		<div>
			<p class="text-sm font-semibold text-gray-800">Partial Marking</p>
			<p class="text-sm text-gray-500">Award marks for partially correct answers</p>
		</div>
	</label>

	{#if partialMarking && partial}
		<div class="mt-4 ml-6 flex flex-col gap-6" id="partial-mark-section">
			{#each partial.correct_answers as answer, i (i)}
				<div class="flex items-center gap-6">
					<input
						type="number"
						name="marking_scheme.partial.correct_answers.{i}.num_correct_selected"
						value={partial.correct_answers[i].num_correct_selected}
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
						class="bg-gray-0 w-20 rounded-xl border border-gray-300 px-2 py-2 text-center text-sm"
					/>
					<span class="text-sm text-gray-500">Correct selected</span>
					<span class="font-light text-gray-500"><MoveRight /></span>
					<input
						type="number"
						name="marking_scheme.partial.correct_answers.{i}.marks"
						value={partial.correct_answers[i].marks}
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
						class="bg-gray-0 w-20 rounded-xl border border-gray-300 px-2 py-2 text-center text-sm"
					/>
					<span class="text-sm text-gray-500">Marks</span>
					<button
						type="button"
						data-testid="delete-partial-row"
						class="ml-auto text-gray-500 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
						disabled={partial.correct_answers.length <= 1}
						onclick={() => {
							partial = {
								...partial!,
								correct_answers: partial!.correct_answers.filter((_, idx) => idx !== i)
							};
						}}
					>
						<Trash2 size={15} />
					</button>
				</div>
			{/each}

			<button
				type="button"
				class="text-primary mt-1 flex items-center gap-1 text-sm font-medium hover:underline"
				onclick={() => {
					partial = {
						...partial!,
						correct_answers: [...partial!.correct_answers, { num_correct_selected: 1, marks: 0 }]
					};
				}}
			>
				+ Add Rule
			</button>
		</div>
	{/if}
</div>
