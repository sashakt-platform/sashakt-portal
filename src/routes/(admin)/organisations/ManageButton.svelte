<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Button from '$lib/components/ui/button/button.svelte';

	let { shortcode }: { shortcode: string } = $props();
</script>

<form method="POST" action="?/manage">
	<input type="hidden" name="shortcode" value={shortcode} />
	<Button
		type="submit"
		variant="outline"
		class="border-primary text-primary gap-1 border text-sm"
	>
		Manage
		<ChevronRight size={14} />
	</Button>
</form>
