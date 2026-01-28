<script>
	import Info from '@lucide/svelte/icons/info';
	import Label from '$lib/components/ui/label/label.svelte';
	import AccountForm from './AccountForm.svelte';

	const { data } = $props();
</script>

<AccountForm {data}>
	{#snippet header()}
		<div class="mx-4 flex flex-row sm:mx-6 md:mx-10">
			<div class="my-auto flex flex-col">
				<div class="flex w-full items-center align-middle">
					<div class="flex flex-row">
						<h2
							class="mr-2 w-fit scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 sm:text-3xl"
						>
							My Profile
						</h2>
						<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
					</div>
				</div>
				<Label class="my-auto align-middle text-sm font-extralight">Update your information</Label>
			</div>
		</div>
	{/snippet}
</AccountForm>
