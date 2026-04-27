<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Settings from '@lucide/svelte/icons/settings';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import {
		createCertificateSchema,
		editCertificateSchema,
		type CertificateFormSchema
	} from './schema.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { resolve } from '$app/paths';
	import { useTerms } from '$lib/nomenclature';

	const term = useTerms();

	const {
		data
	}: {
		data: {
			form: SuperValidated<Infer<CertificateFormSchema>>;
			action: 'add' | 'edit';
			certificate: Partial<Infer<CertificateFormSchema>> | null;
			currentUser: any;
		};
	} = $props();

	const certificateData: Partial<Infer<CertificateFormSchema>> | null = data?.certificate || null;

	const {
		form: formData,
		enhance,
		errors
	} = superForm(certificateData || data.form, {
		validators: zod4Client(
			data.action === 'edit' ? editCertificateSchema : createCertificateSchema
		),
		dataType: 'json',
		onSubmit: () => {
			if (data.currentUser?.organization_id) {
				$formData.organization_id = data.currentUser.organization_id;
			}
		}
	});

	const canSave = $derived(
		($formData.name?.trim() ?? '') !== '' && ($formData.url?.trim() ?? '') !== ''
	);
</script>

<form method="POST" action="?/save" use:enhance>
	<div class="mx-auto flex flex-col gap-10 py-8">
		<div class="mx-4 flex items-center justify-between py-4 sm:mx-6 md:mx-10">
			<div class="flex items-center gap-3">
				<a
					href={resolve('/certificate')}
					class="hover:bg-muted rounded-lg border p-2"
					aria-label={`Back to ${term('certificates', 'lower')}`}
				>
					<ArrowLeft size={20} />
				</a>
				<h2 class="text-2xl font-bold tracking-tight">
					{certificateData ? `Edit ${term('certificate')}` : `Create ${term('certificate')}`}
				</h2>
			</div>
			<Button type="submit" class="bg-primary font-semibold" disabled={!canSave}>Save</Button>
		</div>

		<div class="mx-4 flex flex-col sm:mx-6 md:mx-10">
			<div class="bg-card rounded-2xl border">
				<div class="border-border flex items-center gap-5 rounded-t-2xl border-b p-8">
					<span class="bg-brand-subtle shrink-0 rounded-lg p-2">
						<Settings class="text-primary h-4 w-4 sm:h-5 sm:w-5" />
					</span>
					<h3 class="text-base font-semibold sm:text-xl">{term('certificate')} Details</h3>
				</div>

				<div class="grid grid-cols-1 gap-6 p-8 md:grid-cols-2">
					<div class="flex flex-col gap-2">
						<Label for="name">{term('certificate')} Name</Label>
						<Input
							id="name"
							type="text"
							name="name"
							placeholder={`Name of this ${term('certificate', 'lower')}...`}
							bind:value={$formData.name}
						/>
						{#if $errors.name}
							<span class="text-destructive text-sm">{$errors.name}</span>
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<Label for="description">Description</Label>
						<Textarea
							id="description"
							name="description"
							placeholder={`Brief description of this ${term('certificate', 'lower')}...`}
							bind:value={$formData.description}
						/>
					</div>

					<div class="flex flex-col gap-2">
						<Label for="url">{term('certificate')} URL</Label>
						<Input
							id="url"
							type="text"
							name="url"
							bind:value={$formData.url}
							placeholder="e.g. https://www.example.com"
						/>
						{#if $errors.url}
							<span class="text-destructive text-sm">{$errors.url}</span>
						{/if}
					</div>

					<div class="flex items-center justify-between">
						<Label for="is_active" class="font-semibold">{term('certificate')} Status</Label>
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
				</div>
			</div>
		</div>
	</div>
</form>
