<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import X from '@lucide/svelte/icons/x';
	import * as Popover from '$lib/components/ui/popover';
	import * as Select from '$lib/components/ui/select';

	let {
		value = $bindable(),
		placeholder = 'Select time'
	}: {
		value: string | null | undefined;
		placeholder?: string;
	} = $props();

	const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
	const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
	const periods = ['AM', 'PM'] as const;

	function parse(v: string | null | undefined): { h: string; m: string; p: 'AM' | 'PM' } {
		if (!v) return { h: '09', m: '00', p: 'AM' };
		const [hRaw, mRaw] = v.split(':').map(Number);
		const p: 'AM' | 'PM' = hRaw >= 12 ? 'PM' : 'AM';
		let h12 = hRaw % 12;
		if (h12 === 0) h12 = 12;
		return {
			h: String(h12).padStart(2, '0'),
			m: String(mRaw || 0).padStart(2, '0'),
			p
		};
	}

	function format(h: string, m: string, p: 'AM' | 'PM'): string {
		let h24 = parseInt(h, 10);
		if (p === 'AM' && h24 === 12) h24 = 0;
		else if (p === 'PM' && h24 !== 12) h24 += 12;
		return `${String(h24).padStart(2, '0')}:${m}`;
	}

	const parsed = $derived(parse(value));
	const display = $derived(value ? `${parsed.h}:${parsed.m} ${parsed.p}` : placeholder);

	function update(next: Partial<{ h: string; m: string; p: 'AM' | 'PM' }>) {
		const merged = { ...parsed, ...next };
		value = format(merged.h, merged.m, merged.p);
	}

	function clear(event: MouseEvent) {
		event.stopPropagation();
		value = null;
	}
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button
				type="button"
				{...props}
				class="border-input hover:bg-accent/30 flex h-9 w-[176px] items-center justify-between rounded-full border bg-card px-5 text-sm shadow-xs transition-colors"
			>
				<span class={value ? 'text-foreground' : 'text-muted-foreground'}>{display}</span>
				{#if value}
					<span
						role="button"
						tabindex="0"
						aria-label="Clear time"
						class="text-muted-foreground hover:text-foreground -mr-1 flex h-4 w-4 items-center justify-center"
						onclick={clear}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								clear(e as unknown as MouseEvent);
							}
						}}
					>
						<X class="h-4 w-4" />
					</span>
				{:else}
					<ChevronDown class="text-muted-foreground h-4 w-4" />
				{/if}
			</button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto p-3">
		<div class="flex items-center gap-2">
			<Select.Root type="single" value={parsed.h} onValueChange={(v) => v && update({ h: v })}>
				<Select.Trigger class="w-[70px]">{parsed.h}</Select.Trigger>
				<Select.Content>
					{#each hours as h (h)}
						<Select.Item value={h}>{h}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<span class="text-muted-foreground">:</span>
			<Select.Root type="single" value={parsed.m} onValueChange={(v) => v && update({ m: v })}>
				<Select.Trigger class="w-[70px]">{parsed.m}</Select.Trigger>
				<Select.Content>
					{#each minutes as m (m)}
						<Select.Item value={m}>{m}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root
				type="single"
				value={parsed.p}
				onValueChange={(v) => v && update({ p: v as 'AM' | 'PM' })}
			>
				<Select.Trigger class="w-[70px]">{parsed.p}</Select.Trigger>
				<Select.Content>
					{#each periods as p (p)}
						<Select.Item value={p}>{p}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</Popover.Content>
</Popover.Root>
