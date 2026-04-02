<script lang="ts">
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	type QuestionRevision = {
		id: number;
		question_text: string;
		tags?: Array<{ name: string }>;
	};

	let {
		selectedQuestions = [],
		selectedQuestionIds = $bindable([]),
		onRemoveQuestion
	}: {
		selectedQuestions: QuestionRevision[];
		selectedQuestionIds: number[];
		onRemoveQuestion?: (questionId: number) => void;
	} = $props();

	// Display all selected questions from testData.question_revisions
	const displayQuestions = $derived(selectedQuestions);

	const handleRemoveQuestion = (questionId: number) => {
		selectedQuestionIds = selectedQuestionIds.filter((id) => id !== questionId);
		if (onRemoveQuestion) {
			onRemoveQuestion(questionId);
		}
	};
</script>

<div class="flex h-full w-full flex-col overflow-auto">
	{#each displayQuestions as question (question.id)}
		<div class="group mx-2 mt-2 flex flex-row">
			<div class="my-auto w-fit">
				<GripVertical />
			</div>
			<div
				class="hover:bg-primary-foreground my-auto flex w-11/12 flex-row items-center rounded-lg border-1 px-4 py-4 text-sm"
			>
				<p class="w-4/6">
					{question.question_text}
				</p>
				<span class="w-2/6">
					{#if question.tags && question.tags.length > 0}
						<p>
							<span class="font-bold">Tags:</span>
							{question.tags.map((tag) => tag?.name).join(', ')}
						</p>
					{/if}
				</span>
			</div>
			<div class="my-auto ml-2 hidden w-fit group-hover:block">
				<button
					onclick={() => handleRemoveQuestion(question.id)}
					class="cursor-pointer"
					type="button"
				>
					<Trash2 />
				</button>
			</div>
		</div>
	{/each}
</div>
