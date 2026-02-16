<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Eye from '@lucide/svelte/icons/eye';
	import { QuestionTypeEnum } from './schema';

	const { data } = $props();

	let openPreviewDialog: boolean = $state(false);

	const question = $derived(data?.question_text || '');
	const options = $derived(data?.options || []);
	const instructions = $derived(data?.instructions || '');
	const marking = $derived(data?.marking_scheme || { correct: 1, wrong: 0, skipped: 0 });
	const mandatory = $derived(data?.is_mandatory || false);
	const validOptions = $derived(options.filter((opt: any) => opt.value.trim() !== ''));

	const questionType = $derived.by(() => {
		if (data?.question_type === QuestionTypeEnum.Subjective) return 'subjective';
		const correctCount = options.filter((opt: any) => opt.correct_answer === true).length;
		return correctCount > 1 ? 'multi-choice' : 'single-choice';
	});

	let selectedSingleChoice: string = $state('');
	let selectedMultiChoices: Record<string, boolean> = $state({});
	let subjectiveAnswer: string = $state('');

	function resetSelections() {
		selectedSingleChoice = '';
		selectedMultiChoices = {};
		subjectiveAnswer = '';
	}
</script>

<Dialog.Root
	bind:open={openPreviewDialog}
	onOpenChange={(open) => {
		if (!open) resetSelections();
	}}
>
	<Button
		variant="outline"
		onclick={() => (openPreviewDialog = true)}
		class="border-primary text-primary gap-2 border text-sm sm:text-base"
	>
		<Eye size={16} />
		Preview
	</Button>
	<Dialog.Overlay class="fixed bg-black/30 backdrop-blur-sm" />

	<Dialog.Content
		class="flex max-h-[90vh] w-[95vw] max-w-4xl flex-col overflow-hidden rounded-xl bg-white p-0 shadow-2xl sm:w-[90vw]"
	>
		<div class="px-8 py-4 sm:px-10 sm:py-5">
			<h2 class="text-xl font-bold text-gray-900">Preview</h2>
		</div>
		<hr class="mx-4 border-gray-200 sm:mx-10" />

		<div class="overflow-y-auto px-8 py-5 sm:px-10 sm:py-6">
			<div class="mb-6 flex items-center justify-between">
				<span class="text-sm font-medium text-gray-500">1 of 1</span>
				<span class="text-sm font-semibold text-gray-600"
					>{marking.correct}
					{marking.correct === 1 ? 'MARK' : 'MARKS'}</span
				>
			</div>
			<div class="mb-4">
				{#if question.trim()}
					<p class="text-base/normal font-medium text-gray-900">
						{question}
						{#if mandatory}
							<span class="ml-1 text-red-500">*</span>
						{/if}
					</p>
				{:else}
					<p class="text-base leading-relaxed text-gray-400 italic">
						Enter your question to see preview...
					</p>
				{/if}
				{#if instructions.trim()}
					<p class="text-muted-foreground mt-2 text-sm">{instructions}</p>
				{/if}
			</div>

			{#if questionType === 'subjective'}
				<Textarea
					placeholder="Type your answer here..."
					bind:value={subjectiveAnswer}
					class="min-h-20"
				/>
			{:else if questionType === 'single-choice'}
				{#if validOptions.length > 0}
					<RadioGroup.Root bind:value={selectedSingleChoice}>
						{#each validOptions as opt}
							{@const uid = `preview-${opt.key}`}
							<Label
								for={uid}
								class="flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-5 {selectedSingleChoice ===
								opt.key
									? 'bg-primary text-muted *:border-muted *:text-muted'
									: ''}"
							>
								<span>{opt.key}. {opt.value}</span>
								<RadioGroup.Item
									value={opt.key}
									id={uid}
									class={selectedSingleChoice === opt.key ? 'border-white [&_svg]:fill-white' : ''}
								/>
							</Label>
						{/each}
					</RadioGroup.Root>
				{:else}
					<p class="text-sm text-gray-400 italic">Add options to see them in preview...</p>
				{/if}
			{:else if validOptions.length > 0}
				{#each validOptions as opt}
					{@const uid = `preview-${opt.key}`}
					<div class="flex flex-row items-start space-x-3">
						<Label
							for={uid}
							class="mb-2 flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-5 {selectedMultiChoices[
								opt.key
							]
								? 'bg-primary text-muted *:border-muted *:text-muted'
								: ''}"
						>
							<span>{opt.key}. {opt.value}</span>
							<Checkbox
								id={uid}
								checked={selectedMultiChoices[opt.key] || false}
								onCheckedChange={(checked) => (selectedMultiChoices[opt.key] = checked === true)}
								class={selectedMultiChoices[opt.key] ? 'text-primary! border-white! bg-white!' : ''}
							/>
						</Label>
					</div>
				{/each}
			{:else}
				<p class="text-sm text-gray-400 italic">Add options to see them in preview...</p>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
