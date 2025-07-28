<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import Button from '$lib/components/ui/button/button.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { tagSchema, type TagFormSchema } from './schema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import * as Select from '$lib/components/ui/select/index.js';

	const {
		data
	}: {
		data: {
			tagForm: SuperValidated<Infer<TagFormSchema>>;
			tagTypeForm: SuperValidated<Infer<TagFormSchema>>;
			tagTypes: [];
			type: string;
		};
	} = $props();

	const tagData: Partial<Infer<TagFormSchema>> | null = data?.tagData || null;

	console.log('Tag Data:', $inspect(tagData));

	const {
		form: formData,
		enhance,
		submit
	} = superForm(tagData || data.tagForm, {
		validators: zodClient(tagSchema),
		dataType: 'json'
	});

	const triggerContent = $derived(
		data.tagTypes.find((f) => f.id === $formData.tag_type_id)?.name ?? 'Select Tag Type'
	);

	console.log('Tag Form Data:', $inspect($formData));
	tagData && ($formData.tag_type_id = tagData?.tag_type?.id);
</script>

<form method="POST" action="?/save" use:enhance>
	<div class="mx-auto flex h-lvh flex-col gap-10 py-8">
		{#snippet snippetHeading(title: string)}
			<div class="bg-primary-foreground flex flex-row gap-3 rounded-sm px-4 py-3 align-middle">
				<Label class="text-md my-auto font-bold">{title}</Label><Info
					class="my-auto w-4 align-middle text-xs text-gray-600"
				/>
			</div>
		{/snippet}
		<div class="mx-10 flex flex-row">
			<div class="my-auto flex flex-col">
				<div class=" flex w-full items-center align-middle">
					<div class="flex flex-row">
						<h2
							class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
						>
							{tagData ? `Edit ${data.type}` : `Create a ${data.type}`}
						</h2>
						<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
					</div>
				</div>
				<Label class="my-auto align-middle text-sm font-extralight">
					{tagData ? `Edit Existing ${data.type}` : `Add ${data.type}`}
				</Label>
			</div>
		</div>
		<div class="mx-10 flex flex-col gap-10 bg-white p-9">
			<div class="flex w-full flex-col gap-2 pr-8">
				{@render snippetHeading('Name of the Tag')}
				<Input
					type="text"
					name="name"
					bind:value={$formData.name}
					placeholder="Enter Name of the Tag..."
				/>
			</div>
			<div class="flex w-full flex-col gap-2 pr-8">
				{@render snippetHeading('Description of the Tag')}
				<Input
					type="text"
					name="description"
					bind:value={$formData.description}
					placeholder="Enter Description of the Tag..."
				/>
			</div>
			<div class="flex w-full flex-col gap-2 pr-8">
				<h2 class="font-semibold">Select Tag Type</h2>
				<Select.Root type="single" name="tag_type_id" bind:value={$formData.tag_type_id}>
					<Select.Trigger>
						{triggerContent}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each data.tagTypes as tagType (tagType.id)}
								<Select.Item value={tagType.id} label={tagType.name}>
									{tagType.name}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	</div>
	<div class="sticky right-0 bottom-0 left-0 mt-4 flex w-full border-t-4 bg-white p-4 shadow-md">
		<div class="flex w-full justify-between">
			<a href="/tags/"
				><Button variant="outline" class="border-primary text-primary border-1">Cancel</Button></a
			>
			<div class="flex gap-2">
				<Button class="bg-primary" onclick={submit} disabled={$formData.name?.trim() === ''}
					>Save {data.type}</Button
				>
			</div>
		</div>
	</div>
</form>
