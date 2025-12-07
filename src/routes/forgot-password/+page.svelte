<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { forgotPasswordSchema } from './schema';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const form = superForm(data.form, {
		validators: zod4Client(forgotPasswordSchema)
	});
	const { form: formData, enhance, message } = form;

	let emailSent = $derived(!!$message);
</script>

<div class="flex h-screen items-center justify-center bg-[rgba(240,249,255,1)]">
	<div class="w-full max-w-md px-4">
		<div class="mb-4 text-center">
			<h1 class="text-primary w-full pb-4 text-3xl font-extrabold tracking-tighter">SASHAKT</h1>
		</div>

		<Card.Root class="w-full shadow-xl">
			{#if !emailSent}
				<Card.Header class="space-y-3 pb-6 text-center">
					<Card.Title class="text-3xl font-bold text-gray-800">Forgot Password</Card.Title>
					<Card.Description>Please enter your registed email.</Card.Description>
				</Card.Header>
			{/if}
			<Card.Content class="px-8 pb-8">
				{#if emailSent}
					<div class="space-y-4 text-center">
						<div
							class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
						>
							<svg
								class="h-8 w-8 text-green-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								></path>
							</svg>
						</div>
						<div class="space-y-2">
							<p class="pt-2 text-sm text-gray-600">Please check your email inbox.</p>
						</div>

						<Button variant="default" class="mt-4 w-full py-5" href="/login">Back to Login</Button>
					</div>
				{:else}
					<form method="POST" use:enhance class="space-y-4">
						<Form.Field {form} name="email">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Email</Form.Label>
									<Input {...props} bind:value={$formData.email} type="email" />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Button class="mt-4 w-full py-5">Continue</Form.Button>
					</form>
					<div class="mt-4 text-right">
						<a
							href="/login"
							class="text-sm text-gray-500 hover:text-blue-600 hover:underline focus:outline-none"
						>
							Back to Login
						</a>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
