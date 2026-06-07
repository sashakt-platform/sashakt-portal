<script lang="ts">
	import FileText from '@lucide/svelte/icons/file-text';
	import LinkIcon from '@lucide/svelte/icons/link';
	import Settings from '@lucide/svelte/icons/settings';
	import Trash_2 from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import LogoField from '$lib/components/LogoField.svelte';
	import ShortcodeField from '$lib/components/ShortcodeField.svelte';
	import { type Infer, superForm, fileProxy } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import { editOrganizationSchema, type EditOrganizationSchema } from './schema';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();

	let orgData: Partial<Infer<EditOrganizationSchema>> | null = data?.currentOrganization
		? { ...data.currentOrganization, analytics_link: data.analyticsLinkUrl ?? '' }
		: null;
	let currentLogoUrl = $state<string | null>(data?.currentOrganization?.logo || null);
	let currentPlatformGuideUrl = $state<string | null>(data?.platformGuideUrl ?? null);
	let currentPlatformGuideName = $state<string | null>(data?.platformGuideFilename ?? null);

	$effect(() => {
		currentLogoUrl = data?.currentOrganization?.logo || null;
	});

	$effect(() => {
		currentPlatformGuideUrl = data?.platformGuideUrl ?? null;
		currentPlatformGuideName = data?.platformGuideFilename ?? null;
	});

	let logoInput: HTMLInputElement | undefined = $state();
	let pdfInput: HTMLInputElement;

	const form = superForm(orgData || data.form, {
		validators: zod4Client(editOrganizationSchema),
		dataType: 'form',
		onResult: ({ result }) => {
			if (logoInput) {
				logoInput.value = '';
				logoInput.dispatchEvent(new Event('change', { bubbles: true }));
			}
			if (pdfInput) {
				pdfInput.value = '';
				pdfInput.dispatchEvent(new Event('change', { bubbles: true }));
			}
			if (result.type === 'redirect') {
				invalidateAll();
			}
		}
	});

	const { form: formData, enhance, tainted, submitting } = form;
	const platformGuideFile = fileProxy(form, 'platform_guide');

	const selectedPdfName = $derived($platformGuideFile?.[0]?.name || null);
	const pdfDisplayName = $derived(selectedPdfName ?? currentPlatformGuideName);

	async function deleteLogo() {
		const res = await fetch('/api/organization/logo', {
			method: 'DELETE'
		});

		if (res.ok) {
			currentLogoUrl = null;
			await invalidateAll();
			toast.success('Logo deleted successfully');
		} else {
			toast.error('Failed to delete logo');
		}
	}

	async function deletePlatformGuide() {
		const res = await fetch('/api/organization/platform_guide', {
			method: 'DELETE'
		});

		if (res.ok) {
			currentPlatformGuideUrl = null;
			currentPlatformGuideName = null;
			await invalidateAll();
			toast.success('Platform guide removed');
		} else {
			toast.error('Failed to remove platform guide');
		}
	}

	const canSave = $derived(!!$tainted && !$submitting);
</script>

<form
	id="organization-form"
	method="POST"
	use:enhance
	action="?/save"
	enctype="multipart/form-data"
>
	<div
		class="bg-background border-border sticky top-0 z-10 flex h-23 items-center justify-between gap-[14px] border-b p-8"
	>
		<h1 class="font-sans text-[24px] leading-[140%] font-bold tracking-[0px]">
			{data.currentOrganization?.name ?? 'Organization Details'}
		</h1>
		<div class="flex gap-2">
			<a href={resolve('/tests/test-session')}>
				<Button variant="outline" class="border-primary text-primary border text-sm sm:text-base">
					Cancel
				</Button>
			</a>
			<Form.Button class="bg-primary text-sm sm:text-base" disabled={!canSave}>Save</Form.Button>
		</div>
	</div>

	<div class="flex justify-center px-4 py-8">
		<div class="w-full max-w-160">
			<div class="bg-card rounded-xl border shadow-sm">
				<div class="border-border flex h-23 items-center gap-3.5 border-b p-8">
					<div class="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-lg">
						<Settings class="text-primary h-5 w-5" />
					</div>
					<h3 class="text-base font-semibold">Organisation Details</h3>
				</div>

				<div class="flex flex-col gap-6 p-8">
					<Form.Field {form} name="name" class="flex flex-col gap-1.5">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="font-semibold">Name</Form.Label>
								<Input {...props} bind:value={$formData.name} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<ShortcodeField {form} />

					<LogoField {form} {currentLogoUrl} onDelete={deleteLogo} bind:fileInputRef={logoInput} />

					<Form.Field {form} name="platform_guide" class="flex flex-col gap-1.5">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="font-semibold">Platform guide PDF</Form.Label>
								<input
									{...props}
									type="file"
									accept="application/pdf"
									bind:files={$platformGuideFile}
									bind:this={pdfInput}
									hidden
								/>
								<div class="border-input bg-card flex h-9 items-center rounded-md border shadow-xs">
									<div class="flex min-w-0 flex-1 items-center gap-2 px-3">
										<FileText class="text-muted-foreground h-4 w-4 shrink-0" />
										<span
											class={[
												'truncate text-sm',
												pdfDisplayName ? 'text-foreground' : 'text-muted-foreground'
											]}
										>
											{pdfDisplayName ?? 'No file selected'}
										</span>
									</div>
									<button
										type="button"
										onclick={() => pdfInput.click()}
										class="text-primary hover:text-primary/80 px-3 text-sm font-medium"
									>
										Change
									</button>
									{#if currentPlatformGuideUrl && !selectedPdfName}
										<button
											type="button"
											onclick={deletePlatformGuide}
											class="text-muted-foreground hover:text-destructive pr-3"
											aria-label="Remove platform guide"
										>
											<Trash_2 class="h-4 w-4" />
										</button>
									{/if}
								</div>
								<p class="text-muted-foreground text-xs">PDF, max 10MB</p>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="analytics_link" class="flex flex-col gap-1.5">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="font-semibold">Analytics link</Form.Label>
								<div
									class="border-input ring-offset-background bg-card focus-within:border-ring focus-within:ring-ring/50 flex h-9 items-center rounded-md border shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]"
								>
									<LinkIcon class="text-muted-foreground ml-3 h-4 w-4 shrink-0" />
									<input
										{...props}
										type="url"
										placeholder="https://lookerstudio.google.com/..."
										class="text-foreground min-w-0 flex-1 bg-transparent px-3 py-1 text-sm outline-none"
										bind:value={$formData.analytics_link}
									/>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>
			</div>
		</div>
	</div>
</form>
