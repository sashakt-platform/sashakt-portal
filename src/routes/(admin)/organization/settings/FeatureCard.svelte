<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SettingMode } from './schema';

	let {
		title,
		description,
		mode = $bindable(),
		children
	}: {
		title: string;
		description: string;
		mode: SettingMode;
		children: Snippet;
	} = $props();
</script>

<section class="border-border rounded-2xl border bg-white shadow-sm">
	<header class="flex items-start justify-between gap-6 px-8 pt-7 pb-6">
		<div class="max-w-xl min-w-0">
			<h3 class="text-foreground text-xl font-bold">{title}</h3>
			<p class="text-muted-foreground mt-2 text-sm">{description}</p>
		</div>
		<div class="bg-muted flex h-[41px] w-[176px] shrink-0 items-center rounded-[10px] p-1">
			<button
				type="button"
				class={[
					'h-full flex-1 rounded-lg text-sm transition-colors',
					mode === 'fixed'
						? 'bg-background text-primary font-semibold shadow-sm'
						: 'text-gray-500 font-medium'
				]}
				onclick={() => (mode = 'fixed')}
			>
				Fixed
			</button>
			<button
				type="button"
				class={[
					'h-full flex-1 rounded-lg text-sm transition-colors',
					mode === 'flexible'
						? 'bg-background text-primary font-semibold shadow-sm'
						: 'text-gray-500 font-medium'
				]}
				onclick={() => (mode = 'flexible')}
			>
				Flexible
			</button>
		</div>
	</header>
	<hr class="border-border mx-8" />
	<div class="px-8 py-7">
		{@render children()}
	</div>
</section>
