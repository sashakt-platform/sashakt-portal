<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Settings from '@lucide/svelte/icons/settings';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import LogoField from '$lib/components/LogoField.svelte';
	import ShortcodeField from '$lib/components/ShortcodeField.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { organisationSchema } from './schema.js';
	import { resolve } from '$app/paths';

	let { data } = $props();

	const form = superForm(data.form, {
		validators: zod4Client(organisationSchema),
		dataType: 'form'
	});

	const { form: formData, enhance, submitting } = form;

	const isEdit = $derived(data.action === 'edit');
	const pageTitle = $derived(isEdit ? 'Edit Organisation' : 'Add Organisation');
	const currentLogoUrl = $derived(
		(data as { currentLogoUrl?: string | null }).currentLogoUrl ?? null
	);

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
					<Form.Field {form} name="name" class="flex flex-col gap-1.5">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="font-semibold">Name</Form.Label>
								<Input
									{...props}
									type="text"
									placeholder="Enter organisation name..."
									bind:value={$formData.name}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<ShortcodeField {form} />

					<Form.Field {form} name="description" class="flex flex-col gap-1.5">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="font-semibold">Description</Form.Label>
								<Textarea
									{...props}
									placeholder="Brief description of this organisation..."
									bind:value={$formData.description}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="is_active" class="flex items-center justify-between">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="font-semibold">Status</Form.Label>
								<div class="flex items-center gap-2">
									<span
										class="text-sm {$formData.is_active
											? 'text-primary font-semibold'
											: 'text-muted-foreground'}"
									>
										{$formData.is_active ? 'Active' : 'Inactive'}
									</span>
									<Switch {...props} bind:checked={$formData.is_active} />
								</div>
							{/snippet}
						</Form.Control>
					</Form.Field>

					<LogoField {form} {currentLogoUrl} />
				</div>
			</div>
		</div>
	</div>
</form>
