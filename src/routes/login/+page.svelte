<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { getFlash } from 'sveltekit-flash-message';
	import type { PageData } from './$types.js';
	import LoginForm from './LoginForm.svelte';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';
	import { Toaster } from '$lib/components/ui/sonner/index.js';

	let { data }: { data: PageData } = $props();

	const flash = getFlash(page);
	$effect(() => {
		if (!$flash) return;

		toast[$flash.type === 'error' ? 'error' : 'success']($flash.message);

		page.data.flash = null;
	});
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
				<Card.Title class="text-3xl font-bold">Login to Sashakt</Card.Title>
				<Card.Description>Please enter your email and password to login</Card.Description>
			</Card.Header>
			<Card.Content class="px-8 pb-8">
				<LoginForm data={{ form: data.loginForm }} />
				<div class="mt-4 text-right">
					<a
						href="/forgot-password"
						class="text-sm text-gray-500 hover:text-blue-600 hover:underline focus:outline-none"
					>
						Forgot your password?
					</a>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
