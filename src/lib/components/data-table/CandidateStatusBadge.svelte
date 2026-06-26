<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CirclePlay from '@lucide/svelte/icons/circle-play';
	type CandidateStatus = 'submitted' | 'not_submitted';

	const { status }: { status: CandidateStatus } = $props();

	const styles: Record<CandidateStatus, string> = {
		submitted: 'bg-success-subtle text-success',
		not_submitted: 'bg-warning-subtle text-warning'
	};

	const icons: Record<CandidateStatus, typeof CircleCheck> = {
		submitted: CircleCheck,
		not_submitted: CirclePlay
	};

	const iconStyles: Record<CandidateStatus, string> = {
		submitted: 'fill-success text-success-subtle',
		not_submitted: 'font-extrabold text-warning'
	};

	const labels: Record<CandidateStatus, string> = {
		submitted: 'Submitted',
		not_submitted: 'Not Submitted'
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
