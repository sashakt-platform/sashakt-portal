<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import QuestionDialog from './QuestionDialog.svelte';
	import { columns } from './question_table/columns.js';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '$lib/components/ui/label';
	import TestPaper from '$lib/icons/TestPaper.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';

	let { formData, questions } = $props();
	let dialogOpen = $state(false);
	let questionSelectionMode: 'manual' | 'tagBased' = $state('tagBased');
</script>

<QuestionDialog bind:open={dialogOpen} {questions} {columns} {formData} />

<div class="mx-auto flex h-dvh">
	<div class=" mx-auto w-full p-20">
		<div class=" mb-8 flex h-fit items-center gap-4 rounded-lg bg-white p-4 shadow-lg">
			<div class="flex h-full w-fit">
				<TestPaper />
			</div>
			<p class="w-1/2 text-lg font-semibold">Question Selection For the Test</p>
			<RadioGroup.Root
				bind:value={questionSelectionMode}
				class="mx-auto flex w-full  flex-row justify-center gap-8 "
			>
				<div class="b flex w-fit items-center space-x-2">
					<RadioGroup.Item
						id="manual"
						value="manual"
						onclick={() => ($formData.random_tag_count = [])}
					/>
					<Label for="manual"
						><p class="font-bold">Manual Questions Selection</p>
						<p class="text-sm font-extralight">
							Select Questions Manually from the Question Bank
						</p></Label
					>
				</div>
				<div class="flex w-fit flex-row items-center gap-4">
					<div class="flex w-fit flex-row items-center space-x-2">
						<RadioGroup.Item
							id="tagBased"
							value="tagBased"
							onclick={() => ($formData.question_revision_ids = [])}
						/>
						<Label for="tagBased"
							><p class="font-bold">Tag-Based Random Questions</p>
							<p class="text-sm font-extralight">Select Tags for Random Questions with Count</p>
						</Label>
					</div>
				</div>
			</RadioGroup.Root>
		</div>
		<div
			class=" mb-2 flex h-1/6 items-center gap-4 rounded-t-xl rounded-b-sm border bg-white p-4 shadow-lg"
		>
			<div class="flex h-full items-center">
				<TestPaper />
			</div>
			<div class="flex h-full w-full flex-row gap-8">
				<div class="flex w-1/2 flex-col">
					<div class="flex">
						<p class="font-bold">{$formData.name}</p>
					</div>
					<div class="flex flex-row items-center text-sm">
						<span class=" my-4 mr-4 rounded-sm bg-[#E8F1F7] p-1 px-2 font-bold"
							>{$formData.is_template ? 'TEST TEMPLATE' : 'TEST SESSION'}</span
						>
						<span class="text-gray-500"
							>{$formData.question_revision_ids.length ||
								$formData.random_tag_count.map((t) => t.count).reduce((a, b) => a + b, 0)}
							{$formData.question_revision_ids.length == 1 ? 'question' : 'questions'}
						</span>
					</div>
				</div>
				{#if questionSelectionMode == 'tagBased'}
					<div class="my-auto flex w-1/2 flex-col justify-center align-middle">
						<p class="text-sm text-gray-400">Select Tags for Randomization</p>
						<TagsSelection bind:tags={$formData.random_tag_count} />
					</div>
				{/if}
				{#if $formData.question_revision_ids.length != 0}
					<div class="my-auto ml-auto flex">
						<Button onclick={() => (dialogOpen = true)}>Select More Questions</Button>
					</div>
				{/if}
			</div>
		</div>

		<div
			class="my-auto flex h-full justify-center rounded-t-sm rounded-b-xl border bg-white p-4 shadow-lg"
		>
			{#if questionSelectionMode == 'manual'}
				{#if $formData.question_revision_ids.length == 0}
					<div class="my-auto text-center">
						<p class="text-lg font-bold">Shortlist your Questions</p>
						<p class="text-sm text-gray-400">
							Add the relevant questions to your test {$formData.is_template ? 'template' : ''}
						</p>
						<Button class="mt-6 bg-[#0369A1]" onclick={() => (dialogOpen = true)}
							>Select from question bank</Button
						>
					</div>
				{:else}
					<div class="flex h-full w-full flex-col overflow-auto">
						{#each questions.items.filter( (row) => $formData.question_revision_ids.includes(row.latest_question_revision_id) ) as d (d.latest_question_revision_id)}
							<div class="group mx-2 mt-2 flex flex-row">
								<div class="my-auto w-fit">
									<GripVertical />
								</div>
								<div
									class="hover:bg-primary-foreground my-auto flex w-11/12 flex-row items-center rounded-lg border-1 px-4 py-4 text-sm"
								>
									<p class="w-4/6">
										{d.question_text}
									</p>
									<span class="w-2/6">
										{#if d.tags.length > 0}
											<p>
												<span class="font-bold">Tags:</span>
												{d.tags.map((tag) => tag?.name).join(', ')}
											</p>
										{/if}
									</span>
								</div>
								<div class="my-auto ml-2 hidden w-fit group-hover:block">
									<button
										onclick={(e) => {
											$formData.question_revision_ids = $formData.question_revision_ids.filter(
												(id) => id !== d.latest_question_revision_id
											);
										}}
										class="cursor-pointer"
									>
										<Trash2 />
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{:else if questionSelectionMode == 'tagBased'}
				{#if $formData.random_tag_count.length == 0}
					<div class="my-auto text-center">
						<p class="text-lg font-bold">Tag-Based Randomization</p>
						<p class="text-sm text-gray-400">
							Add the relevant random questions to your test {$formData.is_template
								? 'template'
								: ''} by selecting tags above
						</p>
					</div>
				{:else}
					<div class="flex h-full w-full flex-col gap-4 overflow-auto">
						<div class="flex flex-col">
							<p class="text-lg font-bold">Tags Selected for Randomization</p>
							<p class="text-sm text-gray-400">
								Enter count of questions to be selected from each tag
							</p>
						</div>
						<div class="flex flex-col">
							{#each $formData.random_tag_count as tag (tag.id)}
								<div class="m-4 flex items-center rounded p-2 text-sm">
									<span class="w-1/4">{tag.name}</span>
									<input
										type="number"
										placeholder="Enter random questions expected for - {tag.name}"
										class="ml-2 w-3/4 rounded border p-2"
										bind:value={tag.count}
									/>
								</div>
							{/each}
						</div>
						{JSON.stringify($formData.random_tag_count)}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
