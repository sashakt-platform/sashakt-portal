<script>
	import { Button } from '$lib/components/ui/button';
	import AccountForm from './AccountForm.svelte';

	const { data } = $props();
	let isEditMode = $state(false);
	let title = $state('Account details');
</script>

<div class="mx-4 flex flex-col py-4 sm:mx-6 md:mx-10">
	<div
		class="my-4 mr-2 flex scroll-m-20 justify-between pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 sm:text-3xl"
	>
		<h2>{title}</h2>
		<Button onclick={() => (isEditMode = true)}>Edit</Button>
	</div>
	<div class="bg-white p-4 sm:p-6 md:p-10">
		<AccountForm {data} bind:isEditMode />
	</div>
</div>
