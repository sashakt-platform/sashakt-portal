<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	let { title, Icon, children } = $props();

	let visibility: boolean = $state(false);
</script>

<div class="py-1">
	<button
		type="button"
		class={[
			'hover: hover:bg-secondary mt-2 flex w-full cursor-pointer flex-row px-4 py-5 shadow',
			visibility ? 'bg-secondary rounded-t-2xl' : 'rounded-2xl bg-white'
		]}
		onclick={() => (visibility = !visibility)}
	>
		<span class="bg-primary-foreground my-auto w-1/12 rounded-sm p-3">
			<Icon class={['text-primary mx-auto']} />
		</span>
		<p class="w-10/12 p-2 text-left text-xl font-medium">{title}</p>
		<span class="m-auto w-1/12">
			<ChevronDown class={['mx-auto', visibility && 'rotate-180']} />
		</span>
	</button>
	<div
		class={[!visibility && 'hidden', 'flex flex-col gap-6 rounded-b-2xl bg-white p-8 pr-8 pl-12']}
	>
		{@render children()}
	</div>
</div>
