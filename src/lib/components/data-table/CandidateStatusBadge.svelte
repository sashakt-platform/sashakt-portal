<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CirclePlay from '@lucide/svelte/icons/circle-play';
	type CandidateStatus = 'submitted' | 'in_progress';

	const { status }: { status: CandidateStatus } = $props();

	const styles: Record<CandidateStatus, string> = {
		submitted: 'bg-success-subtle text-success',
		in_progress: 'bg-warning-subtle text-warning'
	};

	const icons: Record<CandidateStatus, typeof CircleCheck> = {
		submitted: CircleCheck,
		in_progress: CirclePlay
	};

	const iconStyles: Record<CandidateStatus, string> = {
		submitted: 'fill-success text-success-subtle',
		in_progress: 'font-extrabold text-warning'
	};

	const labels: Record<CandidateStatus, string> = {
		submitted: 'Submitted',
		in_progress: 'In Progress'
	};

	const style = $derived(status ? (styles[status] ?? 'bg-muted text-muted-foreground') : '');
	const Icon = $derived(status ? icons[status] : null);
	const iconStyle = $derived(status ? (iconStyles[status] ?? '') : '');
	const label = $derived(status ? (labels[status] ?? status) : '');
</script>

{#if status && Icon}
	<span
		class="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-medium {style}"
	>
		<Icon size={14} class={iconStyle} />
		{label}
	</span>
{/if}
