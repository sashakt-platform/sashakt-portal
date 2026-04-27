<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Clock from '@lucide/svelte/icons/clock';
	import CirclePlay from '@lucide/svelte/icons/circle-play';
	import type { TestStatus } from '$lib/types/test.js';

	const { status }: { status: TestStatus } = $props();

	const styles: Record<TestStatus, string> = {
		'In Progress': 'bg-warning-subtle text-warning',
		Completed: 'bg-success-subtle text-success',
		Scheduled: 'bg-muted text-muted-foreground'
	};

	const icons: Record<TestStatus, typeof CircleCheck> = {
		'In Progress': CirclePlay,
		Completed: CircleCheck,
		Scheduled: Clock
	};

	const iconStyles: Record<TestStatus, string> = {
		'In Progress': 'font-extrabold text-warning',
		Completed: 'fill-success text-success-subtle',
		Scheduled: 'fill-muted-foreground text-muted'
	};

	const style = $derived(status ? (styles[status] ?? 'bg-muted text-muted-foreground') : '');
	const Icon = $derived(status ? icons[status] : null);
	const iconStyle = $derived(status ? (iconStyles[status] ?? '') : '');
</script>

{#if status && Icon}
	<span
		class="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-medium {style}"
	>
		<Icon size={14} class={iconStyle} />
		{status}
	</span>
{/if}
