<script>
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import { Button } from '$lib/components/ui/button';
	import OrganizationForm from './OrganizationForm.svelte';
	const { data } = $props();

	let isEditMode = $state(false);
</script>

<div class="mx-4 flex flex-col py-4 sm:mx-6 md:mx-10">
	<div
		class="my-4 mr-2 flex scroll-m-20 justify-between pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 sm:text-3xl"
	>
		<ListingPageLayout
			title="Organization Management"
			subtitle="Manage Organization"
			infoLabel="Help: User management"
			infoDescription="This panel displays all users in the system. You can edit or delete a user by clicking the three dots next to their entry."
		></ListingPageLayout>
		<Button onclick={() => (isEditMode = true)}>Edit</Button>
	</div>
	<div class="bg-white p-4 sm:p-6 md:p-10">
		<OrganizationForm {data} bind:isEditMode />
	</div>
</div>
