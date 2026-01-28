<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import TooltipInfo from '$lib/components/TooltipInfo.svelte';
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
		submit
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

<form method="POST" action="?/save" use:enhance class="flex min-h-screen flex-col">
	<div class="flex-1 overflow-auto">
		<div class="mx-auto flex flex-col gap-10 py-8">
			{#snippet snippetHeading(title: string)}
				<div class="bg-primary-foreground flex flex-row gap-3 rounded-sm px-4 py-3 align-middle">
					<Label class="text-md my-auto font-bold">{title}</Label>
					<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
				</div>
			{/snippet}

			<div class="mx-4 flex flex-col gap-4 sm:mx-6 md:mx-10 md:flex-row">
				<div class="my-auto flex flex-col">
					<div class="flex w-full items-center align-middle">
						<div class="flex flex-row">
							<h2
								class="mr-2 w-fit scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 sm:text-3xl"
							>
								{certificateData ? 'Edit Certificate' : 'Create Certificate'}
							</h2>

							<TooltipInfo
								label="Help: Certificate Form"
								description="Here you can add a new certificate by providing its name, description, URL, and activation status. Make sure all required fields are filled before saving."
							/>
						</div>
					</div>

					<Label class="my-auto align-middle text-sm font-extralight">
						{certificateData
							? 'Edit existing certificate details'
							: 'Add a new certificate with all required information'}
					</Label>
				</div>
			</div>

			<div class="mx-4 flex flex-col gap-6 bg-white p-4 sm:mx-6 sm:p-6 md:mx-10 md:gap-8 md:p-9">
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-2">
						{@render snippetHeading('Certificate Details')}

						<div class="flex flex-col gap-2">
							<Label>Name</Label>
							<Input
								type="text"
								name="name"
								bind:value={$formData.name}
								placeholder="Enter certificate name"
							/>
						</div>

						<div class="flex flex-col gap-2">
							<Label>Description</Label>
							<Textarea
								name="description"
								bind:value={$formData.description}
								placeholder="Enter description"
							/>
						</div>

						<div class="flex flex-col gap-2">
							<Label>URL</Label>
							<Input
								type="text"
								name="url"
								bind:value={$formData.url}
								placeholder="Enter certificate URL"
							/>
						</div>

						<div class="mt-4 flex items-center gap-2">
							<Switch id="is_active" name="is_active" bind:checked={$formData.is_active} />
							<Label for="is_active">Is Active?</Label>
							<Info class="w-4 text-xs text-gray-600" />
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="sticky bottom-0 my-2 flex w-full border-t-4 bg-white p-3 sm:my-4 sm:p-4">
		<div class="flex w-full justify-between gap-2">
			<a href="/certificate/">
				<Button variant="outline" class="text-primary border-primary border-1 text-sm sm:text-base">
					Cancel
				</Button>
			</a>

			<Button
				class="bg-primary text-sm sm:text-base"
				disabled={$formData.name?.trim() === '' || $formData.url?.trim() === ''}
				onclick={submit}
			>
				Save
			</Button>
		</div>
	</div>
</form>
