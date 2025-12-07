<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import type { PageData } from './$types.js';
	import LoginForm from './LoginForm.svelte';
	let { data, event }: { data: PageData; event: Event } = $props();
</script>

<div class="flex h-screen items-center justify-center px-4">
	<Card.Root class="w-full max-w-[350px]">
		<Card.Header>
			<Card.Title>Login to Sashakt</Card.Title>
			<Card.Description>Please enter your email and password to login.</Card.Description>
		</Card.Header>
		<Card.Content>
			<LoginForm {data} />
		</Card.Content>
	</Card.Root>
</div>
