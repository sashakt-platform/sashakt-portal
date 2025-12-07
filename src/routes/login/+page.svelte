<script lang="ts">
	import { message } from 'sveltekit-superforms';
	import * as Card from '$lib/components/ui/card/index.js';
	import { getFlash } from 'sveltekit-flash-message';
	import type { PageData } from './$types.js';
	import LoginForm from './LoginForm.svelte';
	import ResetPasswordForm from './ResetPasswordForm.svelte';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	let { data, event }: { data: PageData; event: Event } = $props();

	let showReset = $state(false);
	let emailSent = $state(false);

	const flash = getFlash(page);
	$effect(() => {
		if (!$flash) return;

		toast[$flash.type === 'error' ? 'error' : 'success']($flash.message);

		emailSent = $flash.source === 'reset_email';

		page.data.flash = null;
	});

	function backToLogin() {
		emailSent = false;
		showReset = false;
	}

	function goToReset() {
		emailSent = false;
		showReset = true;
	}
</script>

<div>
	<Toaster richColors />
</div>
<div class="flex h-screen items-center justify-center bg-[rgba(240,249,255,1)]">
	<div class="w-full max-w-md px-4">
		<div class="mb-4 text-center">
			<h1 class="text-primary w-full pb-4 text-3xl font-extrabold tracking-tighter">SASHAKT</h1>
		</div>

		<Card.Root class="w-full shadow-xl">
			<Card.Header class="space-y-3 pb-6 text-center">
				{#if !showReset}
					<Card.Title class="text-3xl font-bold">Login to Sashakt</Card.Title>
					<Card.Description>Please enter your email and password to login</Card.Description>
				{:else if emailSent}
					<Card.Title class="text-3xl font-bold text-gray-800">Email Sent!</Card.Title>
					<Card.Description>Check your inbox for the reset link</Card.Description>
				{:else}
					<Card.Title class="text-3xl font-bold text-gray-800">Reset Password</Card.Title>
					<Card.Description>Please enter your email to send a reset link</Card.Description>
				{/if}
			</Card.Header>
			<Card.Content class="px-8 pb-8">
				{#if !showReset}
					<LoginForm data={{ form: data.loginForm }} />
					<div class="mt-4 text-right">
						<button
							type="button"
							class="text-sm text-gray-500 hover:text-blue-600 hover:underline focus:outline-none"
							onclick={goToReset}
						>
							Forgot your password?
						</button>
					</div>
				{:else if emailSent}
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
							<p class="text-lg font-semibold text-gray-800">
								Password reset link sent successfully!
							</p>

							<p class="pt-2 text-sm text-gray-600">
								Please check your email and click the link to reset your password.
							</p>
						</div>

						<Button variant="default" class="mt-4 w-full py-5" onclick={backToLogin}>
							Back to Login
						</Button>
					</div>
				{:else}
					<ResetPasswordForm data={{ form: data.resetPasswordForm }} />
					<div class="mt-4 text-right">
						<button
							type="button"
							class="text-sm text-gray-500 hover:text-blue-600 hover:underline focus:outline-none"
							onclick={backToLogin}
						>
							Back to Login
						</button>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
