<script lang="ts">
	let {
		value = $bindable()
	}: {
		value: boolean;
	} = $props();
</script>

<div class="bg-muted flex shrink-0 rounded-lg p-1">
	<button
		type="button"
		class={[
			'rounded-md px-8 py-2 text-sm transition-colors',
			value
				? 'bg-background text-primary font-semibold shadow-sm'
				: 'text-muted-foreground font-medium'
		]}
		onclick={() => (value = true)}
	>
		On
	</button>
	<button
		type="button"
		class={[
			'rounded-md px-8 py-2 text-sm transition-colors',
			!value
				? 'bg-background text-primary font-semibold shadow-sm'
				: 'text-muted-foreground font-medium'
		]}
		onclick={() => (value = false)}
	>
		Off
	</button>
</div>
