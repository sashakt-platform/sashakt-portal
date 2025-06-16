<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import History from '@lucide/svelte/icons/history';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Plus from '@lucide/svelte/icons/plus';
	import { Input } from '$lib/components/ui/input';
	import Button from '$lib/components/ui/button/button.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { questionSchema, type FormSchema } from './schema';
	import { zodClient } from 'sveltekit-superforms/adapters';

	const { data }: { data: { form: SuperValidated<Infer<FormSchema>> } } = $props();

	const questionData: Partial<Infer<FormSchema>> | null = data?.questionData || null;

	console.log('Edit Question Data:', questionData);

	console.log('Data:', data);
	const {
		form: formData,
		enhance,
		submit
	} = superForm(questionData || data.form, {
		validators: zodClient(questionSchema),
		dataType: 'json',
		onSubmit: () => {
			$formData.options = totalOptions.map((option) => {
				return { [option.key]: option.value };
			});
			$formData.correct_answer = totalOptions
				.filter((option) => option.correct_answer)
				.map((option) => option.id - 1);
			$formData.created_by_id = data.user.id;
			$formData.organization_id = data.user.organization_id;
			console.log('Form submitted with data:', $formData);
		},
		onError: (error) => {
			console.error('Form submission error:', error);
		}
	});

	questionData &&
		($formData.state_ids = questionData.locations?.map((state: any) => {
			console.log('State ID:', state.state_id);
			return String(state.state_id);
		}));

	questionData &&
		($formData.tag_ids = questionData.tags?.map((tag: any) => {
			console.log('State ID:', tag.id);
			return String(tag.id);
		}));

	let totalOptions = $state<{ id: number; key: string; value: string; correct_answer: boolean }[]>(
		questionData
			? questionData?.options.map((v, k) => {
					console.log('Option:', v, 'Index:', k);
					const key = Object.keys(v)[0];
					const value = v[key];
					console.log('key:', key, 'value:', value);
					return {
						id: k + 1,
						key: key, // Convert index to A, B, C, D...
						value: value || '',
						correct_answer: questionData?.correct_answer.includes(k) ? true : false
					};
				})
			: [
					{ id: 1, key: 'A', value: '', correct_answer: false },
					{ id: 2, key: 'B', value: '', correct_answer: false },
					{ id: 3, key: 'C', value: '', correct_answer: false },
					{ id: 4, key: 'D', value: '', correct_answer: false }
				]
	);

	$effect(() => useSidebar().setOpen(false));

	// $effect(() => {
	// 	console.log('totalOptions:', $inspect(totalOptions));
	// });

	// $effect(() => {
	// 	console.log('Form Data:', $inspect($formData));
	// });
</script>

<div class="w-screen">
	<form method="POST" action="?/save" use:enhance>
		<div class="mx-auto flex flex-col gap-10 py-8 sm:w-[90%]">
			{#snippet snippetHeading(title: string)}
				<div class="bg-primary-foreground flex flex-row gap-3 rounded-sm px-4 py-3 align-middle">
					<Label class="text-md my-auto font-bold">{title}</Label><Info
						class="my-auto w-4 align-middle text-xs text-gray-600"
					/>
				</div>
			{/snippet}
			<div class=" flex flex-row">
				<div class="my-auto flex flex-col">
					<div class=" flex w-full items-center align-middle">
						<div class="flex flex-row">
							<h2
								class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
							>
								Create a question
							</h2>
							<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
						</div>
					</div>
					<Label class="my-auto align-middle text-sm font-extralight"
						>Add questions with tags and details</Label
					>
				</div>
				<div
					class={['text-primary my-auto ml-auto flex cursor-pointer flex-row gap-2 p-4 font-bold']}
				>
					<History />
					<p>Revision History</p>
				</div>
			</div>
			<div class="flex h-screen w-full flex-row divide-x-1 bg-white p-8">
				<div class="flex w-3/5 flex-col gap-2 pr-8">
					<div class="flex flex-col gap-2">
						{@render snippetHeading('Your Question')}
						<Textarea name="questionText" bind:value={$formData.question_text} />
						<div class="flex flex-row gap-2">
							<Checkbox
								onCheckedChange={(checked: boolean) => ($formData.is_mandatory = checked)}
							/><Label class="text-sm ">Set as mandatory</Label>
						</div>
					</div>
					<div class="flex flex-col gap-4 overflow-y-scroll scroll-auto">
						{@render snippetHeading('Answers')}

						{#each totalOptions as { id, key, value }, index}
							<div class="flex flex-row gap-4">
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
											checked={totalOptions[index].correct_answer}
											onCheckedChange={(checked: boolean) =>
												(totalOptions[index].correct_answer = checked)}
										/><Label class="text-sm ">Set as correct answer</Label>
									</div>
								</div>
							</div>
						{/each}

						<div class="flex justify-end">
							<Button
								variant="outline"
								class="text-primary border-primary"
								onclick={() => {
									totalOptions.push({
										id: totalOptions.length + 1,
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
					</div>
					<div class="flex h-1/2 flex-col gap-2">
						{@render snippetHeading('States')}
						<StateSelection bind:states={$formData.state_ids} />
						<div class="mt-12 flex items-center space-x-2">
							<Switch id="airplane-mode" class="bg-green-400" />
							<Label for="airplane-mode">Active</Label><Info
								class="my-auto w-4 align-middle text-xs text-gray-600"
							/>
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
					<Button class="bg-primary-foreground text-primary font-bold">Preview Question</Button>
					<Button
						class="bg-primary"
						disabled={$formData.question_text.trim() === '' ||
							totalOptions.filter((option) => option.value.trim() !== '').length < 2 ||
							!totalOptions.some((option) => option.correct_answer)}
						onclick={() => {
							submit();
						}}>Save Question</Button
					>
				</div>
			</div>
		</div>
	</form>
</div>
