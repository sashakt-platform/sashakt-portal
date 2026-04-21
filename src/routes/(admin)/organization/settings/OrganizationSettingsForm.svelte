<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import { organizationSettingsSchema } from './schema';
	import TestTimingsCard from './cards/TestTimingsCard.svelte';
	import QuestionsPerPageCard from './cards/QuestionsPerPageCard.svelte';
	import MarkingSchemeCard from './cards/MarkingSchemeCard.svelte';
	import AnswerReviewCard from './cards/AnswerReviewCard.svelte';
	import QuestionPaletteCard from './cards/QuestionPaletteCard.svelte';
	import MarkForReviewCard from './cards/MarkForReviewCard.svelte';
	import OmrModeCard from './cards/OmrModeCard.svelte';

	let { data }: { data: PageData } = $props();

	const form = superForm(data.form, {
		validators: zod4Client(organizationSettingsSchema),
		dataType: 'json'
	});

	const { form: formData, enhance, tainted, submitting } = form;
</script>

<form method="POST" use:enhance action="?/save">
	<div class="bg-muted/40 min-h-screen">
		<header
			class="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 md:px-10"
		>
			<h2 class="text-2xl font-semibold tracking-tight">Organisation Settings</h2>
			<div class="flex gap-3">
				<a href={resolve('/organization')}>
					<Button type="button" variant="outline" class="border-primary text-primary">
						Cancel
					</Button>
				</a>
				<Button type="submit" class="bg-primary" disabled={!$tainted || $submitting}>Save</Button>
			</div>
		</header>

		<div class="mx-auto flex max-w-[720px] flex-col gap-6 px-4 py-8 sm:px-6 md:px-10">
			<TestTimingsCard bind:settings={$formData} />
			<QuestionsPerPageCard bind:settings={$formData} />
			<MarkingSchemeCard bind:settings={$formData} />
			<AnswerReviewCard bind:settings={$formData} />
			<QuestionPaletteCard bind:settings={$formData} />
			<MarkForReviewCard bind:settings={$formData} />
			<OmrModeCard bind:settings={$formData} />
		</div>
	</div>
</form>
