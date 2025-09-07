<script lang="ts">
	import CircleChevronLeft from '@lucide/svelte/icons/circle-chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Button from '$lib/components/ui/button/button.svelte';
	import Primary from './Primary.svelte';
	import Question from './Question.svelte';
	import Configuration from './Configuration.svelte';

	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { testSchema, type FormSchema } from './schema';
	import type { Filter } from '$lib/types/filters';

	const typeOfScreen = { primary: 1, questions: 2, configuration: 3 };

	let currentScreen: number = $state(typeOfScreen.primary);

	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<FormSchema>>;
			user: any;
			test_taker_url: string;
		};
	} = $props();

	const testData: Partial<Infer<FormSchema>> | null = data?.testData || null;

	const {
		form: formData,
		enhance,
		submit
	} = superForm(testData || data.form, {
		applyAction: 'never',
		validators: zodClient(testSchema),
		dataType: 'json',
		onSubmit() {
			if ($formData.template_id) {
				$formData.template_id = String($formData.template_id);
			}
			if ($formData.is_template) {
				$formData.link = null;
			}
		}
	});

	if (testData) {
		$formData.state_ids =
			testData?.states?.map((state: Filter) => ({
				id: String(state.id),
				name: state.name
			})) || [];

		$formData.district_ids =
			testData?.districts?.map((district: Filter) => ({
				id: String(district.id),
				name: district.name
			})) || [];

		$formData.tag_ids =
			testData?.tags?.map((tag: Filter) => ({
				id: String(tag.id),
				name: tag.name
			})) || [];
		$formData.question_revision_ids =
			testData?.question_revisions?.map((q: { id: number }) => q.id) || [];
	}
</script>

<form method="POST" action="?/save" use:enhance>
	<div class="flex border-b-2 py-2">
		<!-- <div class="flex justify-start"> -->
		<!-- 	<Button variant="link" class=" text-gray-500" href="./" -->
		<!-- 		><CircleChevronLeft />Back to test {$formData.is_template -->
		<!-- 			? 'templates' -->
		<!-- 			: 'sessions'}</Button -->
		<!-- 	> -->
		<!-- </div> -->
		<div class="mx-auto flex">
			{#snippet headerNumbers(
				number: number,
				text: string,
				mode: number,
				isCompleted: boolean = false
			)}
				{@const isActive = mode === currentScreen}
				<Button
					variant="ghost"
					class={[
						'justify-left',
						isActive
							? 'border-primary text-primary border-1 font-bold'
							: isCompleted
								? 'text-primary'
								: '',
						'mx-4'
					]}
					onclick={() => {
						if (isCompleted) {
							currentScreen = mode;
						}
					}}
					><span
						class={[
							isActive
								? 'bg-primary text-white'
								: isCompleted
									? 'text-primary border-primary border-1'
									: 'border-1 border-gray-600 text-gray-500',
							'mr-2 flex h-6 w-6 items-center justify-center rounded-full '
						]}>{number}</span
					>{text}</Button
				>
			{/snippet}
			{@render headerNumbers(
				1,
				'Primary Details',
				typeOfScreen.primary,
				$formData.name.trim() != '' && $formData.description.trim() != ''
			)}
			<ChevronRight class="my-auto w-4" />
			{@render headerNumbers(2, 'Select Questions', typeOfScreen.questions, false)}
			<ChevronRight class="my-auto w-4" />
			{@render headerNumbers(3, 'Configuration Settings', typeOfScreen.configuration, false)}
		</div>
	</div>

	{#if currentScreen === typeOfScreen.primary}
		<Primary {formData} />
	{:else if currentScreen === typeOfScreen.questions}
		<Question {formData} questions={data.questions} />
	{:else if currentScreen === typeOfScreen.configuration}
		<Configuration {formData} />
	{/if}

	<div class="sticky bottom-0 my-4 flex w-full justify-between border-t-4 bg-white p-4">
		<Button href="./" variant="outline" class="text-primary border-primary border-1">Cancel</Button>

		<Button
			class="bg-primary"
			disabled={(currentScreen === typeOfScreen.primary &&
				($formData.name.trim() === '' || $formData.description.trim() === '')) ||
				(currentScreen === typeOfScreen.configuration &&
					$formData.random_questions &&
					$formData.no_of_random_questions <= 0) ||
				$formData.no_of_random_questions > $formData.question_revision_ids.length}
			onclick={() => {
				if (currentScreen === typeOfScreen.configuration) {
					submit();
				} else {
					currentScreen++;
				}
			}}
			>{currentScreen != typeOfScreen.configuration ? 'Continue' : 'Save'}
		</Button>
	</div>
</form>
