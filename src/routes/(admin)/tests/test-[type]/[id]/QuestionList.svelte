<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import QuestionSelectionDialog from './question-selection/QuestionSelectionDialog.svelte';
	import SelectedQuestionsList from './question-selection/SelectedQuestionsList.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { Filter } from '$lib/types/filters';
	import type { User } from '$lib/utils/permissions.js';
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import FileQuestionIcon from '@lucide/svelte/icons/file-question';
	import { useTerms } from '$lib/nomenclature';

	const term = useTerms();

	let {
		formData,
		questions,
		questionParams,
		user = null
	}: { formData: any; questions: any; questionParams: any; user?: User | null } = $props();
	let dialogOpen = $state(false);
	let questionSelectionMode: 'manual' | 'tagBased' = $state('manual');

	let totalSelectedCount = $derived(
		$formData.question_revision_ids.length > 0
			? $formData.question_revision_ids.length
			: $formData.random_tag_count.reduce((sum, t) => sum + (Number(t.count ?? 0) || 0), 0)
	);

	// Optional: auto-select mode on load when tags exist
	if ($formData.random_tag_count.length > 0 && $formData.question_revision_ids.length === 0) {
		questionSelectionMode = 'tagBased';
	}

	const setDefaultTagsRandom = () => {
		if ($formData.random_tag_count.length === 0 && $formData.tag_ids.length > 0) {
			$formData.random_tag_count = $formData.tag_ids.map((tag: Filter) => ({
				id: tag.id,
				name: tag.name
			}));
		}
	};

	const handleRemoveQuestion = (questionId: number) => {
		// remove from both IDs and question data
		$formData.question_revision_ids = $formData.question_revision_ids.filter(
			(id: number) => id !== questionId
		);
		$formData.question_revisions = $formData.question_revisions.filter(
			(question: { id: number }) => question.id !== questionId
		);
	};
</script>

<QuestionSelectionDialog bind:open={dialogOpen} {questions} {questionParams} {formData} {user} />

<div class="overflow-hidden rounded-xl border bg-white shadow-sm">
	<!-- Card header -->
	<div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-4">
			<div class="bg-primary/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
				<FileQuestionIcon class="text-primary h-5 w-5" />
			</div>
			<div>
				<p class="font-semibold">Select Questions</p>
				<p class="text-sm text-gray-500">Choose questions to include in this template</p>
			</div>
		</div>

		<!-- Pill toggle -->
		<Tabs
			bind:value={questionSelectionMode}
			class="w-fit"
			onValueChange={(v) => {
				if (v === 'manual') $formData.random_tag_count = [];
				if (v === 'tagBased') {
					$formData.question_revision_ids = [];
					setDefaultTagsRandom();
				}
			}}
		>
			<TabsList class="bg-muted rounded-full p-1">
				<TabsTrigger
					value="manual"
					class="data-[state=active]:bg-background data-[state=active]:text-primary rounded-full px-4 py-1.5 text-sm text-gray-500 data-[state=active]:font-semibold data-[state=active]:shadow"
				>
					Manual Selection
				</TabsTrigger>
				<TabsTrigger
					value="tagBased"
					class="data-[state=active]:bg-background data-[state=active]:text-primary rounded-full px-4 py-1.5 text-sm text-gray-500 data-[state=active]:font-semibold data-[state=active]:shadow"
				>
					Auto Selection
				</TabsTrigger>
			</TabsList>
		</Tabs>
	</div>

	<!-- Divider -->
	<div class="border-t"></div>

	<!-- Card body -->
	<div class="flex min-h-96 flex-col p-5">
		{#if questionSelectionMode === 'manual'}
			{#if $formData.question_revision_ids.length === 0}
				<div class="my-auto flex flex-col items-center justify-center py-16 text-center">
					<p class="text-lg font-bold">No questions yet</p>
					<p class="mt-1 text-sm text-gray-500">
						Add the relevant questions to your test {$formData.is_template ? 'template' : ''}.
					</p>
					<Button
						class="mt-6"
						onclick={() => {
							dialogOpen = true;
							const url = new URL(page.url);
							url.searchParams.delete('state_ids');
							goto(url, { keepFocus: true, invalidateAll: true });
						}}>Select from {term('question_bank')}</Button
					>
				</div>
			{:else}
				<div class="mb-4 flex items-center justify-between">
					<p class="text-primary text-sm font-semibold">
						✓ {totalSelectedCount}
						{totalSelectedCount === 1 ? 'question' : 'questions'} added
					</p>
					<button
						type="button"
						class="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-semibold hover:cursor-pointer"
						onclick={() => (dialogOpen = true)}
					>
						+ Add more questions
					</button>
				</div>
				<SelectedQuestionsList
					selectedQuestions={$formData.question_revisions || []}
					bind:selectedQuestionIds={$formData.question_revision_ids}
					onRemoveQuestion={handleRemoveQuestion}
				/>
			{/if}
		{:else if questionSelectionMode === 'tagBased'}
			<div class="flex flex-col items-center gap-4 py-8 text-center">
				<p class="text-sm text-gray-600">
					Select tags and specify how many questions to randomly pull from each.<br />
					Questions will be drawn from the question bank at test creation time.
				</p>
				<div class="w-80">
					<TagsSelection bind:tags={$formData.random_tag_count} />
				</div>
			</div>

			{#if $formData.random_tag_count.length > 0}
				<p class="text-primary mb-4 text-center text-sm font-semibold">
					{totalSelectedCount}
					{totalSelectedCount === 1 ? 'question' : 'questions'}
				</p>

				<div class="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border bg-gray-50">
					<!-- Table header -->
					<div
						class="grid grid-cols-2 bg-gray-100 px-6 py-4 text-xs font-semibold tracking-wide text-gray-500 uppercase"
					>
						<div>Tags</div>
						<div>No. of Questions</div>
					</div>

					<!-- Tag rows -->
					{#each $formData.random_tag_count as tag (tag.id)}
						<div class="grid grid-cols-2 items-center gap-4 border-t bg-white px-6 py-4">
							<span
								class="inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
							>
								{tag.name}
							</span>
							<div>
								<Input
									type="number"
									placeholder="0"
									class="w-full rounded-lg border bg-white text-center"
									bind:value={tag.count}
								/>
								{#if tag.count && (isNaN(Number(tag.count)) || Number(tag.count) <= 0)}
									<small class="mt-1 block text-red-400">Enter a positive integer</small>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
