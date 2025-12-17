<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	let { title, Icon, children, ...className } = $props();

	let visibility: boolean = $state(false);
</script>

<div class="py-1" {...className}>
	<button
		type="button"
		class={[
			'hover:bg-secondary mt-2 flex w-full cursor-pointer flex-row items-center border px-3 py-4 shadow sm:px-4 sm:py-5',
			visibility ? 'bg-secondary rounded-t-2xl' : 'rounded-2xl bg-white'
		]}
		onclick={() => (visibility = !visibility)}
	>
		<span class="bg-primary-foreground my-auto shrink-0 rounded-sm p-2 sm:p-3">
			<Icon class={['text-primary mx-auto h-4 w-4 sm:h-5 sm:w-5']} />
		</span>
		<p class="flex-1 p-2 text-left text-base font-medium sm:text-xl">{title}</p>
		<span class="m-auto shrink-0">
			<ChevronDown class={['mx-auto h-5 w-5', visibility && 'rotate-180']} />
		</span>
	</button>
	<div
		class={[
			!visibility && 'hidden',
			'flex flex-col gap-4 rounded-b-2xl bg-white p-4 sm:gap-6 sm:p-6 sm:pl-10 md:p-8 md:pl-12',
			'border'
		]}
	>
		{@render children()}
	</div>
</div>
