<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { resolve } from '$app/paths';
	import { Input } from '$lib/components/ui/input/index.js';

	let { data } = $props();
</script>

<div>
	<div class="bg-card">
		<div class="mx-4 flex items-center justify-between py-4 sm:mx-10">
			<div class="m-4 flex items-center gap-3">
				<a
					href={resolve('/organization/roles-permissions')}
					class="border-border hover:bg-muted rounded-lg border p-2"
					aria-label="Back to Roles and Permission"
				>
					<ArrowLeft size={20} />
				</a>
				<h2 class="text-2xl font-bold tracking-tight">Edit Role</h2>
			</div>
		</div>
	</div>
	<hr class="border-border" />

	<div class="bg-background">
		<div class="mx-4 mt-6 flex flex-col gap-8 sm:mx-8 sm:mt-10">
			<div
				class="bg-card border-border flex flex-col items-center justify-between gap-4 rounded-2xl border p-6 sm:flex-row"
			>
				<div>
					<p class="font-semibold">Role name</p>
					<p class="text-muted-foreground text-sm">Predefined roles can't be renamed</p>
				</div>
				<Input value={data.role.label} disabled class="bg-muted max-w-md" />
			</div>
		</div>
	</div>
</div>
