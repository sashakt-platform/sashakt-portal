<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';

	let { onClick }: { onClick: () => void } = $props();
</script>

<Button
	variant="outline"
	size="sm"
	class="text-primary border-primary/40 font-medium"
	onclick={onClick}
>
	View Report
</Button>
