<script lang="ts">
	import Upload from '@lucide/svelte/icons/upload';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { type Infer, superForm, fileProxy } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import type { Snippet } from 'svelte';
	import { editOrganizationSchema, type EditOrganizationSchema } from './schema';

	let {
		data,
		header
	}: {
		data: PageData;
		header: Snippet;
	} = $props();

	let orgData: Partial<Infer<EditOrganizationSchema>> | null = data?.currentOrganization || null;
	let currentLogoUrl: string | null = data?.currentOrganization?.logo || null;

	const form = superForm(orgData || data.form, {
		validators: zod4Client(editOrganizationSchema),
		dataType: 'form'
	});

	const { form: formData, enhance } = form;
	const logoFile = fileProxy(form, 'logo');

	let fileInput: HTMLInputElement;

	const selectedFileName = $derived($logoFile?.[0]?.name || null);
	const selectedFileSize = $derived(
		$logoFile?.[0] ? `${($logoFile[0].size / 1024).toFixed(1)} KB` : null
	);
</script>

<form method="POST" use:enhance action="?/save" enctype="multipart/form-data">
	<div class="mx-auto flex h-lvh flex-col gap-6 py-6 md:gap-10 md:py-8">
		{@render header()}
		<div class="mx-4 flex flex-col gap-6 bg-white p-4 sm:mx-6 sm:p-6 md:mx-10 md:gap-10 md:p-9">
			<Form.Field {form} name="name" class="flex w-full flex-col gap-2 md:pr-8">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="font-semibold">Name</Form.Label>
						<Input {...props} bind:value={$formData.name} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="shortcode" class="flex w-full flex-col gap-2 md:pr-8">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="font-semibold">Shortcode</Form.Label>
						<Input {...props} bind:value={$formData.shortcode} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="logo" class="flex w-full flex-col gap-2 md:pr-8">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="font-semibold">Logo</Form.Label>
						<input
							{...props}
							type="file"
							accept="image/*"
							bind:files={$logoFile}
							bind:this={fileInput}
							hidden
						/>
						<div class="flex flex-col gap-3">
							{#if currentLogoUrl && !selectedFileName}
								<div class="flex items-center gap-3">
									<img
										src={currentLogoUrl}
										alt="Current logo"
										class="h-16 w-16 rounded border object-contain"
									/>
									<span class="text-sm text-gray-500">Current logo</span>
								</div>
							{/if}
							<div
								class="border-primary/30 hover:border-primary flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors"
								onclick={() => fileInput.click()}
								onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
								role="button"
								tabindex="0"
							>
								{#if selectedFileName}
									<div class="flex flex-col items-center gap-2">
										<p class="text-sm font-medium">{selectedFileName}</p>
										<p class="text-xs text-gray-500">{selectedFileSize}</p>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onclick={(e) => {
												e.stopPropagation();
												$logoFile = null;
											}}
										>
											Remove
										</Button>
									</div>
								{:else}
									<Upload class="text-primary mb-2 h-8 w-8" />
									<p class="text-sm font-medium">Click to upload logo</p>
									<p class="text-xs text-gray-500">PNG, JPG, WebP, max 2MB</p>
								{/if}
							</div>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</div>
	<div
		class="sticky right-0 bottom-0 left-0 mt-2 flex w-full border-t-4 bg-white p-3 shadow-md sm:mt-4 sm:p-4"
	>
		<div class="flex w-full justify-between gap-2">
			<a href="/dashboard">
				<Button variant="outline" class="border-primary text-primary border-1 text-sm sm:text-base"
					>Cancel</Button
				>
			</a>
			<div class="flex gap-2">
				<Form.Button class="bg-primary text-sm sm:text-base">Save</Form.Button>
			</div>
		</div>
	</div>
</form>
