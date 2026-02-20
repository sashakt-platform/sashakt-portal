<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
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
	import * as Select from '$lib/components/ui/select/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Tag from './Tag.svelte';
	import QuestionRevision from './QuestionRevision.svelte';
	import TooltipInfo from '$lib/components/TooltipInfo.svelte';
	import QuestionPreview from './QuestionPreview.svelte';
	import { isStateAdmin, getUserState, type User } from '$lib/utils/permissions.js';
	import { dragHandleZone, dragHandle } from 'svelte-dnd-action';

	const {
		data
	}: {
		data: {
			form: SuperValidated<Infer<FormSchema>>;
			tagForm: SuperValidated<Infer<TagFormSchema>>;
			tagTypes: [];
			user: User;
		};
	} = $props();

	const questionData: Partial<Infer<FormSchema>> | null = data?.questionData || null;

	const {
		form: formData,
		enhance,
		submit
	} = superForm(questionData || data.form, {
		applyAction: 'never',
		validators: zod4Client(questionSchema),
		dataType: 'json',
		onSubmit: () => {
			if ($formData.question_type === QuestionTypeEnum.Subjective) {
				$formData.options = [];
				$formData.correct_answer = [];
			} else {
				$formData.options = totalOptions.map((option) => {
					return { id: option.id, key: option.key, value: option.value };
				});
				$formData.correct_answer = totalOptions
					.filter((option) => option.correct_answer)
					.map((option) => option.id);

				$formData.question_type =
					$formData.correct_answer.length > 1
						? QuestionTypeEnum.MultiChoice
						: QuestionTypeEnum.SingleChoice;
			}
			$formData.organization_id = data.user.organization_id;
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

	// for State admins, auto-assign their state when creating a new question
	// backend should handle this as well
	$effect(() => {
		if (isStateAdmin(data.user) && (!$formData.state_ids || $formData.state_ids.length === 0)) {
			const userState = getUserState(data.user);
			if (userState) {
				$formData.state_ids = [{ id: String(userState.id), name: userState.name }];
			}
		}
	});
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
		<div class="mx-4 flex flex-col gap-4 sm:mx-6 md:mx-10 md:flex-row">
			<div class="my-auto flex flex-col">
				<div class="flex w-full items-center align-middle">
					<div class="flex flex-row">
						<h2
							class="mr-2 w-fit scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 sm:text-3xl"
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
				class={[
					'text-primary my-auto flex cursor-pointer flex-row gap-2 p-2 font-bold md:ml-auto md:p-4'
				]}
			>
				{#if questionData}
					<QuestionRevision {data} />
				{/if}
			</div>
		</div>
		<div class="mx-4 flex flex-col gap-6 bg-white p-4 sm:mx-6 sm:p-6 md:mx-10 md:gap-8 md:p-9">
			<div class="flex flex-col gap-6 lg:flex-row lg:gap-0">
				<div class="flex w-full flex-col gap-4 lg:w-3/5 lg:pr-8">
					<div class="flex flex-col gap-2">
						{@render snippetHeading('Question')}
						<Textarea
							name="questionText"
							bind:value={$formData.question_text}
							placeholder="Enter your Question..."
						/>
						<div class="flex flex-col gap-4">
							<div class="flex flex-row items-center gap-2">
								<Checkbox bind:checked={$formData.is_mandatory} />
								<Label class="text-sm">Set as mandatory</Label>
							</div>
							<div class="flex flex-row items-center gap-2">
								<Label class="text-sm text-gray-600">Question Type</Label>
								<Select.Root
									type="single"
									value={$formData.question_type === QuestionTypeEnum.MultiChoice
										? QuestionTypeEnum.SingleChoice
										: $formData.question_type}
									onValueChange={(value) => {
										$formData.question_type = value as QuestionTypeEnum;
									}}
								>
									<Select.Trigger class="w-48 border-gray-300">
										<span>
											{#if $formData.question_type === QuestionTypeEnum.Subjective}
												Subjective
											{:else if $formData.question_type === QuestionTypeEnum.NumericalInteger}
												Numerical (Integer)
											{:else if $formData.question_type === QuestionTypeEnum.NumericalDecimal}
												Numerical (Decimal)
											{:else}
												Single/Multichoice
											{/if}
										</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Item value={QuestionTypeEnum.SingleChoice}
											>Single/Multichoice</Select.Item
										>
										<Select.Item value={QuestionTypeEnum.Subjective}>Subjective</Select.Item>
										<Select.Item value={QuestionTypeEnum.NumericalInteger}
											>Numerical (Integer)</Select.Item
										>
										<Select.Item value={QuestionTypeEnum.NumericalDecimal}
											>Numerical (Decimal)</Select.Item
										>
									</Select.Content>
								</Select.Root>
							</div>
						</div>
					</div>
					{#if $formData.question_type === QuestionTypeEnum.Subjective}
						<div class="flex flex-col gap-2">
							{@render snippetHeading('Answer Settings')}
							<div class="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
								<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
									<Label for="subjective-limit" class="text-sm font-medium sm:w-48">
										Maximum character limit
									</Label>
									<div class="flex items-center gap-2">
										<Input
											id="subjective-limit"
											type="number"
											min="1"
											max="10000"
											placeholder="e.g., 500"
											class="w-32"
											bind:value={$formData.subjective_answer_limit}
										/>
										<span class="text-sm text-gray-500">characters</span>
									</div>
								</div>
								<p class="text-xs text-gray-500">
									Leave empty for unlimited. Recommended: 200-1000 characters for short answers,
									1000-5000 for essays.
								</p>
							</div>
						</div>
					{:else if $formData.question_type === QuestionTypeEnum.SingleChoice || $formData.question_type === QuestionTypeEnum.MultiChoice}
						<div class="flex flex-col gap-4 overflow-y-scroll scroll-auto">
							{@render snippetHeading('Answer')}

							<div
								use:dragHandleZone={{ items: totalOptions, flipDurationMs: 150 }}
								onconsider={({ detail }) => (totalOptions = detail.items)}
								onfinalize={({ detail }) => {
									totalOptions = detail.items.map((opt, i) => ({
										...opt,
										key: String.fromCharCode(65 + i)
									}));
								}}
							>
								{#each totalOptions as { id, key, value }, index (id)}
									<div class="group flex flex-row gap-4">
										<div class="bg-primary-foreground h-12 w-12 rounded-sm text-center">
											<p
												class="flex h-full w-full items-center justify-center text-xl font-semibold"
											>
												{key}
											</p>
										</div>
										<div class="flex w-full flex-col gap-2">
											<div class="flex flex-row rounded-sm border-1 border-black">
												<span use:dragHandle aria-label="drag handle">
													<GripVertical class="my-auto h-full cursor-grab rounded-sm bg-gray-100" />
												</span>
												<Input
													class=" border-0"
													name={key}
													bind:value={totalOptions[index].value}
												/>
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
												'mt-2 gap-0 opacity-0',
												totalOptions.length > 1 ? 'group-hover:opacity-100' : ''
											]}
										>
											<Trash_2
												data-testid="trash-icon"
												size={18}
												class={[
													'text-muted-foreground hover:text-destructive m-0 my-auto p-0',
													totalOptions.length > 1 ? 'cursor-pointer' : ''
												]}
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
							</div>

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
					{:else}
						<div class="flex flex-col gap-2">
							{@render snippetHeading('Correct Answer')}
							<Input
								type="number"
								step={$formData.question_type === QuestionTypeEnum.NumericalDecimal ? 'any' : '1'}
								class="w-full"
							/>
						</div>
					{/if}
				</div>
				<div class="flex w-full flex-col gap-6 lg:w-2/5 lg:gap-4 lg:pl-8">
					<div class="flex flex-col gap-2">
						{@render snippetHeading('Tags')}
						<TagsSelection bind:tags={$formData.tag_ids} />
						<Dialog.Root bind:open={openTagDialog}>
							<Label
								onclick={() => (openTagDialog = true)}
								class="text-primary flex cursor-pointer flex-row items-center text-xs font-bold"
								><Plus class="mr-1 w-3 text-xs" />Create a new tag</Label
							>
							<Dialog.Content
								class="max-h-[90vh] p-4 px-0 sm:h-[70%] sm:max-w-[90%] md:max-w-[70%] lg:max-w-[45%]"
							>
								<Dialog.Header class="m-0 h-fit border-b-2 py-4">
									<Dialog.Title class="px-8">Create new tag</Dialog.Title>
								</Dialog.Header>
								<Tag tagTypes={data.tagTypes} form={data.tagForm} bind:open={openTagDialog} />
							</Dialog.Content>
						</Dialog.Root>
					</div>
					<div class="flex flex-col gap-2">
						{#if !isStateAdmin(data.user)}
							{@render snippetHeading('States')}
							<StateSelection bind:states={$formData.state_ids} />
						{/if}
						<div class="mt-6 flex items-center space-x-2 lg:mt-12">
							<Switch id="is-active" bind:checked={$formData.is_active} />
							<Label for="is-active">Is Active?</Label><Info
								class="my-auto w-4 align-middle text-xs text-gray-600"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="flex flex-col gap-6 md:flex-row md:gap-8">
				<div class="flex w-full flex-row gap-4 md:w-1/2">
					<div class="flex w-full flex-col gap-2">
						{@render snippetHeading('Additional Instructions')}
						<Textarea name="instructions" bind:value={$formData.instructions} placeholder="" />
					</div>
				</div>
				<div class="flex w-full flex-row gap-4 md:w-1/2">
					<div class="flex w-full flex-col gap-2">
						{@render snippetHeading('Marking Scheme')}
						<div
							class="flex h-full flex-col gap-2 rounded-lg border border-gray-100 p-4 sm:flex-row"
						>
							<p class="my-auto sm:w-1/2">Marks for correct answer</p>
							<input
								type="number"
								name="marking_scheme.correct"
								bind:value={$formData.marking_scheme.correct}
								min="1"
								class="w-full rounded-sm border-1 border-gray-300 p-2 sm:w-auto"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="sticky bottom-0 my-2 flex w-full border-t-4 bg-white p-3 sm:my-4 sm:p-4">
		<div class="flex w-full justify-between gap-2">
			<a href="/questionbank">
				<Button variant="outline" class="text-primary border-primary border-1 text-sm sm:text-base"
					>Cancel</Button
				>
			</a>
			<div class="flex gap-2">
				<QuestionPreview
					data={{
						question_text: $formData.question_text,
						options: totalOptions,
						instructions: $formData.instructions,
						marking_scheme: $formData.marking_scheme,
						is_mandatory: $formData.is_mandatory,
						question_type: $formData.question_type
					}}
				/>

				<Button
					class="bg-primary text-sm sm:text-base"
					disabled={$formData?.question_text?.trim() === '' ||
						($formData.question_type !== QuestionTypeEnum.Subjective &&
							(totalOptions.filter((option) => option.value.trim() !== '').length < 2 ||
								!totalOptions.some((option) => option.correct_answer)))}
					onclick={submit}>Save</Button
				>
			</div>
		</div>
	</div>
</form>
