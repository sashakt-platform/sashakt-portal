<script>
	import Button from '$lib/components/ui/button/button.svelte';
	import PenLine from '@lucide/svelte/icons/pen-line';
	import QuestionDialog from './QuestionDialog.svelte';
	import { columns } from './question_table/columns.js';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Eye from '@lucide/svelte/icons/eye';

	let { formData, questions } = $props();
	let dialogOpen = $state(false);
</script>

<QuestionDialog bind:open={dialogOpen} {questions} {columns} {formData} />

<div class="mx-auto flex h-dvh">
	<div class=" mx-auto w-3/4 p-20">
		<div
			class=" mb-2 flex h-1/6 items-center rounded-t-xl rounded-b-sm border bg-white p-4 shadow-lg"
		>
			<div class="mr-4 flex h-full items-center">
				<svg
					width="48"
					height="48"
					viewBox="0 0 48 48"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					class=""
				>
					<circle cx="24" cy="24" r="24" fill="#F0F9FF" />
					<mask
						id="mask0_429_9071"
						style="mask-type:alpha"
						maskUnits="userSpaceOnUse"
						x="10"
						y="10"
						width="28"
						height="28"
					>
						<rect x="10" y="10" width="28" height="28" fill="#D9D9D9" />
					</mask>
					<g mask="url(#mask0_429_9071)">
						<path
							d="M18.4575 29.5423H26.0409V27.7923H18.4575V29.5423ZM18.4575 24.8757H29.5409V23.1257H18.4575V24.8757ZM18.4575 20.209H29.5409V18.459H18.4575V20.209ZM16.1916 33.9173C15.6022 33.9173 15.1034 33.7132 14.695 33.3048C14.2867 32.8965 14.0825 32.3976 14.0825 31.8083V16.193C14.0825 15.6037 14.2867 15.1048 14.695 14.6965C15.1034 14.2882 15.6022 14.084 16.1916 14.084H31.8068C32.3962 14.084 32.895 14.2882 33.3034 14.6965C33.7117 15.1048 33.9159 15.6037 33.9159 16.193V31.8083C33.9159 32.3976 33.7117 32.8965 33.3034 33.3048C32.895 33.7132 32.3962 33.9173 31.8068 33.9173H16.1916ZM16.1916 32.1673H31.8068C31.8966 32.1673 31.9789 32.1299 32.0536 32.055C32.1284 31.9804 32.1659 31.8981 32.1659 31.8083V16.193C32.1659 16.1032 32.1284 16.0209 32.0536 15.9463C31.9789 15.8714 31.8966 15.834 31.8068 15.834H16.1916C16.1017 15.834 16.0195 15.8714 15.9448 15.9463C15.87 16.0209 15.8325 16.1032 15.8325 16.193V31.8083C15.8325 31.8981 15.87 31.9804 15.9448 32.055C16.0195 32.1299 16.1017 32.1673 16.1916 32.1673Z"
							fill="#0369A1"
						/>
					</g>
				</svg>
			</div>
			<div class="flex h-full w-full flex-row">
				<div class="flex w-fit flex-col">
					<div class="flex">
						<p class="font-bold">{$formData.name}</p>
						<PenLine class="p-1" />
					</div>
					<div class="flex flex-row items-center text-sm">
						<span class=" my-4 mr-4 rounded-sm bg-[#E8F1F7] p-1 px-2 font-bold"
							>{$formData.is_template ? 'TEST TEMPLATE' : 'TEST SESSION'}</span
						>
						<span class="text-gray-500"
							>{$formData.question_revision_ids.length}
							{$formData.question_revision_ids.length == 1 ? 'question' : 'questions'} (0pts)</span
						>
					</div>
				</div>
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
					{#each questions.filter( (row) => $formData.question_revision_ids.includes(row.latest_question_revision_id) ) as d (d.latest_question_revision_id)}
						<div class="m-4 flex cursor-pointer flex-row">
							<div class="my-auto">
								<GripVertical />
							</div>
							<div
								class="hover:bg-primary-foreground my-auto flex w-full flex-row items-center rounded-lg border-1 p-4 text-sm"
							>
								<p class="w-4/6">
									{d.question_text}
								</p>
								<span class="mx-4 w-fit rounded-full border p-1"><Eye class="mx-auto" /></span>
								<span class="w-2/6">
									<p>{d.tags.map((tag) => tag?.name).join(', ')}</p>
								</span>
							</div>
							<div class="my-auto ml-2 hidden group-hover:block">
								<Trash2 />
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
