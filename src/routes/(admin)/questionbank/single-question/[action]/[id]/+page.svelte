<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import History from '@lucide/svelte/icons/history';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Trash_2 from '@lucide/svelte/icons/trash-2';
	import Plus from '@lucide/svelte/icons/plus';
	import { Input } from '$lib/components/ui/input';
	import Button from '$lib/components/ui/button/button.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { questionSchema, type FormSchema, type TagFormSchema, QuestionTypeEnum } from './schema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Tag from './Tag.svelte';
	import QuestionRevision from './Question_revision.svelte';
	import TooltipInfo from '$lib/components/TooltipInfo.svelte';

	const {
		data
	}: {
		data: {
			form: SuperValidated<Infer<FormSchema>>;
			tagForm: SuperValidated<Infer<TagFormSchema>>;
			tagTypes: [];
		};
	} = $props();

	const questionData: Partial<Infer<FormSchema>> | null = data?.questionData || null;

	const {
		form: formData,
		enhance,
		submit
	} = superForm(questionData || data.form, {
		applyAction: 'never',
		validators: zodClient(questionSchema),
		dataType: 'json',
		onSubmit: () => {
			$formData.options = totalOptions.map((option) => {
				return { id: option.id, key: option.key, value: option.value };
			});
			$formData.correct_answer = totalOptions
				.filter((option) => option.correct_answer)
				.map((option) => option.id);
			$formData.organization_id = data.user.organization_id;
			$formData.question_type =
				$formData.correct_answer.length > 1
					? QuestionTypeEnum.MultiChoice
					: QuestionTypeEnum.SingleChoice;
		}
	});

	if (questionData?.locations?.length) {
		$formData.state_ids = questionData.locations.map((location) => ({
			id: String((location as { state_id: string | number }).state_id),
			name: (location as { state_name: string }).state_name
		}));
	}

	if (questionData?.tags?.length) {
		$formData.tag_ids = questionData.tags.map((tag) => {
			const tagName = tag.name;
			const tagTypeName = tag.tag_type?.name;
			return {
				id: String((tag as { id: string | number }).id),
				name: tagTypeName ? `${tagName} (${tagTypeName})` : tagName
			};
		});
	}

	if (questionData && !questionData.marking_scheme) {
		$formData.marking_scheme = {
			correct: 1,
			wrong: 0,
			skipped: 0
		};
	}

	let totalOptions = $state<{ id: number; key: string; value: string; correct_answer: boolean }[]>(
		questionData && questionData.options
			? questionData.options.map((v, k) => {
					const { id, key, value } = v;

					return {
						id,
						key,
						value: value || '',
						correct_answer: questionData?.correct_answer?.includes(id) ? true : false
					};
				})
			: Array.from({ length: 4 }, (_, i) => ({
					id: i + 1,
					key: String.fromCharCode(65 + i),
					value: '',
					correct_answer: false
				}))
	);
	let openTagDialog: boolean = $state(false);
</script>

