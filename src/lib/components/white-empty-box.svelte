<script lang="ts">
	let { children } = $props();
</script>

<div class="m-10 h-dvh rounded-2xl bg-white text-center align-middle shadow-2xl">
	<div class="flex h-dvh flex-col items-center justify-center px-24 py-12">
		{@render children?.()}
	</div>
</div>
