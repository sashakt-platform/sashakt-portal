<script lang="ts">
	let {
		value = $bindable()
	}: {
		value: boolean;
	} = $props();
</script>

<div class="bg-muted flex h-[41px] w-[176px] shrink-0 items-center rounded-[10px] p-1">
	<button
		type="button"
		class={[
			'h-full flex-1 rounded-lg text-sm transition-colors',
			value ? 'bg-background text-primary font-semibold shadow-sm' : 'font-medium text-muted-foreground'
		]}
		onclick={() => (value = true)}
	>
		On
	</button>
	<button
		type="button"
		class={[
			'h-full flex-1 rounded-lg text-sm transition-colors',
			!value ? 'bg-background text-primary font-semibold shadow-sm' : 'font-medium text-muted-foreground'
		]}
		onclick={() => (value = false)}
	>
		Off
	</button>
</div>
