<script lang="ts">
	import type { PageData } from './$types';
	import UserForm from './UserForm.svelte';

	let { data }: { data: PageData } = $props();

	let title = $state('Create User');
	if (data.action === 'edit') {
		title = 'Edit User';
	}
</script>

<div class="mx-10 flex flex-col py-4">
	<h2
		class="my-10 mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		{title}
	</h2>
	<div class="bg-white p-10">
		<UserForm {data} />
	</div>
</div>
