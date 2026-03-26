<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import QuestionPreviewDialog from '$lib/components/QuestionPreviewDialog.svelte';
	import type { QuestionPreviewData } from '$lib/components/QuestionPreviewDialog.svelte';

	const { question }: { question: any } = $props();

	let open = $state(false);

	const previewData: QuestionPreviewData = $derived({
		questionText: question.question_text || '',
		questionType: question.question_type || '',
		options: question.options || [],
		instructions: question.instructions || '',
		markingScheme: question.marking_scheme,
		isMandatory: question.is_mandatory || false,
		media: question.media || null,
		matrix: question.matrix || null
	});
</script>

<button
	type="button"
	class="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
	onclick={() => (open = true)}
	title="Preview question"
>
	<Eye class="mx-auto h-4 w-4" />
</button>

<QuestionPreviewDialog bind:open data={previewData} previewId="listing-{question.id}" />
