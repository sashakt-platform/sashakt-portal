<script>
	import ChangePassword from './ChangePassword.svelte';

	const { data } = $props();
</script>

<div class="mx-10 flex flex-col py-4">
	<div
		class="my-4 mr-2 flex scroll-m-20 justify-between pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		<h2>Change Password</h2>
	</div>
	<div class="bg-white p-10">
		<ChangePassword {data} />
	</div>
</div>
