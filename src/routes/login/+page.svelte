<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { getFlash } from 'sveltekit-flash-message';
	import type { PageData } from './$types.js';
	import LoginForm from './LoginForm.svelte';
	import ResetPasswordForm from './ResetPasswordForm.svelte';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	let { data, event }: { data: PageData; event: Event } = $props();

	let showReset = $state(false);
	const flash = getFlash(page);
	$effect(() => {
		if (!$flash) return;
		$flash.type === 'error' ? toast.error($flash.message) : toast.success($flash.message);
	});
</script>

<div>
	<Toaster richColors />
</div>
<div class="flex h-screen items-center justify-center">
	<Card.Root class="w-[350px]">
		<Card.Header>
			{#if !showReset}
				<Card.Title>Login to Sashakt</Card.Title>
				<Card.Description>Please enter your email and password to login.</Card.Description>
			{:else}
				<Card.Title>Reset Password</Card.Title>
				<Card.Description>Please enter your email to send a reset link.</Card.Description>
			{/if}
		</Card.Header>
		<Card.Content>
			{#if !showReset}
				<LoginForm data={{ form: data.loginForm }} />
				<button
					type="button"
					class="mt-2 text-sm text-blue-500 hover:underline focus:outline-none"
					onclick={() => (showReset = true)}
				>
					Forgot Password?
				</button>
			{:else}
				<ResetPasswordForm data={{ form: data.resetForm }} />
				<button
					type="button"
					class="mt-2 text-sm text-blue-500 hover:underline focus:outline-none"
					onclick={() => (showReset = false)}
				>
					Back to Login
				</button>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
