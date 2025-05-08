<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import Info from '@lucide/svelte/icons/info';
</script>

<div class="mt-10 ml-10 flex w-full items-center align-middle">
	<span class="flex flex-row">
		<h2
			class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
		>
			Tests
		</h2>
		<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
	</span>
</div>
<Label class="my-auto ml-10 align-middle text-sm font-extralight">Manage Tests</Label>

<div class="m-10 h-20 w-3/4 rounded-2xl bg-white pt-6 text-center shadow-2xl">
	There are no tests.
</div>
