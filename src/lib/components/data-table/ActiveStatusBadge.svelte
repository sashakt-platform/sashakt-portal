<script lang="ts">
	const { active }: { active: boolean } = $props();
</script>

<span
	style="width:110px; height:29px; padding: 6px 14px 6px 12px; gap:6px; border-radius:1000px;"
	class="inline-flex items-center justify-center text-sm font-medium {active
		? 'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success-bold))]'
		: 'bg-muted text-muted-foreground'}"
>
	{active ? 'Active' : 'Inactive'}
</span>
