<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Eye from '@lucide/svelte/icons/eye';

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
		<div class="flex items-center justify-between px-8 py-5 sm:px-10">
			<span class="text-sm font-semibold tracking-wide text-gray-600">PREVIEW</span>
			<span class="mr-8 text-sm font-semibold tracking-wide text-gray-600">
				{marking.correct}
				{marking.correct === 1 ? 'MARK' : 'MARKS'}
			</span>
		</div>
		<hr class="mx-4 border-gray-200 sm:mx-10" />

		<div class="overflow-y-auto px-8 py-8 sm:px-10 sm:py-10">
			<div class="mb-6">
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
					<p class=" text-sm text-gray-500">{instructions}</p>
				{/if}
			</div>

			{#if validOptions.length > 0}
				<div class="flex flex-col gap-5">
					{#each validOptions as opt}
						<div
							class="flex items-center justify-between rounded-xl border border-gray-200 px-6 py-5"
						>
							<div class="flex items-center gap-3">
								<span class="text-sm font-semibold text-gray-700">{opt.key}.</span>
								<span class="text-sm font-medium text-gray-800">{opt.value}</span>
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
