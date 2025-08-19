<script>
	import { Button } from '$lib/components/ui/button';
	import AccountForm from './AccountForm.svelte';

	const { data } = $props();
	let isEditMode = $state(false);
	let title = $state('Account details');
</script>

<div class="mx-10 flex flex-col py-4">
	<div
		class="my-4 mr-2 flex scroll-m-20 justify-between pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		<h2>{title}</h2>
		<Button onclick={() => (isEditMode = true)}>Edit</Button>
	</div>
	<div class="bg-white p-10">
		<AccountForm {data} bind:isEditMode />
	</div>
</div>
