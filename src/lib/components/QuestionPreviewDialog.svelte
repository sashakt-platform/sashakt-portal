<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import MediaDisplay from '$lib/components/MediaDisplay.svelte';
	import type { TMedia } from '$lib/types/media';
	import { QuestionTypeEnum } from '$lib/types/question';

	export type MatrixItem = { id: number; key: string; value: string };

	export type QuestionPreviewData = {
		questionText: string;
		questionType: string;
		options: Array<{ id: number | string; key: string; value: string }>;
		instructions?: string | null;
		markingScheme?: { correct: number; wrong: number; skipped: number };
		isMandatory?: boolean;
		media?: TMedia | null;
		optionMediaMap?: Record<number, TMedia | null>;
		matrix?: {
			rows: MatrixItem[];
			columns: MatrixItem[];
			rowLabel?: string;
			colLabel?: string;
			inputType?: 'text' | 'number';
		} | null;
	};

	let {
		open = $bindable(false),
		data,
		previewId = 'preview'
	}: {
		open: boolean;
		data: QuestionPreviewData;
		previewId?: string;
	} = $props();

	const marking = $derived(data.markingScheme || { correct: 1, wrong: 0, skipped: 0 });
	const validOptions = $derived(
		Array.isArray(data.options) ? data.options.filter((opt) => opt.value.trim() !== '') : []
	);
	const media = $derived(data.media);
	const optionMediaMap = $derived(data.optionMediaMap ?? {});
	const matrixRows = $derived(data.matrix?.rows?.filter((r) => r.value.trim() !== '') ?? []);
	const matrixColumns = $derived(data.matrix?.columns?.filter((c) => c.value.trim() !== '') ?? []);

	let selectedSingleChoice = $state('');
	let selectedMultiChoices: Record<string, boolean> = $state({});
	let subjectiveAnswer = $state('');
	let numberAnswer: number | null = $state(null);
	let matrixSelections: Record<string, number[]> = $state({});
	let matrixRatingSelections: Record<string, string> = $state({});
	let matrixInputAnswers: Record<string, string> = $state({});

	function resetSelections() {
		selectedSingleChoice = '';
		selectedMultiChoices = {};
		subjectiveAnswer = '';
		numberAnswer = null;
		matrixSelections = {};
		matrixRatingSelections = {};
		matrixInputAnswers = {};
	}
</script>

<Dialog.Root
	bind:open
	onOpenChange={(isOpen) => {
		if (!isOpen) resetSelections();
	}}
