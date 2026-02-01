<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
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
		submit,
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
</script>

<form method="POST" action="?/save" use:enhance>
	<div class="mx-auto flex h-lvh flex-col gap-6 py-6 md:gap-10 md:py-8">
		<div class="mx-4 flex flex-row sm:mx-6 md:mx-10">
			<div class="my-auto flex flex-col">
				<div class="flex w-full items-center align-middle">
					<div class="flex flex-row">
						<h2
							class="mr-2 w-fit scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 sm:text-3xl"
						>
							{certificateData ? 'Edit Certificate' : 'Create Certificate'}
						</h2>
						<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
					</div>
				</div>
				<Label class="my-auto align-middle text-sm font-extralight"></Label>
			</div>
		</div>
		<div class="mx-4 flex flex-col gap-6 bg-white p-4 sm:mx-6 sm:p-6 md:mx-10 md:gap-10 md:p-9">
			<div class="flex w-full flex-col gap-2 md:pr-8">
				<h2 class="font-semibold">Name</h2>
				<Input type="text" name="name" bind:value={$formData.name} />
				{#if $errors.name}
					<span class="text-destructive text-sm">{$errors.name}</span>
				{/if}
			</div>
			<div class="flex w-full flex-col gap-2 md:pr-8">
				<h2 class="font-semibold">Description</h2>
				<Textarea name="description" bind:value={$formData.description} />
			</div>
			<div class="flex w-full flex-col gap-2 md:pr-8">
				<h2 class="font-semibold">URL</h2>
				<Input
					type="text"
					name="url"
					bind:value={$formData.url}
					placeholder="Enter certificate URL (e.g., https://example.com)"
				/>
				{#if $errors.url}
					<span class="text-destructive text-sm">{$errors.url}</span>
				{/if}
			</div>
			<div class="flex w-full items-center gap-2 md:pr-8">
				<Switch id="is_active" name="is_active" bind:checked={$formData.is_active} />
				<Label for="is_active">Is Active?</Label>
				<Info class="w-4 text-xs text-gray-600" />
			</div>
		</div>
	</div>
	<div
		class="sticky right-0 bottom-0 left-0 mt-2 flex w-full border-t-4 bg-white p-3 shadow-md sm:mt-4 sm:p-4"
	>
		<div class="flex w-full justify-between gap-2">
			<a href="/certificate/">
				<Button variant="outline" class="border-primary text-primary border-1 text-sm sm:text-base"
					>Cancel</Button
				>
			</a>
			<div class="flex gap-2">
				<Button
					class="bg-primary text-sm sm:text-base"
					onclick={submit}
					disabled={$formData.name?.trim() === '' || $formData.url?.trim() === ''}>Save</Button
				>
			</div>
		</div>
	</div>
</form>
