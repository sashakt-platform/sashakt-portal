<script lang="ts">
	import type { Component } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import MediaDisplay from '$lib/components/MediaDisplay.svelte';
	import type { TMedia } from '$lib/types/media';
	import { QuestionTypeEnum } from '$lib/types/question';
	import RichText from '$lib/components/RichText.svelte';
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
	const media = $derived(data.media);
	const optionMediaMap = $derived(data.optionMediaMap ?? {});
	const validOptions = $derived(
		Array.isArray(data.options)
			? data.options.filter((opt) => opt.value.trim() !== '' || optionMediaMap[opt.id as number])
			: []
	);
	const matrixRows = $derived(
		data.matrix?.rows?.filter((r) => r.value.trim() !== '' || optionMediaMap[r.id]) ?? []
	);
	const matrixColumns = $derived(
		data.matrix?.columns?.filter((c) => c.value.trim() !== '' || optionMediaMap[c.id]) ?? []
	);

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

	function toggleReview() {
		markedForReview = !markedForReview;
	}

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

{#snippet reviewButton(variant: 'mobile' | 'desktop')}
	{#if variant === 'mobile'}
		<button
			type="button"
			onclick={toggleReview}
			class="mx-auto mt-2 mb-5 flex items-center justify-center gap-1.5 text-sm {markedForReview
				? 'text-primary'
				: 'text-muted-foreground'}"
		>
			<Flag size={13} />
			Mark for Review
		</button>
	{:else}
		<button
			type="button"
			onclick={toggleReview}
			class="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors {markedForReview
				? 'border-primary bg-primary/10 text-primary'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			<Flag size={13} />
			Review
		</button>
	{/if}
{/snippet}

{#snippet viewModeButton(
	mode: 'mobile' | 'desktop',
	Icon: Component<{ size?: number }>,
	label: string
)}
	<button
		type="button"
		onclick={() => (viewMode = mode)}
		class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors {viewMode ===
		mode
			? 'bg-background text-primary font-medium shadow-sm'
			: 'text-muted-foreground hover:text-foreground'}"
	>
		<Icon size={14} />
		{label}
	</button>
{/snippet}

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
		<Dialog.Header class="flex flex-row items-center justify-between space-y-0 border-b px-8 py-4">
			<Dialog.Title class="text-base font-semibold">Question Preview</Dialog.Title>

			<div class="flex items-center gap-3">
				<div class="bg-muted flex items-center rounded-lg border p-1">
					{@render viewModeButton('mobile', Smartphone, 'Mobile')}
					{@render viewModeButton('desktop', Monitor, 'Desktop')}
				</div>

				<Dialog.Close
					aria-label="Close"
					class="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center rounded-md p-2 transition-colors"
				>
					<X size={22} />
				</Dialog.Close>
			</div>
		</Dialog.Header>

		<div class="bg-muted/30 flex flex-1 items-start justify-center overflow-y-auto p-10">
			{#if viewMode === 'mobile'}
				<div
					class="border-foreground/80 bg-background relative mx-auto w-100 rounded-2xl border-[3px]"
					style="min-height: 553px;"
				>
					<div class="overflow-y-auto px-4" style="max-height: 553px;">
						{@render questionCard()}
						{@render reviewButton('mobile')}
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

{#snippet matrixColumnCard(
	label: string,
	items: MatrixItem[],
	mediaMap: Record<number, TMedia | null>
)}
	<div class="border-border overflow-hidden rounded-xl border">
		<div class="bg-muted border-b px-4 py-2.5 text-center">
			<p class="text-foreground text-xs font-semibold tracking-wide uppercase">{label}</p>
		</div>
		<div class="divide-border divide-y">
			{#each items as item (item.id)}
				<div class="flex items-start gap-4 px-4 py-3">
					<span class="text-foreground w-5 shrink-0 text-sm font-semibold">{item.key}</span>
					<div class="flex-1">
						<span class="text-foreground text-sm"
							><RichText content={item.value} as="span" class="[&_p]:m-0 [&_p]:inline" /></span
						>
						{#if mediaMap[item.id]}
							<MediaDisplay media={mediaMap[item.id]} />
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet questionCard()}
	<div class="p-4">
		<div class="mb-3 flex items-center gap-2">
			<span
				class="bg-primary/15 text-primary flex h-8 w-8 items-center justify-center rounded-lg px-1 text-xs font-bold"
			>
				Q1
			</span>
			<div class="flex-1"></div>

			<div class="relative">
				<button
					type="button"
					onclick={() => (marksExpanded = !marksExpanded)}
					class="bg-background border-border flex h-8 w-36.5 items-center justify-between gap-1.5 rounded-full border pr-3 pl-3.5 text-xs"
				>
					<span class="text-foreground">Marks:</span>
					<span class="font-medium text-success">+{marking.correct}</span>

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
							<span class="font-medium text-success">+{marking.correct}</span>
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
				{@render reviewButton('desktop')}
			{/if}
		</div>

		{#if data.questionText.trim()}
			<p
				class="text-foreground my-2 pt-4 font-[Open_Sans] text-[14px] leading-[140%] font-semibold tracking-[0px]"
			>
				<RichText
					content={data.questionText}
					class="text-foreground min-w-0 flex-1 text-base/normal font-medium [&_p]:m-0"
				/>
				{#if data.isMandatory}
					<span class="text-destructive ml-0.5">*</span>
				{/if}
			</p>
		{:else}
			<p class="text-muted-foreground mb-1 text-sm italic">Enter your question to see preview...</p>
		{/if}

		{#if data.instructions}
			<RichText content={data.instructions} class="text-muted-foreground mt-2 text-sm [&_p]:m-0" />
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
							<Label
								for={uid}
								class="flex w-full cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors {selectedSingleChoice ===
								opt.key
									? 'border-primary bg-primary/5'
									: 'hover:bg-muted/50'}"
							>
								<RadioGroup.Item value={opt.key} id={uid} class="mt-0.5 shrink-0" />
								<div class="flex flex-col gap-2">
									<RichText content={opt.value} class="min-w-0 flex-1 [&_p]:m-0" />
									{#if optionMediaMap[opt.id as number]}
										<MediaDisplay media={optionMediaMap[opt.id as number]} />
									{/if}
								</div>
							</Label>
						{/each}
					</RadioGroup.Root>
				{:else}
					<p class="text-muted-foreground text-sm italic">Add options to see them in preview...</p>
				{/if}
			{:else if data.questionType === QuestionTypeEnum.MultiChoice && validOptions.length > 0}
				{#each validOptions as opt (opt.key)}
					{@const uid = `${previewId}-${opt.key}`}
					<Label
						for={uid}
						class="flex w-full cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors {selectedMultiChoices[
							opt.key
						]
							? 'border-primary bg-primary/5'
							: 'hover:bg-muted/50'}"
					>
						<Checkbox
							id={uid}
							checked={selectedMultiChoices[opt.key] || false}
							onCheckedChange={(checked) => (selectedMultiChoices[opt.key] = checked === true)}
							class="mt-0.5 shrink-0"
						/>
						<div class="flex flex-col gap-2">
							<RichText content={opt.value} class="min-w-0 flex-1 [&_p]:m-0" />
							{#if optionMediaMap[opt.id as number]}
								<MediaDisplay media={optionMediaMap[opt.id as number]} />
							{/if}
						</div>
					</Label>
				{/each}
			{:else if data.questionType === QuestionTypeEnum.NumericalInteger || data.questionType === QuestionTypeEnum.NumericalDecimal}
				<Input type="number" class="w-full" bind:value={numberAnswer} inputmode="numeric" />
			{:else if data.questionType === QuestionTypeEnum.MatrixRating}
				{#if matrixRows.length > 0 && matrixColumns.length > 0}
					<div class="border-border overflow-x-auto rounded-xl border">
						<table class="w-full border-collapse text-sm">
							<thead>
								<tr>
									<th
										class="bg-muted text-foreground border-b px-4 py-3 text-left text-xs font-semibold"
									>
										{data.matrix?.rowLabel || 'Item'}
									</th>
									{#each matrixColumns as col (col.id)}
										<th
											class="bg-muted text-foreground border-b px-4 py-3 text-center text-xs font-semibold"
										>
											{col.value || col.key}
										</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each matrixRows as row (row.id)}
									<tr class="border-b last:border-b-0">
										<td class="text-foreground px-4 py-3 text-sm font-medium">
											<RichText content={row.value} class="[&_p]:m-0" />
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
						{@render matrixColumnCard(
							data.matrix?.rowLabel || 'Column 1',
							matrixRows,
							optionMediaMap
						)}
						{@render matrixColumnCard(
							data.matrix?.colLabel || 'Column 2',
							matrixColumns,
							optionMediaMap
						)}
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
										<th class="w-12 border-b px-3 py-3"></th>
										{#each matrixColumns as col (col.id)}
											<th class="border-b px-5 py-3 text-center text-xs font-semibold">
												{col.key}
											</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each matrixRows as row (row.id)}
										<tr class="border-b last:border-b-0">
											<td class="text-foreground px-3 py-3 text-center text-xs font-semibold">
												{row.key}
											</td>
											{#each matrixColumns as col (col.id)}
												{@const isChecked = (matrixSelections[row.key] ?? []).includes(col.id)}
												<td class="px-5 py-3">
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
					<div class="border-border overflow-x-auto rounded-xl border">
						<table class="w-full border-collapse text-sm">
							<thead>
								<tr>
									<th
										class="bg-muted text-foreground w-1/2 border-b px-4 py-3 text-left text-xs font-semibold"
									>
										{data.matrix?.rowLabel || 'Questions'}
									</th>
									<th
										class="bg-muted text-foreground w-1/2 border-b px-4 py-3 text-left text-xs font-semibold"
									>
										{data.matrix?.colLabel || 'Answer'}
									</th>
								</tr>
							</thead>
							<tbody>
								{#each matrixRows as row (row.id)}
									<tr class="border-b last:border-b-0">
										<td class="text-foreground px-4 py-3 text-sm font-medium">
											{row.value}
										</td>
										<td class="px-4 py-3">
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
