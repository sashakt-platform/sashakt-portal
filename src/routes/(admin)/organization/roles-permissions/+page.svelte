<script lang="ts">
	import ListingPageLayout from '$lib/components/ListingPageLayout.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { resolve } from '$app/paths';
	import { canCreate, canUpdate } from '$lib/utils/permissions.js';
	import Plus from '@lucide/svelte/icons/plus';
	import PermissionMatrix from './PermissionMatrix.svelte';

	const { data } = $props();

	const userCanCreate = $derived(canCreate(data.user, 'role'));
	const userCanUpdate = $derived(canUpdate(data.user, 'role'));
</script>

<ListingPageLayout title="Roles and Permission" subtitle="" showInfoIcon={false}>
	{#snippet headerActions()}
		{#if userCanCreate}
			<a href={resolve('/organization/roles-permissions/add/new')}>
				<Button class="font-semibold"><Plus />Create Role</Button>
			</a>
		{/if}
	{/snippet}

	{#snippet content()}
		<PermissionMatrix
			roles={data.roles}
			permissions={data.permissions}
			canUpdate={userCanUpdate}
		/>
	{/snippet}
</ListingPageLayout>
