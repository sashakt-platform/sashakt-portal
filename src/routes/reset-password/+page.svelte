<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import type { PageData } from './$types.js';
	import UpdatePassword from './UpdatePassword.svelte';

	let { data }: { data: PageData; event: Event } = $props();
</script>

<div class="flex h-screen items-center justify-center bg-[rgba(240,249,255,1)]">
	<div class="w-full max-w-md px-4">
		<div class="mb-4 text-center">
			<h1 class="text-primary w-full pb-4 text-3xl font-extrabold tracking-tighter">SASHAKT</h1>
		</div>

		<Card.Root class="w-full shadow-xl">
			<Card.Header class="space-y-3 pb-6 text-center">
				<Card.Title class="text-3xl font-bold text-gray-800">Update Password</Card.Title>
				<Card.Description>Enter your new password below.</Card.Description>
			</Card.Header>

			<Card.Content class="px-8 pb-8">
				<UpdatePassword data={data.form} />
			</Card.Content>
		</Card.Root>
	</div>
</div>
