<script lang="ts">
	let { children, ...rest } = $props();
</script>

<div class="m-10 h-dvh w-full rounded-2xl bg-white text-center align-middle shadow-2xl" {...rest}>
	<div class="flex h-dvh flex-col items-center justify-center px-24 py-12">
		{@render children?.()}
	</div>
</div>
