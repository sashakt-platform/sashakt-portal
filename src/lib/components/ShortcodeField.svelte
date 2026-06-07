<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import Copy from '@lucide/svelte/icons/copy';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';

	type Props = {
		// `any` because callers use different schemas; formsnap validates internally.
		form: any;
	};

	let { form }: Props = $props();

	const { form: formData } = form;

	const portalUrl = $derived(`${page.url.origin}/${$formData.shortcode || ''}`);

	function copyPortalUrl() {
		navigator.clipboard.writeText(portalUrl).then(
			() => toast.success('Portal URL copied!'),
			() => toast.error('Failed to copy URL. Please copy it manually.')
		);
	}
</script>

<Form.Field {form} name="shortcode" class="flex flex-col gap-1.5">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label class="font-semibold">Shortcode</Form.Label>
			<div
				class="border-input ring-offset-background bg-card focus-within:border-ring focus-within:ring-ring/50 flex h-9 items-center rounded-md border shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]"
			>
				<span class="text-muted-foreground pl-3 text-sm whitespace-nowrap">
					{page.url.host}/
				</span>
				<input
					{...props}
					class="text-foreground min-w-0 flex-1 bg-transparent py-1 pr-3 text-sm outline-none"
					bind:value={$formData.shortcode}
				/>
				<button
					type="button"
					onclick={copyPortalUrl}
					disabled={!$formData.shortcode?.trim()}
					class="text-primary hover:text-primary/80 flex items-center gap-1 px-3 text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:hover:no-underline"
				>
					<Copy class="h-3.5 w-3.5" />
					Copy Portal URL
				</button>
			</div>
		{/snippet}
	</Form.Control>
	<Form.FieldErrors />
</Form.Field>