<form method="POST" action="?/save" use:enhance>
	<div class="mx-auto flex flex-col gap-10 py-8">
		{#snippet snippetHeading(title: string)}
			<div class="bg-primary-foreground flex flex-row gap-3 rounded-sm px-4 py-3 align-middle">
				<Label class="text-md my-auto font-bold">{title}</Label><Info
					class="my-auto w-4 align-middle text-xs text-gray-600"
				/>
			</div>
		{/snippet}
		<div class="mx-10 flex flex-row">
			<div class="my-auto flex flex-col">
				<div class=" flex w-full items-center align-middle">
					<div class="flex flex-row">
						<h2
							class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
						>
							{questionData ? 'Edit Question' : 'Create a Question'}
						</h2>
						<TooltipInfo
							label="Help: Question Form"
							description="Here you can add a new question by providing the question text, possible answers, marking scheme, tags, and states. Make sure to mark the correct answer(s) before saving."
						/>
					</div>
				</div>
				<Label class="my-auto align-middle text-sm font-extralight">
					<!-- {questionData ? 'Edit Existing Question' : 'Add questions with tags and details'} -->
				</Label>
			</div>
			<div
				class={['text-primary my-auto ml-auto flex cursor-pointer flex-row gap-2 p-4 font-bold']}
			>
				{#if questionData}
					<QuestionRevision {data} />
				{/if}
			</div>
		</div>
		<div class="mx-10 flex flex-col gap-8 bg-white p-9">
			<div class="flex flex-row">
				<div class="flex w-3/5 flex-col gap-4 pr-8">
					<div class="flex flex-col gap-2">
						{@render snippetHeading('Question')}
						<Textarea
							name="questionText"
							bind:value={$formData.question_text}
							placeholder="Enter your Question..."
						/>
						<div class="flex flex-row gap-2">
							<Checkbox bind:checked={$formData.is_mandatory} />
							<Label class="text-sm ">Set as mandatory</Label>
						</div>
					</div>
					<div class="flex flex-col gap-4 overflow-y-scroll scroll-auto">
						{@render snippetHeading('Answers')}

						{#each totalOptions as { id, key, value }, index (id)}
							<div class="group flex flex-row gap-4">
								<div class="bg-primary-foreground h-12 w-12 rounded-sm text-center">
									<p class="flex h-full w-full items-center justify-center text-xl font-semibold">
										{key}
									</p>
								</div>
								<div class="flex w-full flex-col gap-2">
									<div class="flex flex-row rounded-sm border-1 border-black">
										<GripVertical class="my-auto h-full  rounded-sm bg-gray-100" />
										<Input class=" border-0" name={key} bind:value={totalOptions[index].value} />
									</div>
									<div class="flex flex-row gap-2">
										<Checkbox
											disabled={!totalOptions[index].value.trim()}
											checked={totalOptions[index].correct_answer}
											onCheckedChange={(checked: boolean) =>
												(totalOptions[index].correct_answer = checked)}
										/><Label class="text-sm ">Set as correct answer</Label>
									</div>
								</div>
								<div
									class={[
										'mt-2 gap-0 opacity-0 transition-opacity',
										totalOptions.length > 1 ? 'group-hover:opacity-100' : ''
									]}
								>
									<Trash_2
										class={['m-0 my-auto p-0', totalOptions.length > 1 ? 'cursor-pointer' : '']}
										onclick={() => {
											if (totalOptions.length > 1) {
												totalOptions = totalOptions
													.filter((_, i) => i !== index)
													.map((option, i) => ({
														...option,
														key: String.fromCharCode(65 + i)
													}));
											}
										}}
									/>
								</div>
							</div>
						{/each}

						<div class="flex justify-end">
							<Button
								variant="outline"
								class="text-primary border-primary"
								onclick={() => {
									totalOptions.push({
										id: totalOptions[totalOptions.length - 1].id + 1,
										key: String.fromCharCode(64 + totalOptions.length + 1),
										value: '',
										correct_answer: false
									});
								}}
							>
								<Plus />Add Answer</Button
							>
						</div>
					</div>
				</div>
				<div class="flex w-2/5 flex-col pl-8">
					<div class="flex h-1/2 flex-col gap-2">
						{@render snippetHeading('Tags')}
						<TagsSelection bind:tags={$formData.tag_ids} />
						<Dialog.Root bind:open={openTagDialog}>
							<Label
								onclick={() => (openTagDialog = true)}
								class="text-primary flex cursor-pointer flex-row items-center text-xs font-bold"
								><Plus class="mr-1 w-3 text-xs" />Create a new tag</Label
							>
							<Dialog.Content class="p-4 px-0 sm:h-[70%] sm:max-w-[45%]">
								<Dialog.Header class="m-0 h-fit  border-b-2 py-4">
									<Dialog.Title class="px-8 ">Create new tag</Dialog.Title>
								</Dialog.Header>
								<Tag tagTypes={data.tagTypes} form={data.tagForm} bind:open={openTagDialog} />
							</Dialog.Content>
						</Dialog.Root>
					</div>
					<div class="flex h-1/2 flex-col gap-2">
						{@render snippetHeading('States')}
						<StateSelection bind:states={$formData.state_ids} />
						<div class="mt-12 flex items-center space-x-2">
							<Switch id="airplane-mode" bind:checked={$formData.is_active} />
							<Label for="airplane-mode">Active</Label><Info
								class="my-auto w-4 align-middle text-xs text-gray-600"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="flex flex-row gap-8">
				<div class="flex w-1/2 flex-row gap-4">
					<div class="flex w-full flex-col gap-2">
						{@render snippetHeading('Additional Instructions')}
						<Textarea name="instructions" bind:value={$formData.instructions} placeholder="" />
					</div>
				</div>
				<div class="flex w-1/2 flex-row gap-4">
					<div class="flex w-full flex-col gap-2">
						{@render snippetHeading('Marking Scheme')}
						<div class="flex h-full flex-row gap-2 rounded-lg border border-gray-100 p-4">
							<p class="my-auto w-1/2">Marks for correct answer</p>
							<input
								type="number"
								name="marking_scheme.correct"
								bind:value={$formData.marking_scheme.correct}
								min="1"
								class=" rounded-sm border-1 border-gray-300 p-2"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="sticky bottom-0 my-4 flex w-full border-t-4 bg-white p-4">
		<div class="flex w-full justify-between">
			<a href="/questionbank"
				><Button variant="outline" class="text-primary border-primary border-1">Cancel</Button></a
			>
			<div class="flex gap-2">
				<Button
					class="bg-primary"
					disabled={$formData?.question_text?.trim() === '' ||
						totalOptions.filter((option) => option.value.trim() !== '').length < 2 ||
						!totalOptions.some((option) => option.correct_answer)}
					onclick={submit}>Save Question</Button
				>
			</div>
		</div>
	</div>
</form>
