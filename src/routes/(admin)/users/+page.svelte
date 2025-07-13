<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import { columns } from './columns.js';
	import Info from '@lucide/svelte/icons/info';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import Plus from '@lucide/svelte/icons/plus';

	let { data } = $props();

	// let's pass users.data
	let tableData = data?.users?.data || [];
</script>

<div class="mx-10 flex flex-row py-4">
	<div class="my-auto flex flex-col">
		<div class=" flex w-full items-center align-middle">
			<div class="flex flex-row">
				<h2
					class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
				>
					User Management
				</h2>
				<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
			</div>
		</div>
		<Label class="my-auto align-middle text-sm font-extralight">Manage users</Label>
	</div>
	<div class="my-auto ml-auto flex gap-3 p-4">
		<a href="/users/add/new"><Button class="font-bold"><Plus />Add User</Button></a>
	</div>
</div>

<div class="m-10 rounded-2xl align-top shadow-2xl">
	<DataTable data={tableData} {columns} />
</div>
