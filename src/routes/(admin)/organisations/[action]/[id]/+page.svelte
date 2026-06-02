<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Settings from '@lucide/svelte/icons/settings';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Copy from '@lucide/svelte/icons/copy';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { superForm, fileProxy } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { organisationSchema } from './schema.js';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	const form = superForm(data.form, {
		validators: zod4Client(organisationSchema),
		dataType: 'form'
	});

	const { form: formData, enhance, errors, submitting } = form;
	const logoFile = fileProxy(form, 'logo');

	const isEdit = $derived(data.action === 'edit');
	const pageTitle = $derived(isEdit ? 'Edit Organisation' : 'Add Organisation');
	const currentLogoUrl = $derived(
		(data as { currentLogoUrl?: string | null }).currentLogoUrl ?? null
	);
	const portalUrl = $derived(`${page.url.origin}/${$formData.shortcode || 'shortcode'}`);

	function copyPortalUrl() {
		navigator.clipboard.writeText(portalUrl).then(
			() => toast.success('Portal URL copied!'),
			() => toast.error('Failed to copy URL. Please copy it manually.')
		);
	}

	let fileInput: HTMLInputElement;

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

	const canSave = $derived(
		($formData.name?.trim() ?? '') !== '' && ($formData.shortcode?.trim() ?? '') !== ''
	);
</script>

<form method="POST" action="?/save" enctype="multipart/form-data" use:enhance>
	<div class="bg-muted/40 min-h-screen">
		<header
			class="bg-background border-border sticky top-0 z-10 flex h-23 items-center justify-between gap-3.5 border-b p-8"
		>
			<div class="flex items-center gap-3">
				<a
					href={resolve('/organisations')}
					class="hover:bg-muted rounded-lg border p-2"
					aria-label="Back to organisations"
				>
					<ArrowLeft size={20} />
				</a>
				<h1 class="font-sans text-[24px] leading-[140%] font-bold tracking-[0px]">
					{pageTitle}
				</h1>
			</div>
			<div class="flex gap-2">
				<a href={resolve('/organisations')}>
					<Button
						type="button"
						variant="outline"
						class="border-primary text-primary border text-sm sm:text-base"
					>
						Cancel
					</Button>
				</a>
				<Button
					type="submit"
					class="bg-primary text-sm sm:text-base"
					disabled={!canSave || $submitting}
				>
					Save
				</Button>
			</div>
		</header>

		<div class="mx-auto flex max-w-[720px] flex-col px-4 py-8 sm:px-6 md:px-10">
			<div class="bg-card rounded-2xl border">
				<div class="border-border flex items-center gap-5 rounded-t-2xl border-b p-8">
					<span class="bg-primary/10 shrink-0 rounded-lg p-2">
						<Settings class="text-primary h-4 w-4 sm:h-5 sm:w-5" />
					</span>
					<h3 class="text-base font-semibold sm:text-xl">Organisation Details</h3>
				</div>

				<div class="flex flex-col gap-6 p-8">
					<div class="flex flex-col gap-2">
						<Label for="name">Name</Label>
						<Input
							id="name"
							type="text"
							name="name"
							placeholder="Enter organisation name..."
							bind:value={$formData.name}
						/>
						{#if $errors.name}
							<span class="text-destructive text-sm">{$errors.name}</span>
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<Label for="shortcode">Shortcode</Label>
						<div class="relative flex items-center">
							<Input
								id="shortcode"
								type="text"
								name="shortcode"
								bind:value={$formData.shortcode}
								class="pr-36"
							/>
							<button
								type="button"
								onclick={copyPortalUrl}
								class="text-primary absolute right-3 flex items-center gap-1 text-sm font-medium hover:underline"
							>
								<Copy size={13} />
								Copy Portal URL
							</button>
						</div>
						{#if $formData.shortcode}
							<span class="text-muted-foreground text-xs">{portalUrl}</span>
						{/if}
						{#if $errors.shortcode}
							<span class="text-destructive text-sm">{$errors.shortcode}</span>
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<Label for="description">Description</Label>
						<Textarea
							id="description"
							name="description"
							placeholder="Brief description of this organisation..."
							bind:value={$formData.description}
						/>
					</div>

					<div class="flex items-center justify-between">
						<Label for="is_active">Status</Label>
						<div class="flex items-center gap-2">
							<span
								class="text-sm {$formData.is_active
									? 'text-primary font-semibold'
									: 'text-muted-foreground'}"
							>
								{$formData.is_active ? 'Active' : 'Inactive'}
							</span>
							<Switch id="is_active" name="is_active" bind:checked={$formData.is_active} />
						</div>
					</div>

					<div class="flex flex-col gap-2">
						<Label>Logo</Label>
						<input
							type="file"
							name="logo"
							accept="image/png,image/jpeg,image/webp"
							bind:files={$logoFile}
							bind:this={fileInput}
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
							<div
								class="border-input bg-card flex h-9 flex-1 items-center rounded-md border shadow-xs"
							>
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
									onclick={() => fileInput.click()}
									class="text-primary hover:text-primary/80 px-3 text-sm font-medium"
								>
									Browse
								</button>
							</div>
						</div>
						{#if $errors.logo}
							<span class="text-destructive text-sm">{$errors.logo}</span>
						{/if}
						<p class="text-muted-foreground text-xs">PNG, JPG, WebP, max 2MB</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</form>
