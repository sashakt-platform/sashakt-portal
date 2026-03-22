<script lang="ts">
	let { value = '' }: { value: string } = $props();
</script>

<span class="block max-w-full truncate" title={value}>{value}</span>
