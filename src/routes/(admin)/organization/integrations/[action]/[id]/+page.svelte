<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Plug from '@lucide/svelte/icons/plug';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { addProviderSchema, type AddProviderSchema } from './schema.js';
	import { resolve } from '$app/paths';

	type ProviderOption = { id: number; name: string; provider_type: string };

	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<AddProviderSchema>>;
			action: 'add' | 'edit';
			providers: ProviderOption[];
		};
	} = $props();

	const form = superForm(data.form, {
		validators: zod4Client(addProviderSchema),
		dataType: 'json'
	});

	const { form: formData, enhance } = form;

	const canSave = $derived(!!$formData.provider_id);
</script>

<form method="POST" action="?/save" use:enhance>
	<div>
		<div class="bg-card">
			<div class="mx-4 flex items-center justify-between py-4 sm:mx-10">
				<div class="m-4 flex items-center gap-3">
					<a
						href={resolve('/organization/integrations')}
						class="hover:bg-muted rounded-lg border border-border p-2"
						aria-label="Back to Integrations"
					>
						<ArrowLeft size={20} />
					</a>
					<h2 class="text-2xl font-bold tracking-tight">Add Provider</h2>
				</div>
				<Button type="submit" class="bg-primary font-semibold" disabled={!canSave}>Save</Button>
			</div>
		</div>
		<hr class="border-border" />

		<div class="bg-background">
			<div class="mx-4 mt-6 flex flex-col gap-8 sm:mx-8 sm:mt-10">
				<div class="bg-card rounded-2xl border border-border">
					<div class="border-border flex items-center gap-5 rounded-t-2xl border-b p-8">
						<span class="bg-brand-subtle shrink-0 rounded-lg p-2">
							<Plug class="text-primary h-4 w-4 sm:h-5 sm:w-5" />
						</span>
						<h3 class="text-base font-semibold sm:text-xl">Provider Details</h3>
					</div>

					<div class="grid grid-cols-1 gap-6 p-8 md:grid-cols-2">
						<Form.Field {form} name="provider_id">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label class="font-semibold">Provider</Form.Label>
									<Select.Root
										type="single"
										value={$formData.provider_id ? String($formData.provider_id) : ''}
										onValueChange={(value) => ($formData.provider_id = Number(value))}
										name={props.name}
									>
										<Select.Trigger {...props} class="h-10 w-full gap-2 rounded-full px-4">
											{#if $formData.provider_id}
												{data.providers.find((provider) => provider.id === $formData.provider_id)
													?.name || 'Select provider'}
											{:else}
												Select provider
											{/if}
										</Select.Trigger>
										<Select.Content>
											{#each data.providers as provider (provider.id)}
												<Select.Item value={String(provider.id)} label={provider.name} />
											{/each}
										</Select.Content>
									</Select.Root>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<div class="flex items-center justify-between">
							<Label for="is_enabled" class="font-semibold">Status</Label>
							<div class="flex items-center gap-2">
								<span
									class="text-sm {$formData.is_enabled
										? 'text-primary font-semibold'
										: 'text-muted-foreground'}"
								>
									{$formData.is_enabled ? 'Enabled' : 'Disabled'}
								</span>
								<Switch id="is_enabled" name="is_enabled" bind:checked={$formData.is_enabled} />
							</div>
						</div>

						<div class="flex flex-col gap-2 md:col-span-2">
							<Form.Field {form} name="config_json">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label class="font-semibold">Configuration (JSON)</Form.Label>
										<Textarea
											{...props}
											rows={10}
											class="font-mono text-xs"
											placeholder={`{\n  "type": "service_account",\n  "project_id": "your-project-id",\n  "private_key": "...",\n  "client_email": "..."\n}`}
											bind:value={$formData.config_json}
										/>
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</form>
