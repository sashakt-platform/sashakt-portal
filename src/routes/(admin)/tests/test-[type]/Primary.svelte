<script lang="ts">
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import WhiteEmptyBox from '$lib/components/white-empty-box.svelte';
	import Info from '@lucide/svelte/icons/info';
	import TagsSelection from '../../../../lib/components/TagsSelection.svelte';
	import StateSelection from '../../../../lib/components/StateSelection.svelte';

	let { formData } = $props();
</script>

<div class="mx-auto flex items-center justify-center">
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
					placeholder="Enter the test name"
					class="h-12"
					name="name"
					bind:value={$formData.name}
				/>
				<span class="text-xs text-gray-500"
					>Enter a unique test name to differentiate from the other tests</span
				>
			</div>

			<div class="mt-10">
				<div class="flex align-middle">
					<Label for="template-name" class="text-2xl">Description</Label><span
						><Info class=" m-2  w-4 text-xs text-gray-600" /></span
					>
				</div>
				<Textarea
					placeholder="Enter the test description here..."
					name="description"
					bind:value={$formData.description}
				/>
			</div>

			<div class="flex">
				<div class="mt-10 mr-6 w-1/2">
					<div class="flex align-middle">
						<Label for="template-name" class="text-2xl">Tags</Label><span
							><Info class=" m-2  w-4 text-xs text-gray-600" /></span
						>
					</div>
					<TagsSelection bind:tags={$formData.tag_ids} />
				</div>

				<div class="mt-10 w-1/2">
					<div class="flex align-middle">
						<Label for="template-name" class="text-2xl">States</Label><span
							><Info class=" m-2  w-4 text-xs text-gray-600" /></span
						>
					</div>
					<StateSelection bind:states={$formData.state_ids} />
				</div>
			</div>
		</div>
	</WhiteEmptyBox>
</div>
