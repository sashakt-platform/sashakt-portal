<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Settings from '@lucide/svelte/icons/settings';
	import Trash_2 from '@lucide/svelte/icons/trash-2';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { type Infer, superForm, fileProxy } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { editOrganizationSchema, type EditOrganizationSchema } from './schema';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();

	let orgData: Partial<Infer<EditOrganizationSchema>> | null = data?.currentOrganization || null;
	let currentLogoUrl = $state<string | null>(data?.currentOrganization?.logo || null);

	$effect(() => {
		currentLogoUrl = data?.currentOrganization?.logo || null;
	});

	const form = superForm(orgData || data.form, {
		validators: zod4Client(editOrganizationSchema),
		dataType: 'form',
		onResult: ({ result }) => {
			if (fileInput) {
				fileInput.value = '';
				fileInput.dispatchEvent(new Event('change', { bubbles: true }));
			}
			if (result.type === 'redirect') {
				invalidateAll();
			}
		}
	});

	const { form: formData, enhance, tainted, submitting } = form;
	const logoFile = fileProxy(form, 'logo');

	let fileInput: HTMLInputElement;

	const selectedFileName = $derived($logoFile?.[0]?.name || null);
	const previewUrl = $derived(browser && $logoFile?.[0] ? URL.createObjectURL($logoFile[0]) : null);
	const logoDisplayName = $derived(
		selectedFileName ?? (currentLogoUrl ? currentLogoUrl.split('/').pop() : null)
	);

	let copied = $state(false);

	function copyPortalUrl() {
		const fullUrl = `${$page.url.origin}/${$formData.shortcode ?? ''}`;
		navigator.clipboard.writeText(fullUrl);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}

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
				<div class="flex h-23 items-center gap-3.5 border-b border-[#E4E4E4] p-8">
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

					<Form.Field {form} name="shortcode" class="flex flex-col gap-1.5">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="font-semibold">Shortcode</Form.Label>
								<div
									class="border-input ring-offset-background focus-within:border-ring focus-within:ring-ring/50 flex h-9 items-center rounded-md border bg-white shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]"
								>
									<span class="text-muted-foreground pl-3 text-sm whitespace-nowrap">
										{$page.url.host}/
									</span>
									<input
										{...props}
										class="text-foreground min-w-0 flex-1 bg-transparent py-1 pr-3 text-sm outline-none"
										bind:value={$formData.shortcode}
									/>
									<button
										type="button"
										onclick={copyPortalUrl}
										class="text-primary hover:text-primary/80 flex items-center gap-1 px-3 text-sm font-medium whitespace-nowrap"
									>
										{#if copied}
											<Check class="h-4 w-4" /> Copied
										{:else}
											Copy Portal URL
										{/if}
									</button>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="logo" class="flex flex-col gap-1.5">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="font-semibold">Logo</Form.Label>
								<input
									{...props}
									type="file"
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
										class="border-input flex h-9 flex-1 items-center rounded-md border bg-white shadow-xs"
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
											Change
										</button>
										{#if currentLogoUrl && !selectedFileName}
											<button
												type="button"
												onclick={deleteLogo}
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
				</div>
			</div>
		</div>
	</div>
</form>
