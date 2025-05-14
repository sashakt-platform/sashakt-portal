<script lang="ts">
	let { children } = $props();
</script>

<div class="m-10 h-screen w-3/4 rounded-2xl bg-white text-center align-middle shadow-2xl">
	<div class="flex h-full flex-col items-center justify-center px-24 py-12">
		{@render children?.()}
	</div>
</div>  
