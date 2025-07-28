<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import Info from '@lucide/svelte/icons/info';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash_2 from '@lucide/svelte/icons/trash-2';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';

	const { data } = $props();
	let deleteAction: string | null = $state(null);
</script>

<div>
	<DeleteDialog
		bind:action={deleteAction}
		elementName={deleteAction?.includes('tagtype') ? 'Tag-Type' : 'Tag'}
	/>
	<div class="mx-10 flex flex-row py-4">
		<div class="my-auto flex flex-col">
			<div class=" flex w-full items-center align-middle">
				<div class="flex flex-row">
					<h2
						class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
					>
						Tag Management
					</h2>
					<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
				</div>
			</div>
			<Label class="my-auto align-middle text-sm font-extralight"
				>Create, edit and update all the Tags and Tag-Types</Label
			>
		</div>
		<div class={['my-auto ml-auto gap-3 p-4']}>
			<a href="/tags/tag/new"
				><Button class="font-bold" variant="outline"><Plus />Create a Tag</Button></a
			>
			<a href="/tags/tagtype/new"><Button class=" font-bold "><Plus />Create Tag-Type</Button></a>
		</div>
	</div>

	<div class="mx-8 mt-10 flex flex-col gap-8">
		<Tabs.Root value="tag" class="w-full">
			<Tabs.List>
				<Tabs.Trigger value="tag">Tags</Tabs.Trigger>
				<Tabs.Trigger value="tagtype">Tag-Types</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="tag"
				><div>
					<Table.Root>
						<Table.Header>
							<Table.Row
								class=" bg-primary-foreground my-2 flex items-center rounded-lg font-bold  text-black"
							>
								<Table.Head class="flex w-1/12 items-center">No.</Table.Head>
								<Table.Head class="flex w-5/12 items-center">Tag Name</Table.Head>
								<Table.Head class="flex w-3/12 items-center">Tag-Type</Table.Head>
								<Table.Head class="flex w-2/12 items-center">Updated</Table.Head>
								<Table.Head class="flex w-1/12 items-center">Options</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data?.tags as tag, index (tag.id)}
								<Table.Row
									class=" mt-2 flex  items-center rounded-lg border  border-gray-200  bg-white font-medium "
								>
									<Table.Cell class="flex w-1/12 items-center">{index + 1}</Table.Cell>
									<Table.Cell class="flex w-5/12 items-center">
										{tag.name}
									</Table.Cell>
									<Table.Cell class="flex w-3/12 items-center">
										{tag?.tag_type?.name || 'None'}
									</Table.Cell>
									<Table.Cell class="flex w-2/12 items-center">
										{new Date(tag.modified_date).toLocaleDateString('en-US', {
											year: '2-digit',
											month: 'short',
											day: 'numeric',
											hour: 'numeric',
											minute: 'numeric'
										})}
									</Table.Cell>
									<Table.Cell class="flex w-1/12 flex-row items-center gap-4">
										<a href={`/tags/tag/${tag.id}`}><Pencil class="w-4 cursor-pointer " /></a>
										<Trash_2
											class="w-4 cursor-pointer"
											onclick={() => (deleteAction = `/tags/tag/${tag.id}?/delete`)}
										/>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div></Tabs.Content
			>
			<Tabs.Content value="tagtype"
				><div>
					<Table.Root>
						<Table.Header>
							<Table.Row
								class=" bg-primary-foreground my-2 flex items-center rounded-lg font-bold  text-black"
							>
								<Table.Head class="flex w-1/12 items-center">No.</Table.Head>
								<Table.Head class="flex w-5/12 items-center">Tag-Type Name</Table.Head>
								<Table.Head class="flex w-2/12 items-center">Updated</Table.Head>
								<Table.Head class="flex w-1/12 items-center">Options</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data?.tagTypes as tagType, index (tagType.id)}
								<Table.Row
									class=" mt-2 flex cursor-pointer  items-center rounded-lg border  border-gray-200  bg-white font-medium"
								>
									<Table.Cell class="flex w-1/12 items-center">{index + 1}</Table.Cell>
									<Table.Cell class="flex w-5/12 items-center">
										{tagType.name}
									</Table.Cell>
									<Table.Cell class="flex w-2/12 items-center">
										{new Date(tagType.modified_date).toLocaleDateString('en-US', {
											year: '2-digit',
											month: 'short',
											day: 'numeric',
											hour: 'numeric',
											minute: 'numeric'
										})}
									</Table.Cell>
									<Table.Cell class="flex w-1/12 flex-row items-center gap-4">
										<a href={`/tags/tagtype/${tagType.id}`}><Pencil class="w-4" /></a>
										<Trash_2
											class="w-4"
											onclick={() => (deleteAction = `/tags/tagtype/${tagType.id}?/delete`)}
										/>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div></Tabs.Content
			>
		</Tabs.Root>
	</div>
</div>
