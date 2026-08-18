<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { resolve } from '$app/paths';

	const { data }: { data: { action: string; id: string } } = $props();

	const isEditMode = $derived(data.action === 'edit');
</script>

<div class="mx-auto flex flex-col gap-10 py-8">
	<div class="mx-4 flex items-center gap-3 py-4 sm:mx-6 md:mx-10">
		<a
			href={resolve('/organization/roles-permissions')}
			class="hover:bg-muted rounded-lg border p-2"
			aria-label="Back to roles and permissions"
		>
			<ArrowLeft size={20} />
		</a>
		<h2 class="text-2xl font-bold tracking-tight">
			{isEditMode ? 'Edit Role' : 'Create Role'}
		</h2>
	</div>
</div>
