<script lang="ts">
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import TagChip from '$lib/components/ui/tag-chip/TagChip.svelte';
	import QuestionPreviewCell from '$lib/components/QuestionPreviewCell.svelte';
	import RichText from '$lib/components/RichText.svelte';

	type QuestionRevision = {
		id: number;
		question_text: string;
		question_type?: string;
		tags?: Array<{ name: string; tag_type?: { name: string } }>;
		options?: Array<{ id: number; key: string; value: string }>;
		correct_answer?: number[];
		instructions?: string;
		marking_scheme?: any;
		is_mandatory?: boolean;
		media?: any;
		matrix?: any;
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

	const displayQuestions = $derived(selectedQuestions);

	const handleRemoveQuestion = (questionId: number) => {
		selectedQuestionIds = selectedQuestionIds.filter((id) => id !== questionId);
		if (onRemoveQuestion) {
			onRemoveQuestion(questionId);
		}
	};

	const getVisibleTags = (tags: QuestionRevision['tags']) => {
		const formatted =
			tags?.map((tag) => {
				const typeName = tag.tag_type?.name ?? '';
				return typeName ? `${tag.name} (${typeName})` : tag.name;
			}) ?? [];
		return { visible: formatted.slice(0, 2), overflow: Math.max(0, formatted.length - 2) };
	};
</script>

<div class="w-full overflow-auto rounded-lg border">
	<!-- Table header -->
	<div
		class="grid grid-cols-[auto_1fr_80px_1fr_40px] items-center gap-2 bg-background px-4 py-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
	>
		<div class="w-5"></div>
		<div>Questions</div>
		<div class="text-center">Answers</div>
		<div>Tags</div>
		<div></div>
	</div>

	<!-- Rows -->
	{#each displayQuestions as question (question.id)}
		<div class="grid grid-cols-[auto_1fr_80px_1fr_40px] items-center gap-2 border-t px-4 py-4">
			<!-- Drag handle -->
			<div class="text-border">
				<GripVertical class="h-4 w-4" />
			</div>

			<!-- Question text -->
			<RichText content={question.question_text} class="text-foreground text-sm [&_p]:m-0" />

			<!-- Eye preview -->
			<div class="flex justify-center">
				<QuestionPreviewCell
					question={{
						...question,
						options: question.options ?? [],
						correct_answer: question.correct_answer ?? []
					}}
				/>
			</div>

			<!-- Tags -->
			<div class="flex flex-wrap items-center gap-1">
				{#each getVisibleTags(question.tags).visible as tag}
					<TagChip name={tag} class="max-w-40 shrink-0" />
				{/each}
				{#if getVisibleTags(question.tags).overflow > 0}
					<TagChip name="+{getVisibleTags(question.tags).overflow}" class="shrink-0" />
				{/if}
			</div>

			<!-- Delete -->
			<button
				onclick={() => handleRemoveQuestion(question.id)}
				class="cursor-pointer text-destructive/70 hover:text-destructive"
				type="button"
				aria-label="Remove question"
			>
				<Trash2 class="h-4 w-4" />
			</button>
		</div>
	{/each}
</div>
