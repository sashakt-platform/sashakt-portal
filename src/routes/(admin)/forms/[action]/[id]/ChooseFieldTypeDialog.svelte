<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import FieldTypeGrid from './FieldTypeGrid.svelte';
	import type { FormFieldTypeValue } from './schema.js';

	interface Props {
		open: boolean;
		onSelect: (fieldType: FormFieldTypeValue) => void;
		onClose: () => void;
	}

	let { open = $bindable(), onSelect, onClose }: Props = $props();
</script>

<Dialog.Root bind:open onOpenChange={(val) => !val && onClose()}>
	<Dialog.Content class="sm:max-w-[700px]">
		<Dialog.Header>
			<Dialog.Title class="text-xl font-semibold">Choose Field Type</Dialog.Title>
		</Dialog.Header>

		<div class="py-2">
			<FieldTypeGrid onSelect={(type) => onSelect(type)} />
		</div>
	</Dialog.Content>
</Dialog.Root>
