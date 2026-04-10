<script lang="ts">
	import { formatDatePart, formatTimePart } from '$lib/utils';
	const { value }: { value: string } = $props();
</script>

<div class="flex flex-col">
	<span class="text-foreground text-sm font-medium">{formatDatePart(value)}</span>
	<span class="text-muted-foreground text-xs">{formatTimePart(value)}</span>
</div>
