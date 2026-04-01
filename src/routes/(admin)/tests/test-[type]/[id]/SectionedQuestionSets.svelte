<script lang="ts">
	import type { Infer } from 'sveltekit-superforms';
	import type { FormSchema } from './schema';
	import RichText from '$lib/components/RichText.svelte';

	type QuestionSet = Infer<FormSchema>['question_sets'][number];

	let {
		questionSets = [],
		isTemplate = false
	}: {
		questionSets?: QuestionSet[];
		isTemplate?: boolean;
	} = $props();

	const sortedQuestionSets = $derived(
		[...questionSets].sort((left, right) => left.display_order - right.display_order)
	);

	function getQuestionCount(questionSet: QuestionSet) {
		return questionSet.question_revisions?.length || questionSet.question_revision_ids?.length || 0;
	}

	function formatMarkingScheme(questionSet: QuestionSet) {
		if (!questionSet.marking_scheme) {
			return 'Uses test default';
		}

		return [
			`Correct: ${questionSet.marking_scheme.correct}`,
			`Wrong: ${questionSet.marking_scheme.wrong}`,
			`Skipped: ${questionSet.marking_scheme.skipped}`
		].join(' / ');
	}
</script>

<div class="flex h-full w-full flex-col gap-4 overflow-auto">
	<div class="rounded-lg border border-dashed bg-gray-50 p-4">
		<p class="text-sm font-medium">Section membership can't be edited in portal yet.</p>
		<p class="mt-2 text-sm text-gray-500">
			You can still update the rest of this {isTemplate ? 'test template' : 'test session'}.
		</p>
	</div>

	{#each sortedQuestionSets as questionSet (questionSet.id ?? `${questionSet.display_order}-${questionSet.title}`)}
		<div class="rounded-lg border bg-white p-4 shadow-sm">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-base font-semibold">{questionSet.title}</p>
						<span class="text-xs text-gray-500">Section {questionSet.display_order}</span>
						<span class="text-xs text-gray-500">
							{getQuestionCount(questionSet)} {getQuestionCount(questionSet) === 1 ? 'question' : 'questions'}
						</span>
					</div>
					{#if questionSet.description}
						<RichText content={questionSet.description} class="mt-1 text-sm text-gray-500 [&_p]:m-0" />
					{/if}
				</div>
				<div class="text-sm text-gray-500">
					Attempt limit: {questionSet.max_questions_allowed_to_attempt}
				</div>
			</div>

			<div class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
				<div class="rounded-md bg-gray-50 p-3">
					<p class="font-medium text-gray-700">Marking Scheme</p>
					<p class="mt-1 text-gray-500">{formatMarkingScheme(questionSet)}</p>
				</div>
				<div class="rounded-md bg-gray-50 p-3">
					<p class="font-medium text-gray-700">Question Selection</p>
					<p class="mt-1 text-gray-500">
						Questions in this section are read-only in portal for now.
					</p>
				</div>
			</div>

			<div class="mt-4">
				<p class="text-sm font-medium text-gray-700">Questions</p>
				{#if questionSet.question_revisions.length > 0}
					<div class="mt-2 space-y-2">
						{#each questionSet.question_revisions as question, index (question.id)}
							<div class="rounded-md border px-3 py-2">
								<div class="flex gap-2 text-sm text-gray-900">
									<span class="shrink-0">{index + 1}.</span>
									<RichText content={question.question_text} class="min-w-0 flex-1 [&_p]:m-0" />
								</div>
								{#if question.tags && question.tags.length > 0}
									<p class="mt-1 text-xs text-gray-500">
										Tags: {question.tags.map((tag) => tag.name).join(', ')}
									</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<p class="mt-2 text-sm text-gray-500">No questions available for preview.</p>
				{/if}
			</div>
		</div>
	{/each}
</div>
