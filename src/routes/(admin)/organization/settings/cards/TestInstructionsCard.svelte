<script lang="ts">
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import type { OrganizationSettings } from '../schema';
	import { useTerms } from '$lib/nomenclature';

	const term = useTerms();

	let { settings = $bindable() }: { settings: OrganizationSettings } = $props();
</script>

<section class="border-border rounded-2xl border bg-white shadow-sm">
	<header class="px-8 pt-7 pb-6">
		<h3 class="text-xl font-semibold text-gray-800">Test Instructions</h3>
		<p class="text-muted-foreground mt-2 text-sm">
			Default pre-test and completion messages pre-populated when creating a new {term(
				'test',
				'lower'
			)}.
		</p>
	</header>
	<hr class="border-border mx-8" />
	<div class="flex flex-col gap-6 px-8 py-7">
		<div>
			<p class="mb-2 text-sm font-semibold">Pre-test Instructions</p>
			<RichTextEditor
				placeholder="E.g., Ensure stable internet. Read each question carefully..."
				bind:value={settings.pre_test_instructions.value.text}
			/>
		</div>
		<div>
			<p class="mb-2 text-sm font-semibold">{term('test')} Completion Message</p>
			<RichTextEditor
				placeholder="E.g., Thank you for completing the assessment. Your results will be shared soon."
				bind:value={settings.completion_message.value.text}
			/>
		</div>
	</div>
</section>
