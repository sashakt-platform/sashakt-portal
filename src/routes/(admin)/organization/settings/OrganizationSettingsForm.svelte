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
	import PlatformNomenclatureCard from './cards/PlatformNomenclatureCard.svelte';

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
			class="bg-background border-border sticky top-0 z-10 flex h-23 items-center justify-between gap-[14px] border-b p-8"
		>
			<h1 class="font-sans text-[24px] leading-[140%] font-bold tracking-[0px]">
				Organisation Settings
			</h1>
			<div class="flex gap-2">
				<a href={resolve('/organization')}>
					<Button
						type="button"
						variant="outline"
						class="border-primary text-primary border text-sm sm:text-base"
					>
						Cancel
					</Button>
				</a>
				<Button
					type="submit"
					class="bg-primary text-sm sm:text-base"
					disabled={!$tainted || $submitting}>Save</Button
				>
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
			<PlatformNomenclatureCard bind:settings={$formData} />
		</div>
	</div>
</form>
