<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Eye from '@lucide/svelte/icons/eye';
	import FormPreviewDialog from './FormPreviewDialog.svelte';
	import type { FormField } from './schema.js';

	const {
		formName = '',
		formDescription = null,
		fields = []
	}: {
		formName: string;
		formDescription?: string | null;
		fields: FormField[];
	} = $props();

	let open = $state(false);
</script>

<Button
	type="button"
	variant="outline"
	onclick={() => (open = true)}
	class="border-primary text-primary gap-2 border text-sm sm:text-base"
>
	<Eye size={16} />Preview</Button
>

<FormPreviewDialog bind:open {formName} {formDescription} {fields} />
