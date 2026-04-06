<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Button from '$lib/components/ui/button/button.svelte';
	import Primary from './Primary.svelte';
	import QuestionList from './QuestionList.svelte';
	import Configuration from './Configuration.svelte';

	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { testSchema, type FormSchema } from './schema';
	import type { Filter } from '$lib/types/filters';
	import { goto } from '$app/navigation';

	const typeOfScreen = { primary: 1, questions: 2, configuration: 3 };

	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<FormSchema>>;
			user: any;
			test_taker_url: string;
			testData: Partial<Infer<FormSchema>> | null;
			templates: any;
			templateParams: any;
			convertTemplate: boolean;
			questions: any;
			selectedQuestions: any;
			questionParams: any;
		};
	} = $props();

	const testData: Partial<Infer<FormSchema>> | null = data?.testData || null;
	const isEditing = $derived(!!testData);
	const convertTemplate = $derived(data.convertTemplate);
	let selectedTemplateId = $state<string | null>(null);
	let currentScreen: number = $state(typeOfScreen.primary);

	$effect(() => {
		if (data.convertTemplate && data.testData) {
			currentScreen = typeOfScreen.questions;
		}
	});

	const {
		form: formData,
		enhance,
		submit
	} = superForm(testData || data.form, {
		applyAction: 'never',
		validators: zod4Client(testSchema),
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

	function populateFormFromTestData(td: typeof testData) {
		if (!td) return;
		$formData.name = (td as any)?.name || '';
		$formData.description = (td as any)?.description || '';
		$formData.state_ids =
			td?.states?.map((state: Filter) => ({
				id: String(state.id),
				name: state.name
			})) || [];
		$formData.district_ids =
			td?.districts?.map((district: Filter) => ({
				id: String(district.id),
				name: district.name
			})) || [];
		$formData.tag_ids =
			td?.tags?.map((tag: Filter) => ({
				id: String(tag.id),
				name: tag.name
			})) || [];
		$formData.question_revision_ids =
			td?.question_revisions?.map((q: { id: number }) => q.id) || [];
		$formData.question_revisions = td?.question_revisions || [];
		$formData.random_tag_count =
			(
				td?.random_tag_counts as
					| Array<{ tag: { id: string; name: string; tag_type?: { name: string } }; count: number }>
					| undefined
			)?.map((t) => ({
				id: String(t.tag.id),
				name: t.tag.name + (t.tag.tag_type?.name ? `- (${t.tag.tag_type?.name})` : ''),
				count: t.count
			})) || [];
	}

	populateFormFromTestData(testData);

	$effect(() => {
		if (data.convertTemplate && data.testData) {
			populateFormFromTestData(data.testData as typeof testData);
		}
	});

	const pageTitle = $derived.by(() => {
		if ($formData.is_template) {
			return isEditing ? 'Edit Test Template' : 'Create Test Template';
		}
		return isEditing ? 'Edit Test' : 'Create Test';
	});

	const isNextDisabled = $derived(
		(currentScreen === typeOfScreen.primary && convertTemplate && !selectedTemplateId) ||
			(currentScreen === typeOfScreen.primary &&
				!convertTemplate &&
				($formData.name ?? '').trim() === '') ||
			(currentScreen === typeOfScreen.configuration &&
				$formData.random_questions &&
				($formData.no_of_random_questions ?? 0) <= 0) ||
			($formData.no_of_random_questions ?? 0) > ($formData.question_revision_ids ?? []).length
	);

	function handlePrevious() {
		if (currentScreen > typeOfScreen.primary) {
			currentScreen--;
		}
	}

	function handleNext() {
		if (currentScreen === typeOfScreen.primary && convertTemplate) {
			goto(`?template_id=${selectedTemplateId}`, { invalidateAll: true });
			return;
		}
		if (currentScreen === typeOfScreen.configuration) {
			submit();
		} else {
			currentScreen++;
		}
	}

	const steps = $derived.by(() => [
		{
			number: 1,
			label: convertTemplate ? 'Select Template' : 'Primary Details',
			mode: typeOfScreen.primary
		},
		{ number: 2, label: 'Select Questions', mode: typeOfScreen.questions },
		{ number: 3, label: 'Test Configuration', mode: typeOfScreen.configuration }
	]);
</script>

<form method="POST" action="?/save" use:enhance class="pb-10">
	<!-- Page Header -->
	<div class="bg-gray-0 border-b px-6 py-4">
		<div class="flex items-start justify-between">
			<!-- Left: Back arrow, title, stepper -->
			<div class="flex items-start gap-3">
				<a href="./" class="text-muted-foreground hover:text-foreground mt-1 transition-colors">
					<ArrowLeft class="h-5 w-5" />
				</a>
				<div>
					<h1 class="text-xl font-semibold">{pageTitle}</h1>
					<!-- Stepper -->
					<div class="mt-3 flex items-center gap-1 sm:gap-2">
						{#each steps as step, i}
							{@const isActive = step.mode === currentScreen}
							{@const isCompleted = step.mode < currentScreen}
							{#if i > 0}
								<ChevronRight class="text-muted-foreground h-4 w-4 shrink-0" />
							{/if}
							<button
								type="button"
								class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors {isCompleted
									? 'cursor-pointer'
									: ''}"
								onclick={() => {
									if (isCompleted) currentScreen = step.mode;
								}}
								disabled={!isCompleted && !isActive}
							>
								<span
									class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium {isActive
										? 'bg-primary text-white'
										: isCompleted
											? 'bg-primary/10 text-primary'
											: 'bg-muted text-muted-foreground'}"
								>
									{step.number}
								</span>
								<span
									class="hidden sm:inline {isActive
										? 'text-foreground font-semibold'
										: isCompleted
											? 'text-foreground'
											: 'text-muted-foreground font-light'}"
								>
									{step.label}
								</span>
							</button>
						{/each}
					</div>
				</div>
			</div>
			<!-- Right: Navigation buttons -->
			<div class="flex shrink-0 items-center gap-3">
				<Button
					variant="outline"
					class="border-primary text-primary"
					disabled={currentScreen === typeOfScreen.primary}
					onclick={handlePrevious}
				>
					Previous
				</Button>
				<Button class="bg-primary" disabled={isNextDisabled} onclick={handleNext}>
					{currentScreen === typeOfScreen.configuration ? 'Save' : 'Next'}
				</Button>
			</div>
		</div>
	</div>

	<!-- Content -->
	{#if currentScreen === typeOfScreen.primary || currentScreen === typeOfScreen.questions}
		<div class="mx-4 mt-4 sm:mx-8 md:mx-10">
			<div class="bg-gray-0 overflow-hidden rounded-2xl border border-gray-300">
				{#if currentScreen === typeOfScreen.primary}
					<Primary
						{formData}
						user={data.user}
						{convertTemplate}
						templates={data.templates}
						templateParams={data.templateParams}
						bind:selectedTemplateId
					/>
				{:else if currentScreen === typeOfScreen.questions}
					<QuestionList
						{formData}
						questions={data.questions}
						questionParams={data.questionParams}
						user={data.user}
					/>
				{/if}
			</div>
		</div>
	{:else if currentScreen === typeOfScreen.configuration}
		<Configuration {formData} />
	{/if}

	<!-- Bottom Navigation -->
	<div class="mx-4 mt-6 flex items-center justify-end gap-3 sm:mx-8 md:mx-10">
		<Button
			variant="outline"
			class="border-primary text-primary"
			disabled={currentScreen === typeOfScreen.primary}
			onclick={handlePrevious}
		>
			Previous
		</Button>
		<Button class="bg-primary" disabled={isNextDisabled} onclick={handleNext}>
			{currentScreen === typeOfScreen.configuration ? 'Save' : 'Next'}
		</Button>
	</div>
</form>
