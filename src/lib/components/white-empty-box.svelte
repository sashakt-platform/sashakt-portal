<script lang="ts">
	let { children } = $props();
</script>

<div
	class="m-4 h-dvh w-full rounded-2xl bg-white text-center align-middle shadow-2xl sm:m-6 md:m-10"
>
	<div
		class="flex h-dvh flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10 md:px-24 md:py-12"
	>
		{@render children?.()}
	</div>
</div>
