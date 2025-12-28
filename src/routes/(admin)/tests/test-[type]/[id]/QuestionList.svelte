<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import QuestionSelectionDialog from './question-selection/QuestionSelectionDialog.svelte';
	import SelectedQuestionsList from './question-selection/SelectedQuestionsList.svelte';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '$lib/components/ui/label';
	import TestPaper from '$lib/icons/TestPaper.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { Filter } from '$lib/types/filters';

	let { formData, questions, questionParams } = $props();
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

<QuestionSelectionDialog bind:open={dialogOpen} {questions} {questionParams} {formData} />

<div class="mx-auto flex h-dvh">
	<div class="mx-auto w-full p-4 sm:p-8 md:p-12 lg:p-20">
		<div
			class="mb-6 flex h-fit flex-col gap-4 rounded-lg bg-white p-4 shadow-lg sm:mb-8 sm:flex-row sm:items-center"
		>
			<div class="flex items-center gap-3">
				<div class="flex h-full w-fit shrink-0">
					<TestPaper />
				</div>
				<p class="text-base font-semibold sm:text-lg">Selection</p>
			</div>
			<RadioGroup.Root
				bind:value={questionSelectionMode}
				class="flex w-full flex-col gap-4 sm:mx-auto sm:flex-row sm:justify-center sm:gap-8"
			>
				<div class="flex w-fit items-center space-x-2">
					<RadioGroup.Item
						id="manual"
						value="manual"
						onclick={() => ($formData.random_tag_count = [])}
					/>
					<Label for="manual"
						><p class="font-bold">Manual</p>
						<p class="text-sm font-extralight">Select from the Question Bank</p></Label
					>
				</div>
				<div class="flex w-fit flex-row items-center gap-4">
					<div class="flex w-fit flex-row items-center space-x-2">
						<RadioGroup.Item
							id="tagBased"
							value="tagBased"
							onclick={() => (($formData.question_revision_ids = []), setDefaultTagsRandom())}
						/>
						<Label for="tagBased"
							><p class="font-bold">Random</p>
							<p class="text-sm font-extralight">Based on the Tags</p>
						</Label>
					</div>
				</div>
			</RadioGroup.Root>
		</div>
		<div
			class="mb-2 flex min-h-1/6 flex-col gap-4 rounded-t-xl rounded-b-sm border bg-white p-4 shadow-lg sm:flex-row sm:items-center"
		>
			<div class="hidden h-full items-center sm:flex">
				<TestPaper />
			</div>
			<div class="flex h-full w-full flex-col gap-4 md:flex-row md:gap-8">
				<div class="flex w-full flex-col md:w-1/2">
					<div class="flex">
						<p class="font-bold">{$formData.name}</p>
					</div>
					<div class="flex flex-wrap items-center gap-2 text-sm sm:flex-row">
						<span
							class="my-2 rounded-sm bg-[#E8F1F7] p-1 px-2 text-xs font-bold sm:my-4 sm:mr-4 sm:text-sm"
							>{$formData.is_template ? 'TEST TEMPLATE' : 'TEST SESSION'}</span
						>
						<span class="text-gray-500"
							>{totalSelectedCount}
							{totalSelectedCount === 1 ? 'question' : 'questions'}
						</span>
					</div>
				</div>
				{#if questionSelectionMode == 'tagBased'}
					<div class="my-auto flex w-full flex-col justify-center align-middle md:w-1/2">
						<TagsSelection bind:tags={$formData.random_tag_count} />
					</div>
				{/if}
				{#if $formData.question_revision_ids.length != 0}
					<div class="my-auto flex md:ml-auto">
						<Button class="w-full sm:w-auto" onclick={() => (dialogOpen = true)}
							>Select More Questions</Button
						>
					</div>
				{/if}
			</div>
		</div>

		<div
			class="my-auto flex h-full justify-center rounded-t-sm rounded-b-xl border bg-white p-4 pb-48 shadow-lg md:pb-28"
		>
			{#if questionSelectionMode == 'manual'}
				{#if $formData.question_revision_ids.length == 0}
					<div class="my-auto text-center">
						<p class="text-lg font-bold">Shortlist your Questions</p>
						<p class="text-sm text-gray-400">
							Add the relevant questions to your test {$formData.is_template ? 'template' : ''}
						</p>
						<Button
							class="mt-6 bg-[#0369A1]"
							onclick={() => {
								dialogOpen = true;
								const url = new URL(page.url);
								url.searchParams.delete('state_ids');
								goto(url, { keepFocus: true, invalidateAll: true });
							}}>Select from question bank</Button
						>
					</div>
				{:else}
					<SelectedQuestionsList
						selectedQuestions={$formData.question_revisions || []}
						bind:selectedQuestionIds={$formData.question_revision_ids}
						onRemoveQuestion={handleRemoveQuestion}
					/>
				{/if}
			{:else if questionSelectionMode == 'tagBased'}
				{#if $formData.random_tag_count.length == 0}
					<div class="my-auto text-center">
						<p class="text-sm text-gray-400">
							No tags selected. Please select tags to enable random question for the test.
						</p>
					</div>
				{:else}
					<div class="flex h-full w-full flex-col gap-4 overflow-auto">
						<div class="flex flex-col">
							<p class="text-base font-bold sm:text-lg">Random Configuration</p>
							<p class="text-sm text-gray-400">Enter number of questions for the selected Tags</p>
						</div>
						<div class="flex flex-col">
							{#each $formData.random_tag_count as tag (tag.id)}
								<div
									class="m-2 flex flex-col gap-2 rounded p-2 text-sm sm:m-4 sm:flex-row sm:items-center sm:gap-0"
								>
									<span class="w-full font-medium sm:w-1/4 sm:font-normal">{tag.name}</span>
									<div class="w-full sm:w-3/4">
										<Input
											type="number"
											placeholder="No of questions"
											class="rounded border p-2 sm:ml-2"
											bind:value={tag.count}
										/>
										<small class="mt-1 block text-red-400 sm:ml-2"
											>{tag.count && (isNaN(Number(tag.count)) || Number(tag.count) <= 0)
												? 'Enter a positive integer'
												: ''}</small
										>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
