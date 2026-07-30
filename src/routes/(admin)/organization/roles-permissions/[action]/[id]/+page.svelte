<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { SvelteSet } from 'svelte/reactivity';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data } = $props();

	const ACTIONS = ['create', 'read', 'update', 'delete'] as const;
	type Action = (typeof ACTIONS)[number];

	type Permission = { id: number; name: string; description: string | null; is_active: boolean };

	function humanize(resource: string): string {
		return resource
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	const HIDDEN_RESOURCES = new Set([
		'user_me',
		'question_location',
		'question_revision',
		'question_tag',
		'organization',
		'organization_settings',
		'candidate_test',
		'candidate_test_answer',
		'form_response',
		'location'
	]);

	const PARTIAL_HIDDEN_ACTIONS: Partial<Record<string, Action[]>> = {
		candidate: ['create', 'read', 'update'],
		user: ['read']
	};

	const RESOURCE_LABEL_OVERRIDES: Record<string, string> = {
		provider: 'Integrations',
		my_organization: 'Organization',
		my_organization_settings: 'Organization Settings'
	};

	const permissionGroups = $derived.by(() => {
		const permissionsByResource: Record<string, Partial<Record<Action, Permission>>> = {};

		for (const permission of data.permissionCatalog as Permission[]) {
			const match = permission.name.match(/^(create|read|update|delete)_(.+)$/);
			if (!match) continue;
			const [, action, resource] = match;
			if (HIDDEN_RESOURCES.has(resource)) continue;
			if (PARTIAL_HIDDEN_ACTIONS[resource]?.includes(action as Action)) continue;
			permissionsByResource[resource] ??= {};
			permissionsByResource[resource][action as Action] = permission;
		}

		return Object.entries(permissionsByResource)
			.map(([resource, permissionsByAction]) => ({
				resource,
				label: RESOURCE_LABEL_OVERRIDES[resource] ?? humanize(resource),
				permissionsByAction
			}))
			.sort((firstGroup, secondGroup) => firstGroup.label.localeCompare(secondGroup.label));
	});

	const selectedIds = new SvelteSet<number>(data.role.permissions);
	const initialIds = $derived(new Set<number>(data.role.permissions));

	$effect(() => {
		selectedIds.clear();
		for (const id of data.role.permissions) selectedIds.add(id);
	});

	const canSave = $derived(
		selectedIds.size !== initialIds.size || [...selectedIds].some((id) => !initialIds.has(id))
	);

	function toggle(permissionId: number, checked: boolean) {
		if (checked) {
			selectedIds.add(permissionId);
		} else {
			selectedIds.delete(permissionId);
		}
	}
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
				<h2 class="text-2xl font-bold tracking-tight">Edit {data.role.label}</h2>
			</div>
		</div>
	</div>
	<hr class="border-border" />

	<form method="POST" action="?/save" use:enhance>
		<input type="hidden" name="name" value={data.role.name} />
		<input type="hidden" name="label" value={data.role.label} />
		<input type="hidden" name="description" value={data.role.description ?? ''} />
		<input type="hidden" name="is_active" value={String(data.role.is_active)} />
		{#each selectedIds as id (id)}
			<input type="hidden" name="permissions" value={id} />
		{/each}

		<div class="bg-background">
			<div class="mx-4 mt-6 flex flex-col gap-8 sm:mx-8 sm:mt-10">
				<div class="flex flex-col gap-4">
					{#if data.permissionCatalog.length === 0}
						<div class="bg-card border-border rounded-2xl border p-8 text-center">
							<p class="text-muted-foreground text-sm">
								The permission catalog couldn't be loaded, so permissions can't be edited right now.
							</p>
						</div>
					{:else}
						<div class="bg-card border-border overflow-hidden rounded-2xl border">
							<div
								class="bg-muted text-muted-foreground flex items-center justify-between px-6 py-5 text-xs font-bold tracking-wide uppercase"
							>
								<p>Permission</p>
								<div class="flex gap-8">
									{#each ACTIONS as action (action)}
										<span class="w-14 text-center">{action}</span>
									{/each}
								</div>
							</div>
							{#each permissionGroups as permissionGroup, groupIndex (permissionGroup.resource)}
								<div
									class={[
										'flex items-center justify-between px-6 py-4',
										groupIndex > 0 && 'border-border border-t'
									]}
								>
									<p class="text-sm">{permissionGroup.label}</p>
									<div class="flex gap-8">
										{#each ACTIONS as action (action)}
											<div class="flex w-14 justify-center">
												{#if permissionGroup.permissionsByAction[action]}
													<Switch
														checked={selectedIds.has(
															permissionGroup.permissionsByAction[action]!.id
														)}
														onCheckedChange={(checked) =>
															toggle(permissionGroup.permissionsByAction[action]!.id, checked)}
													/>
												{:else}
													<span class="text-muted-foreground">—</span>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="bg-card border-border sticky bottom-0 border-t">
			<div class="mx-4 flex justify-end gap-3 py-4 sm:mx-10">
				<a href={resolve('/organization/roles-permissions')}>
					<Button type="button" variant="outline">Cancel</Button>
				</a>
				<Button type="submit" disabled={!canSave}>Save</Button>
			</div>
		</div>
	</form>
</div>
