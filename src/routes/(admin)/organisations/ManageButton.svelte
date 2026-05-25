<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Button from '$lib/components/ui/button/button.svelte';
	import { resolve } from '$app/paths';

	let { id }: { id: number } = $props();
</script>

<a href={resolve(`/organisations/edit/${id}`)}>
	<Button variant="outline" class="border-primary text-primary bg-primary/10 gap-1 border text-sm">
		Manage
		<ChevronRight size={14} />
	</Button>
</a>
