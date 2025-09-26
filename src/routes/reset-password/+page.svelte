<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import type { PageData } from './$types.js';
	import UpdatePassword from './UpdatePassword.svelte';

	let { data }: { data: PageData; event: Event } = $props();
</script>

<div class="flex h-screen items-center justify-center">
	<Card.Root class="w-[350px]">
		<Card.Header>
			<Card.Title>Update Password</Card.Title>
			<Card.Description>Enter your new password below.</Card.Description>
		</Card.Header>
		<Card.Content>
			<UpdatePassword data={data.form} />
		</Card.Content>
	</Card.Root>
</div>
