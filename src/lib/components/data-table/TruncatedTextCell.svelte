<script lang="ts">
	let { value = '' }: { value: string } = $props();
</script>

<span class="block max-w-[25vw] truncate" title={value}>{value}</span>
