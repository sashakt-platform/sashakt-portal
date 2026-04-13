<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import QuestionPreviewDialog from '$lib/components/QuestionPreviewDialog.svelte';
	import type { QuestionPreviewData } from '$lib/components/QuestionPreviewDialog.svelte';

	const { question }: { question: any } = $props();

	let open = $state(false);

	const isMatrixOptions = (
		options: unknown
	): options is {
		rows: { label: string; items: { id: number; key: string; value: string }[] };
		columns: { label: string; items: { id: number; key: string; value: string }[]; input_type?: 'number' | 'text' };
	} => options !== null && typeof options === 'object' && !Array.isArray(options) && 'rows' in (options as object);

	const opts = $derived(question.options);

	const previewData: QuestionPreviewData = $derived({
		questionText: question.question_text || '',
		questionType: question.question_type || '',
		options: Array.isArray(opts) ? opts : [],
		instructions: question.instructions || '',
		markingScheme: question.marking_scheme,
		isMandatory: question.is_mandatory || false,
		media: question.media || null,
		matrix: isMatrixOptions(opts)
			? {
					rows: opts.rows.items,
					columns: opts.columns.items,
					rowLabel: opts.rows.label,
					colLabel: opts.columns.label,
					inputType: opts.columns.input_type
				}
			: null
	});
</script>

<button
	type="button"
	class="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
	onclick={() => (open = true)}
	title="Preview question"
>
	<Eye class="h-4 w-4" />
</button>

<QuestionPreviewDialog bind:open data={previewData} previewId="listing-{question.id}" />
