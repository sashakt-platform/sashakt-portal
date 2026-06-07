<script lang="ts">
	import { fileProxy } from 'sveltekit-superforms';
	import * as Form from '$lib/components/ui/form/index.js';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Trash_2 from '@lucide/svelte/icons/trash-2';
	import { browser } from '$app/environment';

	type Props = {
		// `any` because callers use different schemas; formsnap validates internally.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		form: any;
		currentLogoUrl?: string | null;
		onDelete?: () => void | Promise<void>;
		fileInputRef?: HTMLInputElement;
	};

	let { form, currentLogoUrl = null, onDelete, fileInputRef = $bindable() }: Props = $props();

	const logoFile = fileProxy(form, 'logo' as never);

	const selectedFileName = $derived($logoFile?.[0]?.name ?? null);
	const logoDisplayName = $derived(
		selectedFileName ?? (currentLogoUrl ? currentLogoUrl.split('/').pop() : null)
	);

	let previewUrl = $state<string | null>(null);
	$effect(() => {
		const file = $logoFile?.[0];
		if (!browser || !file) {
			previewUrl = null;
			return;
		}
		const url = URL.createObjectURL(file);
		previewUrl = url;
		return () => URL.revokeObjectURL(url);
	});
</script>

<Form.Field {form} name="logo" class="flex flex-col gap-1.5">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label class="font-semibold">Logo</Form.Label>
			<input
				{...props}
				type="file"
				accept="image/png,image/jpeg,image/webp"
				bind:files={$logoFile}
				bind:this={fileInputRef}
				hidden
			/>
			<div class="flex items-center gap-3">
				{#if previewUrl}
					<img
						src={previewUrl}
						alt="Logo preview"
						class="border-border bg-muted h-10 w-10 shrink-0 rounded-md border object-contain"
					/>
				{:else if currentLogoUrl}
					<img
						src={currentLogoUrl}
						alt="Current logo"
						class="border-border bg-muted h-10 w-10 shrink-0 rounded-md border object-contain"
					/>
				{:else}
					<div
						class="border-border bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-md border"
					>
						<ImageIcon class="text-muted-foreground h-4 w-4" />
					</div>
				{/if}

				<div class="border-input bg-card flex h-9 flex-1 items-center rounded-md border shadow-xs">
					<div class="flex min-w-0 flex-1 items-center gap-2 px-3">
						<ImageIcon class="text-muted-foreground h-4 w-4 shrink-0" />
						<span
							class={[
								'truncate text-sm',
								logoDisplayName ? 'text-foreground' : 'text-muted-foreground'
							]}
						>
							{logoDisplayName ?? 'No file selected'}
						</span>
					</div>
					<button
						type="button"
						onclick={() => fileInputRef?.click()}
						class="text-primary hover:text-primary/80 px-3 text-sm font-medium"
					>
						{currentLogoUrl ? 'Change' : 'Browse'}
					</button>
					{#if onDelete && currentLogoUrl && !selectedFileName}
						<button
							type="button"
							onclick={() => void onDelete()}
							class="text-muted-foreground hover:text-destructive pr-3"
							aria-label="Delete logo"
						>
							<Trash_2 class="h-4 w-4" />
						</button>
					{/if}
				</div>
			</div>
			<p class="text-muted-foreground text-xs">PNG, JPG, WebP, max 2MB</p>
		{/snippet}
	</Form.Control>
	<Form.FieldErrors />
</Form.Field>