>
	<Dialog.Overlay class="fixed bg-black/30 backdrop-blur-sm" />

	<Dialog.Content
		class="bg-accent flex max-h-[90vh] w-[95vw] max-w-4xl flex-col items-start gap-6 rounded-xl p-8 shadow-2xl sm:w-[90vw]"
	>
		<h2 class="text-xl font-bold text-gray-800">Preview</h2>

		<div
			class="border-secondary w-full overflow-y-auto rounded-xl border bg-white p-6 shadow-md sm:p-8"
		>
			<div class="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
				<span class="text-sm font-medium text-gray-500">1 of 1</span>
				<span class="text-sm font-semibold text-gray-600"
					>{marking.correct}
					{marking.correct === 1 ? 'MARK' : 'MARKS'}</span
				>
			</div>
			<div class="mb-4">
				{#if data.questionText.trim()}
					<p class="text-base/normal font-medium text-gray-900">
						{data.questionText}
						{#if data.isMandatory}
							<span class="ml-1 text-red-500">*</span>
						{/if}
					</p>
				{:else}
					<p class="text-base leading-relaxed text-gray-400 italic">
						Enter your question to see preview...
					</p>
				{/if}
				{#if data.instructions}
					<p class="text-muted-foreground mt-2 text-sm">{data.instructions}</p>
				{/if}
				<MediaDisplay {media} />
			</div>

			{#if data.questionType === QuestionTypeEnum.Subjective}
				<Textarea
					placeholder="Type your answer here..."
					bind:value={subjectiveAnswer}
					class="min-h-20"
				/>
			{:else if data.questionType === QuestionTypeEnum.SingleChoice}
				{#if validOptions.length > 0}
					<RadioGroup.Root bind:value={selectedSingleChoice}>
						{#each validOptions as opt (opt.key)}
							{@const uid = `${previewId}-${opt.key}`}
							<div>
								<Label
									for={uid}
									class="flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-5 {selectedSingleChoice ===
									opt.key
										? 'bg-primary text-muted *:border-muted *:text-muted'
										: ''}"
								>
									<span>{opt.key}. {opt.value}</span>
									<RadioGroup.Item
										value={opt.key}
										id={uid}
										class={selectedSingleChoice === opt.key
											? 'border-white [&_svg]:fill-white'
											: ''}
									/>
								</Label>
								{#if optionMediaMap[opt.id as number]}
									<MediaDisplay media={optionMediaMap[opt.id as number]} />
								{/if}
							</div>
						{/each}
					</RadioGroup.Root>
				{:else}
					<p class="text-sm text-gray-400 italic">Add options to see them in preview...</p>
				{/if}
			{:else if data.questionType === QuestionTypeEnum.MultiChoice && validOptions.length > 0}
				{#each validOptions as opt (opt.key)}
					{@const uid = `${previewId}-${opt.key}`}
					<div class="mb-2">
						<Label
							for={uid}
							class="flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-5 {selectedMultiChoices[
								opt.key
							]
								? 'bg-primary text-muted *:border-muted *:text-muted'
								: ''}"
						>
							<span>{opt.key}. {opt.value}</span>
							<Checkbox
								id={uid}
								checked={selectedMultiChoices[opt.key] || false}
								onCheckedChange={(checked) => (selectedMultiChoices[opt.key] = checked === true)}
								class={selectedMultiChoices[opt.key] ? 'text-primary! border-white! bg-white!' : ''}
							/>
						</Label>
						{#if optionMediaMap[opt.id as number]}
							<MediaDisplay media={optionMediaMap[opt.id as number]} />
						{/if}
					</div>
				{/each}
			{:else if data.questionType === QuestionTypeEnum.NumericalInteger || data.questionType === QuestionTypeEnum.NumericalDecimal}
				<Input type="number" class="w-full" bind:value={numberAnswer} inputmode="numeric" />
			{:else if data.questionType === QuestionTypeEnum.MatrixRating}
				{#if matrixRows.length > 0 && matrixColumns.length > 0}
					<div class="overflow-x-auto">
						<table class="w-full border-collapse text-sm">
							<thead>
								<tr>
									<th
										class="border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700"
									>
										{data.matrix?.rowLabel || 'Item'}
									</th>
									{#each matrixColumns as col (col.id)}
										<th
											class="border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm font-semibold text-gray-700"
										>
											{col.value || col.key}
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each matrixRows as row (row.id)}
									<tr>
										<td class="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800">
											{row.value}
										</td>
										{#each matrixColumns as col (col.id)}
											<td class="border border-gray-200 px-4 py-3 text-center">
												<button
													type="button"
													role="radio"
													aria-checked={matrixRatingSelections[row.key] === String(col.id)}
													class="mx-auto flex size-4 items-center justify-center rounded-full border transition-colors
														{matrixRatingSelections[row.key] === String(col.id)
														? 'border-primary'
														: 'border-gray-400 hover:border-gray-500'}"
													onclick={() => {
														matrixRatingSelections = {
															...matrixRatingSelections,
															[row.key]: String(col.id)
														};
													}}
												>
													{#if matrixRatingSelections[row.key] === String(col.id)}
														<div class="bg-primary size-2 rounded-full"></div>
													{/if}
												</button>
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="text-sm text-gray-400 italic">Add items to see them in preview...</p>
				{/if}
			{:else if data.questionType === QuestionTypeEnum.MatrixMatch}
				{#if matrixRows.length > 0 && matrixColumns.length > 0}
					<div class="mb-5 grid grid-cols-2 gap-6 border-b border-gray-200 pb-5">
						<div>
							<p class="mb-2 text-sm font-semibold text-gray-700">
								{data.matrix?.rowLabel}
							</p>
							<div class="flex flex-col gap-3">
								{#each matrixRows as row (row.id)}
									<div>
										<p class="text-sm text-gray-800">
											<span class="font-semibold">{row.key}.</span>
											<span class="ml-1">{row.value}</span>
										</p>
										{#if optionMediaMap[row.id]}
											<MediaDisplay media={optionMediaMap[row.id]} />
										{/if}
									</div>
								{/each}
							</div>
						</div>
						<div>
							<p class="mb-2 text-sm font-semibold text-gray-700">
								{data.matrix?.colLabel}
							</p>
							<div class="flex flex-col gap-3">
								{#each matrixColumns as col (col.id)}
									<div>
										<p class="text-sm text-gray-800">
											<span class="font-semibold">{col.key}.</span>
											<span class="ml-1">{col.value}</span>
										</p>
										{#if optionMediaMap[col.id]}
											<MediaDisplay media={optionMediaMap[col.id]} />
										{/if}
									</div>
								{/each}
							</div>
						</div>
					</div>

					<div class="overflow-x-auto">
						<table class="border-collapse text-sm">
							<thead>
								<tr>
									<th class="w-10 px-3 py-2"></th>
									{#each matrixColumns as col (col.id)}
										<th class="px-5 py-2 text-center text-sm font-semibold text-gray-700">
											{col.key}
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each matrixRows as row (row.id)}
									<tr>
										<td class="px-3 py-3 text-sm font-semibold text-gray-700">{row.key}</td>
										{#each matrixColumns as col (col.id)}
											{@const isChecked = (matrixSelections[row.key] ?? []).includes(col.id)}
											<td class="px-5 py-3 text-center">
												<Checkbox
													checked={isChecked}
													onCheckedChange={() => {
														const current = matrixSelections[row.key] ?? [];
														if (current.includes(col.id)) {
															matrixSelections = {
																...matrixSelections,
																[row.key]: current.filter((id) => id !== col.id)
															};
														} else {
															matrixSelections = {
																...matrixSelections,
																[row.key]: [...current, col.id]
															};
														}
													}}
												/>
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="text-sm text-gray-400 italic">Add items to see them in preview...</p>
				{/if}
			{:else if data.questionType === QuestionTypeEnum.MatrixString || data.questionType === QuestionTypeEnum.MatrixNumber || data.questionType === QuestionTypeEnum.MatrixInput}
				{#if matrixRows.length > 0}
					{@const inputType =
						data.matrix?.inputType ??
						(data.questionType === QuestionTypeEnum.MatrixNumber ? 'number' : 'text')}
					<div class="overflow-x-auto">
						<table class="w-full border-collapse text-sm">
							<thead>
								<tr>
									<th
										class="border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700"
									>
										{data.matrix?.rowLabel || 'Questions'}
									</th>
									<th
										class="border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700"
									>
										{data.matrix?.colLabel || 'Answer'}
									</th>
								</tr>
							</thead>
							<tbody>
								{#each matrixRows as row (row.id)}
									<tr>
										<td class="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800">
											{row.value}
										</td>
										<td class="border border-gray-200 px-4 py-3">
											<Input
												type={inputType}
												class="w-full"
												bind:value={matrixInputAnswers[row.key]}
												placeholder="Enter answer..."
											/>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="text-sm text-gray-400 italic">Add items to see them in preview...</p>
				{/if}
			{:else}
				<p class="text-sm text-gray-400 italic">Add options to see them in preview...</p>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
