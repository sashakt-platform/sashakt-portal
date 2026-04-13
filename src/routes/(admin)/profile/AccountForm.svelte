<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { type Infer, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import { editUserSchema, type EditUserSchema } from './schema';
	import { resolve } from '$app/paths';
	import Settings from '@lucide/svelte/icons/settings';

	let { data }: { data: PageData } = $props();
	let userData: Partial<Infer<EditUserSchema>> | null = data?.currentUser || null;

	const form = superForm(userData || data.form, {
		validators: zod4Client(editUserSchema),
		dataType: 'json'
	});

	const { form: formData, enhance } = form;

	const roleName = $derived(data.currentUser?.role_label ?? '');
	const orgName = $derived(data.currentUser?.organization_name ?? '');
</script>

<form id="profile-form" method="POST" use:enhance action="?/save">
	<div class="flex justify-center px-4 py-8">
		<div class="w-full max-w-160">
			<div class="bg-card rounded-xl border shadow-sm">
				<div class="flex h-23 items-center gap-3.5 border-b border-[#E4E4E4] p-8">
					<Settings class="text-primary h-5 w-5" />
					<h3 class="text-base font-semibold">My Profile</h3>
				</div>

				<div class="flex flex-col gap-6 p-8">
					<Form.Field {form} name="full_name" class="flex flex-col gap-1.5">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Name</Form.Label>
								<Input {...props} bind:value={$formData.full_name} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="email" class="flex flex-col gap-1.5">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Email</Form.Label>
								<Input {...props} type="email" bind:value={$formData.email} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="phone" class="flex flex-col gap-1.5">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Phone number</Form.Label>
								<Input {...props} type="tel" bind:value={$formData.phone} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<div class="flex flex-col gap-1.5">
						<label for="role-field" class="text-sm font-medium">
							Role
							<span class="text-muted-foreground font-normal">
								(Managed by your organisation admin)
							</span>
						</label>
						<Input id="role-field" value={roleName} disabled />
					</div>

					<div class="flex flex-col gap-1.5">
						<label for="organisation-field" class="text-sm font-medium">
							Organisation
							<span class="text-muted-foreground font-normal">
								(Managed by your organisation admin)
							</span>
						</label>
						<Input id="organisation-field" value={orgName} disabled />
					</div>
				</div>
			</div>

			<div class="mt-4 flex justify-between gap-2">
				<a href={resolve('/dashboard')}>
					<Button variant="outline" class="border-primary text-primary">Cancel</Button>
				</a>
				<Form.Button class="bg-primary">Save</Form.Button>
			</div>
		</div>
	</div>
</form>
