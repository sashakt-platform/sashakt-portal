<script lang="ts">
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import WhiteEmptyBox from '$lib/components/white-empty-box.svelte';
	import Info from '@lucide/svelte/icons/info';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import DistrictSelection from '$lib/components/DistrictSelection.svelte';
	import { isStateAdmin, getUserState, type User } from '$lib/utils/permissions.js';

	let { formData, user = null }: { formData: any; user?: User | null } = $props();
	let selectedStates = $derived(formData?.state_ids || []);

	// for State admins, auto-assign their state
	$effect(() => {
		if (isStateAdmin(user) && $formData.state_ids?.length === 0) {
			const userState = getUserState(user);
			if (userState) {
				$formData.state_ids = [{ id: String(userState.id), name: userState.name }];
			}
		}
	});
</script>

<div class=" mx-auto flex w-full items-center justify-center">
	<WhiteEmptyBox>
		<div class="h-full w-full text-left">
			<div>
				<div class="flex align-middle">
					<Label for="template-name" class="text-xl md:text-2xl"
						>{$formData.is_template ? 'Test template name' : 'Test name'}</Label
					><span><Info class="m-2 w-4 text-xs text-gray-600" /></span>
				</div>
				<Input
					type="text"
					id="template-name"
					placeholder=""
					class="h-12"
					name="name"
					bind:value={$formData.name}
				/>
				<span class="text-xs text-gray-500"
					>Enter a unique name so it can be easily distinguished from other {$formData.is_template
						? 'test templates.'
						: 'tests.'}.</span
				>
			</div>

			<div class="mt-6 md:mt-10">
				<div class="flex align-middle">
					<Label for="template-name" class="text-xl md:text-2xl">Description</Label><span
						><Info class="m-2 w-4 text-xs text-gray-600" /></span
					>
				</div>
				<Textarea placeholder="" name="description" bind:value={$formData.description} />
			</div>

			<div class="flex flex-col gap-6 md:flex-row md:gap-8">
				<div class="mt-6 w-full md:mt-10 md:w-1/3">
					<div class="flex align-middle">
						<Label for="template-name" class="text-xl md:text-2xl">Tags</Label><span
							><Info class="m-2 w-4 text-xs text-gray-600" /></span
						>
					</div>
					<TagsSelection bind:tags={$formData.tag_ids} />
				</div>

				{#if !isStateAdmin(user)}
					<div class="mt-6 w-full md:mt-10 md:w-1/3">
						<div class="flex align-middle">
							<Label for="template-name" class="text-xl md:text-2xl">States</Label><span
								><Info class="m-2 w-4 text-xs text-gray-600" /></span
							>
						</div>
						<StateSelection bind:states={$formData.state_ids} filteration={true} />
					</div>
				{/if}
				<div class="mt-6 w-full md:mt-10 md:w-1/3">
					<div class="flex align-middle">
						<Label for="template-name" class="text-xl md:text-2xl">Districts</Label><span
							><Info class="m-2 w-4 text-xs text-gray-600" /></span
						>
					</div>
					<DistrictSelection bind:districts={$formData.district_ids} {selectedStates} />
				</div>
			</div>

			<div class="mt-10">
				<div class="flex items-center gap-4">
					<Switch id="is-active" bind:checked={$formData.is_active} />
					<span class="text-sm font-medium">Is Active?</span>
				</div>
			</div>
		</div>
	</WhiteEmptyBox>
</div>
