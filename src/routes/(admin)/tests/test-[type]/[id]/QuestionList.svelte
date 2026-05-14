<script lang="ts">
	import FileQuestionIcon from '@lucide/svelte/icons/file-question';
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
	import SectionedQuestionSets from './SectionedQuestionSets.svelte';
	import { useTerms } from '$lib/nomenclature';

	const term = useTerms();

	let {
		formData,
		questions,
		questionParams,
		user = null
	}: { formData: any; questions: any; questionParams: any; user?: User | null } = $props();
	let dialogOpen = $state(false);
	let questionSelectionMode: 'manual' | 'tagBased' = $state('tagBased');
	const isSectionedTest = $derived(($formData.question_sets?.length ?? 0) > 0);
	const sectionedQuestionCount = $derived(
		($formData.question_sets || []).reduce(
			(sum, questionSet) =>
				sum +
				(questionSet.question_revisions?.length || questionSet.question_revision_ids?.length || 0),
			0
		)
	);
	const sectionCount = $derived(($formData.question_sets || []).length);
	const totalAttemptLimit = $derived(
		($formData.question_sets || []).reduce(
			(sum, questionSet) => sum + Number(questionSet.max_questions_allowed_to_attempt ?? 0),
			0
		)
	);

	let totalSelectedCount = $derived(
		isSectionedTest
			? sectionedQuestionCount
			: $formData.question_revision_ids.length > 0
				? $formData.question_revision_ids.length
				: $formData.random_tag_count.reduce((sum, t) => sum + (Number(t.count ?? 0) || 0), 0)
	);

	// Syncs random_tag_count with tag_ids: drops entries whose tag was removed,
	// appends new tags, and preserves existing counts. Called on mount and when
	// switching back to tagBased — not reactive.
	const syncTagsFromTagIds = () => {
		const current = $formData.random_tag_count as Array<{
			id: string;
			name: string;
			count?: number;
		}>;
		const tagIds = $formData.tag_ids as Filter[];
		const tagIdSet = new Set(tagIds.map((t) => t.id));
		const kept = current.filter((t) => tagIdSet.has(t.id));
		const keptIds = new Set(kept.map((t) => t.id));
		const added = tagIds.filter((t) => !keptIds.has(t.id));
		if (kept.length !== current.length || added.length > 0) {
			$formData.random_tag_count = [...kept, ...added.map((t) => ({ id: t.id, name: t.name }))];
		}
	};

	if (!isSectionedTest) {
		if ($formData.question_revision_ids.length > 0) {
			questionSelectionMode = 'manual';
		} else {
			questionSelectionMode = 'tagBased';
			syncTagsFromTagIds();
		}
	}

	const handleRemoveQuestion = (questionId: number) => {
		$formData.question_revision_ids = $formData.question_revision_ids.filter(
			(id: number) => id !== questionId
		);
		$formData.question_revisions = $formData.question_revisions.filter(
			(question: { id: number }) => question.id !== questionId
		);
	};
</script>

{#if !isSectionedTest}
	<QuestionSelectionDialog bind:open={dialogOpen} {questions} {questionParams} {formData} {user} />
{/if}

<div class="bg-card overflow-hidden rounded-xl border shadow-sm">
	<div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-4">
			<div class="bg-primary/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
				<FileQuestionIcon class="text-primary h-5 w-5" />
			</div>
			<div>
				<p class="font-semibold">Select Questions</p>
				<p class="text-muted-foreground text-sm">
					{#if isSectionedTest}
						Review the sectioned questions included in this {$formData.is_template
							? 'template'
							: 'test'}.
					{:else}
						Choose questions to include in this {$formData.is_template ? 'template' : 'test'}.
					{/if}
				</p>
			</div>
		</div>

		{#if isSectionedTest}
			<div class="text-muted-foreground text-right text-sm">
				<div>
					{sectionedQuestionCount}
					{sectionedQuestionCount === 1 ? 'question' : 'questions'} across
					{sectionCount}
					{sectionCount === 1 ? 'section' : 'sections'}
				</div>
				{#if totalAttemptLimit < sectionedQuestionCount}
					<div>Answer up to {totalAttemptLimit} across all sections</div>
				{/if}
			</div>
		{:else}
			<Tabs
				bind:value={questionSelectionMode}
				class="w-fit"
				onValueChange={(v) => {
					if (v === 'manual') $formData.random_tag_count = [];
					if (v === 'tagBased') {
						$formData.question_revision_ids = [];
						syncTagsFromTagIds();
					}
				}}
			>
				<TabsList class="bg-muted rounded-full p-1">
					<TabsTrigger
						value="tagBased"
						class="data-[state=active]:bg-background data-[state=active]:text-primary text-muted-foreground rounded-full px-4 py-1.5 text-sm data-[state=active]:font-semibold data-[state=active]:shadow"
					>
						Auto Selection
					</TabsTrigger>
					<TabsTrigger
						value="manual"
						class="data-[state=active]:bg-background data-[state=active]:text-primary text-muted-foreground rounded-full px-4 py-1.5 text-sm data-[state=active]:font-semibold data-[state=active]:shadow"
					>
						Manual Selection
					</TabsTrigger>
				</TabsList>
			</Tabs>
		{/if}
	</div>

	<div class="border-t"></div>

	<div class="flex min-h-96 flex-col p-5">
		{#if isSectionedTest}
			<SectionedQuestionSets
				questionSets={$formData.question_sets || []}
				isTemplate={$formData.is_template}
			/>
		{:else if questionSelectionMode === 'manual'}
			{#if $formData.question_revision_ids.length === 0}
				<div class="my-auto flex flex-col items-center justify-center py-16 text-center">
					<p class="text-lg font-bold">No questions yet</p>
					<p class="text-muted-foreground mt-1 text-sm">
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
				<p class="text-muted-foreground text-sm">
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

				<div class="bg-background mx-auto w-full max-w-2xl overflow-hidden rounded-xl border">
					<div
						class="text-muted-foreground bg-muted grid grid-cols-2 px-6 py-4 text-xs font-semibold tracking-wide uppercase"
					>
						<div>Tags</div>
						<div>No. of Questions</div>
					</div>

					{#each $formData.random_tag_count as tag (tag.id)}
						<div class="bg-card grid grid-cols-2 items-center gap-4 border-t px-6 py-4">
							<span
								class="bg-muted text-foreground inline-flex w-fit items-center rounded-full px-3 py-1 text-sm"
							>
								{tag.name}
							</span>
							<div>
								<Input
									type="number"
									placeholder="e.g. 5"
									class="bg-card w-full rounded-lg border text-center"
									bind:value={tag.count}
								/>
								{#if tag.count !== undefined && tag.count <= 0}
									<small class="text-destructive mt-1 block">Enter a positive integer</small>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>
