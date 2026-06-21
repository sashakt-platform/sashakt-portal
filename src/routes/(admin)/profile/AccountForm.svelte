<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import type { SuperForm, Infer } from 'sveltekit-superforms';
	import type { ProfileSchema } from './schema';
	import Settings from '@lucide/svelte/icons/settings';

	let { form }: { form: SuperForm<Infer<ProfileSchema>> } = $props();

	const { form: formData } = form;
</script>

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
					<Input
						id="role-field"
						class="disabled:bg-background"
						value={$formData.role_label ?? ''}
						disabled
					/>
				</div>
				{#if $formData.role_label === 'State Admin'}
					<div class="flex flex-col gap-1.5">
						<label for="state-field" class="text-sm font-medium">
							State
						</label>
						<Input
							id="state-field"
							class="disabled:bg-background"
							value={$formData.state_name ?? ''}
							disabled
						/>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
