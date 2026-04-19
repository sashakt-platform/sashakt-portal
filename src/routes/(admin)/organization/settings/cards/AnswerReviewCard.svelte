<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import FeatureCard from '../FeatureCard.svelte';
	import { ANSWER_REVIEW_OPTIONS, type OrganizationSettings } from '../schema';

	let { settings = $bindable() }: { settings: OrganizationSettings } = $props();

	const labels: Record<(typeof ANSWER_REVIEW_OPTIONS)[number], string> = {
		off: 'Off',
		after_each_question: 'After each question',
		end_of_test: 'At end of test',
		after_question_and_after_test: 'After each question and at end of test'
	};
</script>

<FeatureCard
	title="Answer Review"
	description="Set when candidates can see correct answers for questions they've attempted"
	bind:mode={settings.answer_review.mode}
>
	<div class="flex items-center justify-between gap-4">
		<span class="text-foreground text-sm font-semibold"
			>When should candidates be able to review their answers?</span
		>
		<Select.Root type="single" bind:value={settings.answer_review.value.default}>
			<Select.Trigger class="h-11 w-64 rounded-full px-5">
				{labels[settings.answer_review.value.default]}
			</Select.Trigger>
			<Select.Content>
				{#each ANSWER_REVIEW_OPTIONS as option (option)}
					<Select.Item value={option} label={labels[option]} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
</FeatureCard>
