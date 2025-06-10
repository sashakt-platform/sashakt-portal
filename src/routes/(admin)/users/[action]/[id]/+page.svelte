<script lang="ts">
	import type { PageData } from './$types';
	import UserForm from './UserForm.svelte';

	let { data }: { data: PageData } = $props();

	let title = $state('Create User');
	if (data.action === 'edit') {
		title = 'Edit User';
	}
</script>

<div class="mx-10 flex flex-col py-4 sm:w-[80%]">
	<h2
		class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		{title}
	</h2>

	<UserForm {data} />
</div>
