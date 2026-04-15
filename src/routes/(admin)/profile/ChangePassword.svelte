<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import type { SuperForm, Infer } from 'sveltekit-superforms';
	import type { ProfileSchema } from './schema';
	import Settings from '@lucide/svelte/icons/settings';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';

	let { form }: { form: SuperForm<Infer<ProfileSchema>> } = $props();

	const { form: formData } = form;

	let showCurrent = $state(false);
	let showNew = $state(false);
	let showConfirm = $state(false);
</script>

{#snippet passwordInput(name: string, label: string, show: boolean, toggleShow: () => void)}
	<Form.Field {form} {name} class="flex flex-col gap-1.5">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>{label}</Form.Label>
				<div class="relative">
					<Input
						{...props}
						type={show ? 'text' : 'password'}
						bind:value={$formData[name]}
						class="pr-10"
					/>
					<button
						type="button"
						onclick={toggleShow}
						class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
					>
						{#if show}
							<EyeOff class="h-4 w-4" />
						{:else}
							<Eye class="h-4 w-4" />
						{/if}
					</button>
				</div>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}

<div class="flex justify-center px-4 pb-8">
	<div class="w-full max-w-160">
		<div class="bg-card rounded-xl border shadow-sm">
			<div class="flex h-23 items-center gap-3.5 border-b border-[#E4E4E4] p-8">
				<Settings class="text-primary h-5 w-5" />
				<h3 class="text-base font-semibold">My Password</h3>
			</div>

			<div class="flex flex-col gap-6 p-8">
				{@render passwordInput(
					'current_password',
					'Current password',
					showCurrent,
					() => (showCurrent = !showCurrent)
				)}
				{@render passwordInput('new_password', 'New password', showNew, () => (showNew = !showNew))}
				{@render passwordInput(
					'confirm_password',
					'Re-enter password',
					showConfirm,
					() => (showConfirm = !showConfirm)
				)}
			</div>
		</div>
	</div>
</div>
