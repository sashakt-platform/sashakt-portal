<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import { passwordSchema } from './schema';
	import Settings from '@lucide/svelte/icons/settings';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import { Button } from '$lib/components/ui/button';

	let { data }: { data: PageData } = $props();

	const form = superForm(data.passwordForm, {
		validators: zod4Client(passwordSchema)
	});

	const { form: formData, enhance } = form;

	let showCurrent = $state(false);
	let showNew = $state(false);
	let showConfirm = $state(false);
</script>

<form id="password-form" method="POST" use:enhance action="?/Passwordsave">
	<div class="flex justify-center px-4 pb-8">
		<div class="w-full max-w-160">
			<div class="bg-card rounded-xl border shadow-sm">
				<div class="flex h-23 items-center gap-3.5 border-b border-[#E4E4E4] p-8">
					<Settings class="text-primary h-5 w-5" />
					<h3 class="text-base font-semibold">My Password</h3>
				</div>

				<div class="flex flex-col gap-6 p-8">
					<Form.Field {form} name="current_password" class="flex flex-col gap-1.5">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Current password</Form.Label>
								<div class="relative">
									<Input
										{...props}
										type={showCurrent ? 'text' : 'password'}
										bind:value={$formData.current_password}
										class="pr-10"
									/>
									<button
										type="button"
										onclick={() => (showCurrent = !showCurrent)}
										class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
									>
										{#if showCurrent}
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

					<Form.Field {form} name="new_password" class="flex flex-col gap-1.5">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>New password</Form.Label>
								<div class="relative">
									<Input
										{...props}
										type={showNew ? 'text' : 'password'}
										bind:value={$formData.new_password}
										class="pr-10"
									/>
									<button
										type="button"
										onclick={() => (showNew = !showNew)}
										class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
									>
										{#if showNew}
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

					<Form.Field {form} name="confirm_password" class="flex flex-col gap-1.5">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Re-enter password</Form.Label>
								<div class="relative">
									<Input
										{...props}
										type={showConfirm ? 'text' : 'password'}
										bind:value={$formData.confirm_password}
										class="pr-10"
									/>
									<button
										type="button"
										onclick={() => (showConfirm = !showConfirm)}
										class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
									>
										{#if showConfirm}
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
				</div>

				<div class="flex justify-end px-8 pb-8">
					<Button type="submit" class="bg-primary text-sm sm:text-base">Update Password</Button>
				</div>
			</div>
		</div>
	</div>
</form>
