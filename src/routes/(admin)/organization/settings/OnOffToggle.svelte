<script lang="ts">
	let {
		value = $bindable()
	}: {
		value: boolean;
	} = $props();
</script>

<div class="bg-muted flex shrink-0 rounded-xl p-1">
	<button
		type="button"
		class={[
			'rounded-xl px-4 py-1.5 text-sm transition-colors',
			value ? 'bg-background text-primary font-semibold shadow' : 'text-muted-foreground'
		]}
		onclick={() => (value = true)}
	>
		On
	</button>
	<button
		type="button"
		class={[
			'rounded-xl px-4 py-1.5 text-sm transition-colors',
			!value ? 'bg-background text-primary font-semibold shadow' : 'text-muted-foreground'
		]}
		onclick={() => (value = false)}
	>
		Off
	</button>
</div>
