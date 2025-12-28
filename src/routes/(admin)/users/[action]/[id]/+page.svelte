<script lang="ts">
	import type { PageData } from './$types';
	import UserForm from './UserForm.svelte';

	let { data }: { data: PageData } = $props();

	let title = $state('Create User');
	if (data.action === 'edit') {
		title = 'Edit User';
	}
</script>

<div class="mx-4 flex flex-col py-4 sm:mx-6 md:mx-10">
	<h2
		class="my-6 mr-2 w-fit scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 sm:text-3xl md:my-10"
	>
		{title}
	</h2>
	<div class="bg-white p-4 sm:p-6 md:p-10">
		<UserForm {data} />
	</div>
</div>
