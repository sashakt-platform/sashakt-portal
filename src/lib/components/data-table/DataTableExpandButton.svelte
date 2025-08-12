<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	let { isExpanded = false, canExpand = false, onToggle = () => {} } = $props();

	function handleClick(e: MouseEvent) {
		console.log('Button click - before:', { isExpanded, canExpand });
		e.stopPropagation();
		e.preventDefault();
		onToggle(e);
		console.log('Button click - after onToggle called');
	}
</script>

{#if canExpand}
	<button
		class="rounded p-1 transition-colors hover:bg-gray-100"
		onclick={handleClick}
		type="button"
	>
		{#if isExpanded}
			<ChevronDown class="h-4 w-4 transition-transform" />
		{:else}
			<ChevronRight class="h-4 w-4 transition-transform" />
		{/if}
	</button>
{/if}
