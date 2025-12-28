<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select/index.js';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { tagSchema, type TagFormSchema } from './schema';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	let {
		tagTypes,
		form,
		open = $bindable()
	}: {
		tagTypes: [
			name: string,
			id: number,
			organization_id: number,
			description: string,
			created_date: string,
			modified_date: string,
			is_active: boolean | null,
			is_deleted: boolean
		];
		form: SuperValidated<Infer<TagFormSchema>>;
		openTagDialog: boolean;
	} = $props();
	const triggerContent = $derived(
		tagTypes.find((f) => f.id === $formTagData.tag_type_id)?.name ?? 'Select Tag Type'
	);

	const {
		form: formTagData,
		enhance: enhanceTag,
		submit: submitTag
	} = superForm(form, {
		validators: zod4Client(tagSchema),
		dataType: 'json',
		onSubmit: () => {
			$formTagData.tag_type_id = $formTagData.tag_type_id;
		}
	});
</script>

<form action="?/tagSave" method="POST" use:enhanceTag>
	<div class="flex w-full flex-col gap-6 px-8">
		<div class="flex flex-col gap-4">
			<h2 class="font-semibold">Name</h2>
			<Input type="text" name="name" bind:value={$formTagData.name} />
		</div>
		<div class="flex flex-col gap-2">
			<h2 class="font-semibold">Description</h2>
			<Textarea name="description" bind:value={$formTagData.description} />
		</div>
		<div class="flex w-full flex-col gap-2">
			<h2 class="font-semibold">Tag Type</h2>
			<Select.Root type="single" name="tag_type_id" bind:value={$formTagData.tag_type_id}>
				<Select.Trigger>
					{triggerContent}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						{#each tagTypes as tagType (tagType.id)}
							<Select.Item value={tagType.id} label={tagType.name}>
								{tagType.name}
							</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
		</div>

		<div class="my-4 flex flex-row justify-end gap-4">
			<Button type="button" variant="outline" class="text-primary" onclick={() => (open = false)}
				>Cancel</Button
			>
			<Button type="submit" disabled={!$formTagData.name}>Save</Button>
		</div>
	</div>
</form>
