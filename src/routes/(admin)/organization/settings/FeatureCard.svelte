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

<section class="border-border rounded-xl border bg-white">
	<header class="flex items-start justify-between gap-4 p-5">
		<div class="min-w-0">
			<h3 class="text-foreground text-base font-semibold">{title}</h3>
			<p class="text-muted-foreground mt-1 text-sm">{description}</p>
		</div>
		<div class="bg-muted flex shrink-0 rounded-xl p-1">
			<button
				type="button"
				class={[
					'rounded-xl px-4 py-1.5 text-sm transition-colors',
					mode === 'fixed'
						? 'bg-background text-primary font-semibold shadow'
						: 'text-muted-foreground'
				]}
				onclick={() => (mode = 'fixed')}
			>
				Fixed
			</button>
			<button
				type="button"
				class={[
					'rounded-xl px-4 py-1.5 text-sm transition-colors',
					mode === 'flexible'
						? 'bg-background text-primary font-semibold shadow'
						: 'text-muted-foreground'
				]}
				onclick={() => (mode = 'flexible')}
			>
				Flexible
			</button>
		</div>
	</header>
	<hr class="border-border" />
	<div class="p-5">
		{@render children()}
	</div>
</section>
