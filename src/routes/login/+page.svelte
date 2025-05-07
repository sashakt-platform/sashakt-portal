<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import type { PageData } from './$types.js';
	import LoginForm from './LoginForm.svelte';
	let { data, event }: { data: PageData; event } = $props();
</script>

<div class="flex h-screen items-center justify-center">
	<Card.Root class="w-[350px]">
		<Card.Header>
			<Card.Title>Login to Sashakt</Card.Title>
			<Card.Description>Please enter your email and password to login.</Card.Description>
		</Card.Header>
		<Card.Content>
			<LoginForm {data} />
		</Card.Content>
	</Card.Root>
</div>
