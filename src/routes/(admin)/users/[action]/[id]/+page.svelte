<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import type { PageData } from './$types';
	import UserForm from './UserForm.svelte';
	import { useTerms } from '$lib/nomenclature';

	let { data }: { data: PageData } = $props();
	const term = useTerms();

	const title = $derived(
		data.action === 'edit' ? `Edit ${term('user')}` : `Create ${term('user')}`
	);
</script>

<div class="mx-auto flex flex-col gap-10 py-8">
	<div class="mx-4 flex items-center justify-between py-4 sm:mx-6 md:mx-10">
		<div class="flex items-center gap-3">
			<a
				href={resolve('/users')}
				class="hover:bg-muted rounded-lg border p-2"
				aria-label={`Back to ${term('users', 'lower')}`}
			>
				<ArrowLeft size={20} />
			</a>
			<h2 class="text-2xl font-bold tracking-tight">
				{title}
			</h2>
		</div>
		<Button type="submit" form="user-form" class="bg-primary font-semibold">Save</Button>
	</div>
	<div class="mx-4 sm:mx-6 md:mx-10">
		<div class="bg-card rounded-2xl border p-8">
			<UserForm {data} />
		</div>
	</div>
</div>
