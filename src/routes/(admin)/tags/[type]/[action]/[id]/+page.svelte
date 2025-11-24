<script lang="ts">
	import Info from '@lucide/svelte/icons/info';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import Button from '$lib/components/ui/button/button.svelte';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { tagSchema, type TagFormSchema, tagTypeSchema, type TagTypeFormSchema } from './schema';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import * as Select from '$lib/components/ui/select/index.js';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';

	const {
		data
	}: {
		data: {
			tagForm: SuperValidated<Infer<TagFormSchema>>;
			tagTypeForm: SuperValidated<Infer<TagFormSchema>>;
			tagTypes: [];
			type: string;
			tagData: Partial<Infer<TagFormSchema>> | Partial<Infer<TagTypeFormSchema>> | null;
		};
	} = $props();

	const tagData: Partial<Infer<TagFormSchema>> | Partial<Infer<TagTypeFormSchema>> | null =
		data?.tagData || null;

	const {
		form: formData,
		enhance,
		submit
	} = superForm(tagData || (data.type == 'tag' ? data.tagForm : data.tagTypeForm), {
		validators: zodClient(data.type == 'tag' ? tagSchema : tagTypeSchema),
		dataType: 'json',
		onSubmit: () => {
			if (data.type == 'tagtype') {
				$formData.organization_id = data.user.organization_id;
			}
		}
	});

	const triggerContent = $derived(
		data.type == 'tag' &&
			(data.tagTypes.find((f) => f.id === $formData.tag_type_id)?.name ?? 'Select tag type')
	);

	tagData && data.type == 'tag' && ($formData.tag_type_id = tagData?.tag_type?.id || null);

	const title = $derived(data.type == 'tag' ? 'Tag' : 'Tag Type');
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
							{tagData ? `Edit ${title}` : `Create a ${title}`}
						</h2>
						<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
					</div>
				</div>
				<Label class="my-auto align-middle text-sm font-extralight">
					<!-- {tagData ? `Edit Existing ${title}` : `Add ${title}`} -->
				</Label>
			</div>
		</div>
		<div class="mx-10 flex flex-col gap-10 bg-white p-9">
			<div class="flex w-full flex-col gap-2 pr-8">
				<h2 class="font-semibold">Name</h2>
				<Input type="text" name="name" bind:value={$formData.name} data-testid="tag-name-input" />
			</div>
			<div class="flex w-full flex-col gap-2 pr-8">
				<h2 class="font-semibold">Description</h2>
				<Textarea
					name="description"
					bind:value={$formData.description}
					data-testid="tag-desc-input"
				/>
			</div>
			{#if data.type == 'tag'}
				<div class="flex w-full flex-col gap-2 pr-8">
					<h2 class="font-semibold">Tag Type</h2>
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
			{/if}
		</div>
	</div>
	<div class="sticky right-0 bottom-0 left-0 mt-4 flex w-full border-t-4 bg-white p-4 shadow-md">
		<div class="flex w-full justify-between">
			<a href="/tags/"
				><Button variant="outline" class="border-primary text-primary border-1">Cancel</Button></a
			>
			<div class="flex gap-2">
				<Button class="bg-primary" onclick={submit} disabled={$formData.name?.trim() === ''}
					>Save {title}</Button
				>
			</div>
		</div>
	</div>
</form>
