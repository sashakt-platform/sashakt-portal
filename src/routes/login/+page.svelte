<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import type { PageData } from './$types.js';
	import LoginForm from './LoginForm.svelte';
	import ResetPasswordForm from './ResetPasswordForm.svelte';
	let { data, event }: { data: PageData; event: Event } = $props();

	let showReset = $state(false);
</script>

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
