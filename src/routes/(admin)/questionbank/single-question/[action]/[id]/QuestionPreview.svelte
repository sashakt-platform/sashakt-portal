<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Eye from '@lucide/svelte/icons/eye';
	import QuestionPreviewDialog from '$lib/components/QuestionPreviewDialog.svelte';
	import { QuestionTypeEnum } from '$lib/types/question';
	import type { TMedia } from '$lib/types/media';

	const { data } = $props();

	let openPreviewDialog: boolean = $state(false);

	const media = $derived(data?.media as TMedia | null | undefined);
	const optionMediaMap = $derived((data?.optionMediaMap ?? {}) as Record<number, TMedia | null>);
	const options = $derived(data?.options || []);

	const questionType = $derived.by(() => {
		if (data?.question_type === QuestionTypeEnum.SingleChoice) {
			if (options.length > 0) {
				const correctCount = options.filter((opt: any) => opt.correct_answer === true).length;
				return correctCount > 1 ? QuestionTypeEnum.MultiChoice : QuestionTypeEnum.SingleChoice;
			}
		}
		return data?.question_type;
	});

	const previewData = $derived({
		questionText: data?.question_text || '',
		questionType: questionType || QuestionTypeEnum.SingleChoice,
		options,
		instructions: data?.instructions || '',
		markingScheme: data?.marking_scheme || { correct: 1, wrong: 0, skipped: 0 },
		isMandatory: data?.is_mandatory || false,
		media,
		optionMediaMap,
		matrix: data?.matrix || null
	});
</script>

<Button
	variant="outline"
	onclick={() => (openPreviewDialog = true)}
	class="border-primary text-primary gap-2 border text-sm sm:text-base"
>
	<Eye size={16} />
	Preview
</Button>

<QuestionPreviewDialog bind:open={openPreviewDialog} data={previewData} previewId="edit-preview" />
