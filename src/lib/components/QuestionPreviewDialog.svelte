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
	import Flag from '@lucide/svelte/icons/flag';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import X from '@lucide/svelte/icons/x';

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

	let viewMode: 'mobile' | 'desktop' = $state('mobile');
	let marksExpanded = $state(false);
	let markedForReview = $state(false);

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
		marksExpanded = false;
		markedForReview = false;
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
		showCloseButton={false}
		class="flex flex-col gap-0 overflow-hidden rounded-xl p-0"
		style="width: 1200px; max-width: 95vw; height: 700px; max-height: 90vh;"
	>
		<div class="flex items-center justify-between border-b px-8 py-4">
			<!-- Left: Title -->
			<h2 class="text-base font-semibold">Question Preview</h2>

			<!-- Right: Buttons + Close -->
			<div class="flex items-center gap-3">
				<div class="bg-muted flex items-center rounded-lg border p-1">
					<button
						type="button"
						onclick={() => (viewMode = 'mobile')}
						class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors {viewMode ===
						'mobile'
							? 'bg-background text-primary font-medium shadow-sm'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						<Smartphone size={14} />
						Mobile
					</button>

					<button
						type="button"
						onclick={() => (viewMode = 'desktop')}
						class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors {viewMode ===
						'desktop'
							? 'bg-background text-primary font-medium shadow-sm'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						<Monitor size={14} />
						Desktop
					</button>
				</div>

				<Dialog.Close
					aria-label="Close"
					class="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center rounded-md p-2 transition-colors"
				>
					<X size={22} />
				</Dialog.Close>
			</div>
		</div>

		<div class="bg-muted/30 flex flex-1 items-start justify-center overflow-y-auto p-10">
			{#if viewMode === 'mobile'}
				<div
					class="border-foreground/80 bg-background relative mx-auto w-100 rounded-2xl border-[3px]"
					style="min-height: 424px;"
				>
					<div class=" overflow-y-auto px-4" style="max-height: 424px;">
						{@render questionCard()}
						<button
							type="button"
							onclick={() => (markedForReview = !markedForReview)}
							class="mt-4 flex w-full items-center justify-center gap-1.5 text-sm {markedForReview
								? 'text-primary'
								: 'text-muted-foreground'}"
						>
							<Flag size={13} />
							Mark for Review
						</button>
					</div>
				</div>
			{:else}
				<div class="border-foreground/80 bg-background w-full overflow-hidden rounded-2xl border-2">
					{@render questionCard()}
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>

{#snippet questionCard()}
	<div class="p-4">
		<div class="mb-3 flex items-center gap-2">
			<span
				class="bg-primary/15 text-primary flex h-8 w-8 items-center justify-center rounded-[8px] px-1 text-xs font-bold"
			>
				Q1
			</span>
			<div class="flex-1"></div>

			<div class="relative">
				<button
					type="button"
					onclick={() => (marksExpanded = !marksExpanded)}
					class="bg-background flex h-8 w-36.5 items-center justify-between gap-1.5 rounded-[999px] border border-[#D1D1D1] pr-3 pl-3.5 text-xs"
				>
					<span class="text-foreground">Marks:</span>
					<span class="font-medium text-green-600">+{marking.correct}</span>

					{#if marking.wrong !== 0}
						<span class="text-destructive font-medium">-{Math.abs(marking.wrong)}</span>
					{/if}

					<ChevronDown
						size={12}
						class="text-muted-foreground transition-transform {marksExpanded ? 'rotate-180' : ''}"
					/>
				</button>

				{#if marksExpanded}
					<div
						class="bg-background absolute top-full right-0 z-20 mt-1 w-40 rounded-lg border p-3 shadow-md"
					>
						<div class="flex items-center justify-between text-xs">
							<span class="text-muted-foreground">Correct</span>
							<span class="font-medium text-green-600">+{marking.correct}</span>
						</div>
						{#if marking.wrong !== 0}
							<div class="mt-1 flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Wrong</span>
								<span class="text-destructive font-medium">-{Math.abs(marking.wrong)}</span>
							</div>
						{/if}
						<div class="mt-1 flex items-center justify-between text-xs">
							<span class="text-muted-foreground">Skipped</span>
							<span class="font-medium">{marking.skipped}</span>
						</div>
					</div>
				{/if}
			</div>

			{#if viewMode === 'desktop'}
				<button
					type="button"
					onclick={() => (markedForReview = !markedForReview)}
					class="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors {markedForReview
						? 'border-primary bg-primary/10 text-primary'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					<Flag size={12} />
					Review
				</button>
			{/if}
		</div>

		{#if data.questionText.trim()}
			<p
				class="text-foreground my-2 pt-4 font-[Open_Sans] text-[14px] leading-[140%] font-semibold tracking-[0px]"
			>
				{data.questionText}
				{#if data.isMandatory}
					<span class="text-destructive ml-0.5">*</span>
				{/if}
			</p>
		{:else}
			<p class="text-muted-foreground mb-1 text-sm italic">Enter your question to see preview...</p>
		{/if}

		{#if data.instructions}
			<p class="text-muted-foreground mb-3 text-xs">{data.instructions}</p>
		{/if}

		<MediaDisplay {media} />

		<div class="mt-3 flex flex-col gap-2">
			{#if data.questionType === QuestionTypeEnum.Subjective}
				<Textarea
					placeholder="Type your answer here..."
					bind:value={subjectiveAnswer}
					class="min-h-20 text-sm"
				/>
			{:else if data.questionType === QuestionTypeEnum.SingleChoice}
				{#if validOptions.length > 0}
					<RadioGroup.Root bind:value={selectedSingleChoice}>
						{#each validOptions as opt (opt.key)}
							{@const uid = `${previewId}-${opt.key}`}
							<div>
								<Label
									for={uid}
									class="flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors {selectedSingleChoice ===
									opt.key
										? 'border-primary bg-primary/5'
										: 'hover:bg-muted/50'}"
								>
									<RadioGroup.Item value={opt.key} id={uid} />
									<span>{opt.value}</span>
								</Label>
								{#if optionMediaMap[opt.id as number]}
									<MediaDisplay media={optionMediaMap[opt.id as number]} />
								{/if}
							</div>
						{/each}
					</RadioGroup.Root>
				{:else}
					<p class="text-muted-foreground text-sm italic">Add options to see them in preview...</p>
				{/if}
			{:else if data.questionType === QuestionTypeEnum.MultiChoice && validOptions.length > 0}
				{#each validOptions as opt (opt.key)}
					{@const uid = `${previewId}-${opt.key}`}
					<div>
						<Label
							for={uid}
							class="flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors {selectedMultiChoices[
								opt.key
							]
								? 'border-primary bg-primary/5'
								: 'hover:bg-muted/50'}"
						>
							<Checkbox
								id={uid}
								checked={selectedMultiChoices[opt.key] || false}
								onCheckedChange={(checked) => (selectedMultiChoices[opt.key] = checked === true)}
							/>
							<span>{opt.value}</span>
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
					<div class="border-border overflow-hidden overflow-x-auto rounded-xl border">
						<table class="w-full border-collapse text-sm">
							<thead>
								<tr>
									<th
										class="border-border bg-muted text-foreground border-b px-4 py-3 text-left font-semibold {viewMode === 'desktop' ? 'text-sm' : 'text-xs'}"
									>
										{data.matrix?.rowLabel || 'Item'}
									</th>
									{#each matrixColumns as col (col.id)}
										<th
											class="border-border bg-muted text-foreground border-b px-4 py-3 text-center font-semibold {viewMode === 'desktop' ? 'text-sm' : 'text-xs'}"
										>
											{col.value || col.key}
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each matrixRows as row (row.id)}
									<tr class="border-border border-b last:border-b-0">
										<td class="text-foreground px-4 py-3 text-sm font-medium">
											{row.value}
										</td>
										{#each matrixColumns as col (col.id)}
											<td class="px-4 py-3 text-center">
												<button
													type="button"
													role="radio"
													aria-checked={matrixRatingSelections[row.key] === String(col.id)}
													class="mx-auto flex size-4 items-center justify-center rounded-full border transition-colors {matrixRatingSelections[
														row.key
													] === String(col.id)
														? 'border-primary'
														: 'border-muted-foreground hover:border-foreground'}"
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
					<p class="text-muted-foreground text-sm italic">Add items to see them in preview...</p>
				{/if}
			{:else if data.questionType === QuestionTypeEnum.MatrixMatch}
				{#if matrixRows.length > 0 && matrixColumns.length > 0}
					<div class={viewMode === 'desktop' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-3'}>
						<div class="border-border overflow-hidden rounded-xl border">
							<div class="bg-muted border-border border-b px-4 py-2.5 text-center">
								<p class="text-foreground text-xs font-semibold tracking-wide uppercase">
									{data.matrix?.rowLabel || 'Column 1'}
								</p>
							</div>
							<div class="divide-border divide-y">
								{#each matrixRows as row (row.id)}
									<div class="flex items-start gap-4 px-4 py-3">
										<span class="text-foreground w-5 shrink-0 text-sm font-semibold">{row.key}</span
										>
										<div class="flex-1">
											<span class="text-foreground text-sm">{row.value}</span>
											{#if optionMediaMap[row.id]}
												<MediaDisplay media={optionMediaMap[row.id]} />
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>

						<div class="border-border overflow-hidden rounded-xl border">
							<div class="bg-muted border-border border-b px-4 py-2.5 text-center">
								<p class="text-foreground text-xs font-semibold tracking-wide uppercase">
									{data.matrix?.colLabel || 'Column 2'}
								</p>
							</div>
							<div class="divide-border divide-y">
								{#each matrixColumns as col (col.id)}
									<div class="flex items-start gap-4 px-4 py-3">
										<span class="text-foreground w-5 shrink-0 text-sm font-semibold">{col.key}</span
										>
										<div class="flex-1">
											<span class="text-foreground text-sm">{col.value}</span>
											{#if optionMediaMap[col.id]}
												<MediaDisplay media={optionMediaMap[col.id]} />
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>

					<div
						class={viewMode === 'desktop'
							? 'mt-3 flex justify-center'
							: 'border-border mt-3 overflow-x-auto rounded-xl border'}
					>
						<div
							class={viewMode === 'desktop'
								? 'border-border w-3/5 min-w-70 overflow-hidden rounded-xl border'
								: ''}
						>
							<table class="w-full border-collapse text-sm">
								<thead>
									<tr class="bg-muted">
										<th class="border-border w-12 border-b px-3 py-3"></th>
										{#each matrixColumns as col (col.id)}
											<th
												class="border-border justify-center border-b px-5 py-3 text-center text-xs font-semibold last:border-r-0"
											>
												{col.key}
											</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each matrixRows as row (row.id)}
										<tr class="border-border border-b last:border-b-0">
											<td
												class="border-border text-foreground px-3 py-3 text-center align-middle text-xs font-semibold"
											>
												{row.key}
											</td>
											{#each matrixColumns as col (col.id)}
												{@const isChecked = (matrixSelections[row.key] ?? []).includes(col.id)}
												<td class="border-border px-5 py-3 last:border-r-0">
													<div class="flex items-center justify-center">
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
													</div>
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{:else}
					<p class="text-muted-foreground text-sm italic">Add items to see them in preview...</p>
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
										class="border-border bg-muted text-foreground w-1/2 border px-4 py-3 text-left text-xs font-semibold"
									>
										{data.matrix?.rowLabel || 'Questions'}
									</th>
									<th
										class="border-border bg-muted text-foreground w-1/2 border px-4 py-3 text-left text-xs font-semibold"
									>
										{data.matrix?.colLabel || 'Answer'}
									</th>
								</tr>
							</thead>
							<tbody>
								{#each matrixRows as row (row.id)}
									<tr>
										<td class="border-border text-foreground border px-4 py-3 text-sm font-medium">
											{row.value}
										</td>
										<td class="border-border border px-4 py-3">
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
					<p class="text-muted-foreground text-sm italic">Add items to see them in preview...</p>
				{/if}
			{:else}
				<p class="text-muted-foreground text-sm italic">Add options to see them in preview...</p>
			{/if}
		</div>
	</div>
{/snippet}
