<script lang="ts">
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import WhiteEmptyBox from '$lib/components/white-empty-box.svelte';
	import Info from '@lucide/svelte/icons/info';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import DistrictSelection from '$lib/components/DistrictSelection.svelte';

	let { formData } = $props();
	let selectedStates = $derived(formData?.state_ids || []);
</script>

<div class=" mx-auto flex w-full items-center justify-center">
	<WhiteEmptyBox>
		<div class="h-full w-full text-left">
			<div>
				<div class="flex align-middle">
					<Label for="template-name" class="text-2xl"
						>{$formData.is_template ? 'Test template name' : 'Test name'}</Label
					><span><Info class=" m-2  w-4 text-xs text-gray-600" /></span>
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

			<div class="mt-10">
				<div class="flex align-middle">
					<Label for="template-name" class="text-2xl">Description</Label><span
						><Info class=" m-2  w-4 text-xs text-gray-600" /></span
					>
				</div>
				<Textarea placeholder="" name="description" bind:value={$formData.description} />
			</div>

			<div class="flex flex-row gap-8">
				<div class="mt-10 w-1/3">
					<div class="flex align-middle">
						<Label for="template-name" class="text-2xl">Tags</Label><span
							><Info class=" m-2  w-4 text-xs text-gray-600" /></span
						>
					</div>
					<TagsSelection bind:tags={$formData.tag_ids} />
				</div>

				<div class="mt-10 w-1/3">
					<div class="flex align-middle">
						<Label for="template-name" class="text-2xl">States</Label><span
							><Info class=" m-2  w-4 text-xs text-gray-600" /></span
						>
					</div>
					<StateSelection bind:states={$formData.state_ids} filteration={true} />
				</div>
				<div class="mt-10 w-1/3">
					<div class="flex align-middle">
						<Label for="template-name" class="text-2xl">Districts</Label><span
							><Info class=" m-2  w-4 text-xs text-gray-600" /></span
						>
					</div>
					<DistrictSelection bind:districts={$formData.district_ids} {selectedStates} />
				</div>
			</div>

			<div class="mt-10">
				<div class="flex items-center gap-4">
					<label class="relative inline-flex cursor-pointer items-center">
						<input
							type="checkbox"
							id="is-active"
							class="peer sr-only"
							bind:checked={$formData.is_active}
						/>
						<div
							class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
						></div>
					</label>
					<span class="text-sm font-medium">Active</span>
				</div>
			</div>
		</div>
	</WhiteEmptyBox>
</div>
