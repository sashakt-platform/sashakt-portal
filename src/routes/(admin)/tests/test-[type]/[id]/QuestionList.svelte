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
					class="data-[state=active]:bg-background data-[state=active]:text-primary rounded-full px-4 py-1.5 text-sm data-[state=active]:font-semibold data-[state=active]:shadow"
				>
					Manual Selection
				</TabsTrigger>
				<TabsTrigger
					value="tagBased"
					class="data-[state=active]:bg-background data-[state=active]:text-primary rounded-full px-4 py-1.5 text-sm data-[state=active]:font-semibold data-[state=active]:shadow"
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
					<p class="mt-1 text-sm text-gray-400">
						Add the relevant questions to your test {$formData.is_template ? 'template' : ''}.
					</p>
					<Button
						class="mt-6"
						onclick={() => {
							dialogOpen = true;
							const url = new URL(page.url);
							url.searchParams.delete('state_ids');
							goto(url, { keepFocus: true, invalidateAll: true });
						}}>Select from Question Bank</Button
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
			{#if $formData.random_tag_count.length === 0}
				<div class="my-auto flex flex-col items-center justify-center py-16 text-center">
					<div class="mb-4 w-64">
						<TagsSelection bind:tags={$formData.random_tag_count} />
					</div>
					<p class="text-sm text-gray-400">
						Select tags above to enable random question selection.
					</p>
				</div>
			{:else}
				<div class="flex h-full w-full flex-col gap-4 overflow-auto">
					<div class="flex items-start justify-between">
						<div>
							<p class="font-bold">Random Configuration</p>
							<p class="text-sm text-gray-400">Enter number of questions for the selected Tags</p>
						</div>
						<div class="w-56">
							<TagsSelection bind:tags={$formData.random_tag_count} />
						</div>
					</div>
					<div class="flex flex-col">
						{#each $formData.random_tag_count as tag (tag.id)}
							<div
								class="flex flex-col gap-2 rounded p-2 py-3 text-sm sm:flex-row sm:items-center sm:gap-0"
							>
								<span class="w-full font-medium sm:w-1/4">{tag.name}</span>
								<div class="w-full sm:w-3/4">
									<Input
										type="number"
										placeholder="No. of questions"
										class="rounded border p-2 sm:ml-2"
										bind:value={tag.count}
									/>
									<small class="mt-1 block text-red-400 sm:ml-2">
										{tag.count && (isNaN(Number(tag.count)) || Number(tag.count) <= 0)
											? 'Enter a positive integer'
											: ''}
									</small>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
