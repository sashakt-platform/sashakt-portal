<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Label from '$lib/components/ui/label/label.svelte';

	const { data } = $props();

	let openPreviewDialog: boolean = $state(false);

	const question = $derived(data?.question_text || '');
	const options = $derived(data?.options || []);
	const instructions = $derived(data?.instructions || '');
	const marking = $derived(data?.marking_scheme || { correct: 1, wrong: 0, skipped: 0 });
	const mandatory = $derived(data?.is_mandatory || false);
	const validOptions = $derived(options.filter((opt: any) => opt.value.trim() !== ''));
</script>

<Dialog.Root bind:open={openPreviewDialog}>
	<Label
		onclick={() => (openPreviewDialog = true)}
		class="ml-2  inline-flex cursor-pointer items-center
 justify-center  rounded-md px-4 py-1 text-sm font-medium text-white  hover:opacity-90  "
		style="background-color: #0264a1;"
	>
		Preview question
	</Label>
	<Dialog.Overlay class="fixed  bg-black/30 backdrop-blur-sm" />

	<Dialog.Content
		class=" flex max-h-[85vh] w-[90vw] max-w-md flex-col  overflow-y-auto rounded-lg bg-white p-0 shadow-xl "
	>
		<div class="border-b border-gray-200 p-8">
			<div class="flex items-center justify-between">
				<div class="text-sm font-medium text-gray-600">PREVIEW</div>
				<div class="text-sm font-medium text-gray-600">
					{marking.correct}
					{marking.correct === 1 ? 'MARK' : 'MARKS'}
				</div>
			</div>
		</div>

		<div class="px-8 pt-4 pb-8">
			<div class="mb-4">
				{#if question.trim()}
					<p class="text-base leading-relaxed text-gray-900">
						{question}
						{#if mandatory}
							<span class="text-red-600">*</span>
						{/if}
					</p>
				{:else}
					<p class="text-base leading-relaxed text-gray-400 italic">
						Enter your question to see preview...
					</p>
				{/if}
				{#if instructions.trim()}
					<p class="text-gray-500">{instructions}</p>
				{/if}
			</div>

			{#if validOptions.length > 0}
				<div class="flex flex-col gap-3">
					{#each validOptions as opt}
						<div class=" gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50">
							<div class="flex items-center gap-3">
								<span class="font-medium text-gray-700">{opt.key}.</span>
								<span class="text-gray-900">{opt.value}</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-gray-400 italic">Add options to see them in preview...</p>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
