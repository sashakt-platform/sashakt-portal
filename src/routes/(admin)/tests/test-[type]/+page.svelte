<script lang="ts">
	import EmptyBox from '$lib/components/first-data-box.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Info from '@lucide/svelte/icons/info';

	import * as Table from '$lib/components/ui/table/index.js';
	import Button from '$lib/components/ui/button/button.svelte';

	import { page } from '$app/state';

	import Plus from '@lucide/svelte/icons/plus';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash_2 from '@lucide/svelte/icons/trash-2';
	import FilePlus from '@lucide/svelte/icons/file-plus';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import { goto } from '$app/navigation';
	import DeleteDialog from '$lib/components/DeleteDialog.svelte';

	let filteredTags: string[] = $state([]);
	let filteredStates: string[] = $state([]);

	let {
		data
	}: {
		data: {
			test_taker_url: string;
			is_template: boolean;
			tests: any[];
		};
	} = $props();

	let noTestCreatedYet = $derived.by(() => {
		return data?.tests?.length === 0 && [...page.url.searchParams.keys()].length === 0;
	});

	let searchTimeout: ReturnType<typeof setTimeout>;
	let deleteAction: string | null = $state(null);
</script>

<DeleteDialog
	bind:action={deleteAction}
	elementName={data?.is_template ? 'Test template' : 'Test session'}
/>

<div id="mainpage" class="flex flex-col">
	<div class="mx-10 flex flex-row py-4 sm:w-[80%]">
		<div class="my-auto flex flex-col">
			<div class=" flex w-full items-center align-middle">
				<div class="flex flex-row">
					<h2
						class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
					>
						{data?.is_template ? 'Test templates' : 'Test sessions'}
					</h2>
					<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
				</div>
			</div>
			<Label class="my-auto align-middle text-sm font-extralight"
				>{data?.is_template
					? 'Create, edit and update all the test templates'
					: 'Create, edit,conduct and update all the test session'}</Label
			>
		</div>
		<div class="my-auto ml-auto p-4">
			{#if !noTestCreatedYet}
				<Button class="font-bold" href={page.url.pathname + '/new'}
					><Plus />{data?.is_template ? 'Create a test template' : 'Create a test session'}</Button
				>
			{/if}
		</div>
	</div>

	{#if noTestCreatedYet}
		<EmptyBox
			title={data?.is_template
				? 'Create your first test template'
				: 'Create your first test session'}
			subtitle={data?.is_template
				? 'Click on create a test template to create test templates to be assigned'
				: 'Click on create a test to create tests to be conducted'}
			leftButton={{
				title: `${data?.is_template ? 'Create Test Template' : 'Create Custom Test'}`,
				link: '/tests/test-' + (data?.is_template ? 'template' : 'session') + '/new',
				click: () => {
					return null;
				}
			}}
			rightButton={!data?.is_template
				? {
						title: `Create from test Template`,
						link: '/tests/test-template/new',
						click: () => {
							return null;
						}
					}
				: null}
		/>
	{:else}
		<div class="mx-8 mt-10 flex flex-col gap-8 sm:w-[80%]">
			<div class="flex flex-row gap-2">
				<div class="w-1/5">
					<TagsSelection
						bind:tags={filteredTags}
						onOpenChange={(e: boolean) => {
							if (!e) {
								const url = new URL(page.url);
								url.searchParams.delete('tag_ids');
								filteredTags.map((tag_id: string) => {
									url.searchParams.append('tag_ids', tag_id);
								});
								goto(url, { keepFocus: true, invalidateAll: true });
							}
						}}
					/>
				</div>

				<div class="w-1/5">
					<StateSelection
						bind:states={filteredStates}
						onOpenChange={(e: boolean) => {
							if (!e) {
								const url = new URL(page.url);
								url.searchParams.delete('state_ids');
								filteredStates.map((state_id: string) => {
									url.searchParams.append('state_ids', state_id);
								});
								goto(url, { keepFocus: true, invalidateAll: true });
							}
						}}
					/>
				</div>
				<div class="ml-auto w-1/5">
					<Input
						data-sveltekit-keepfocus
						data-sveltekit-preloaddata
						type="search"
						placeholder={data?.is_template ? 'Search test templates...' : 'Search test sessions...'}
						oninput={(event) => {
							const url = new URL(page.url);
							clearTimeout(searchTimeout);
							searchTimeout = setTimeout(() => {
								url.searchParams.set('name', event?.target?.value || '');
								goto(url, { keepFocus: true, invalidateAll: true });
							}, 500);
						}}
					/>
				</div>
			</div>
			<div>
				<Table.Root>
					<Table.Header>
						<Table.Row
							class="bg-primary-foreground my-2 flex items-center rounded-lg font-extrabold  text-black"
						>
							<Table.Head class="flex w-1/12 items-center ">No.</Table.Head>
							<Table.Head class="flex w-5/12 items-center"
								>Test {data?.is_template ? 'Template' : 'Name'}</Table.Head
							>
							<Table.Head class="flex w-3/12 items-center">Tags</Table.Head>
							<Table.Head class="flex w-2/12 items-center">Updated</Table.Head>
							<Table.Head class="flex w-1/12 items-center"></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data?.tests as test, index (test.id)}
							<Table.Row
								class=" my-2 flex items-center  rounded-lg border border-gray-200  bg-white  font-medium "
							>
								<Table.Cell class="w-1/12 items-center">{index + 1}</Table.Cell>
								<Table.Cell class="w-5/12 items-center">{test.name}</Table.Cell>
								<Table.Cell class="w-3/12 items-center">
									{#if test.tags && test.tags.length > 0}
										{test.tags.map((tag: { name: string }) => tag.name).join(', ')}
									{:else}
										None
									{/if}
								</Table.Cell>
								<Table.Cell class="w-2/12 items-center">
									{#if test.modified_date}
										{new Date(test.modified_date).toLocaleDateString('en-US', {
											day: 'numeric',
											month: 'short',
											year: 'numeric'
										})}
										{new Date(test.modified_date).toLocaleTimeString('en-US', {
											hour: 'numeric',
											minute: '2-digit',
											hour12: true
										})}
									{/if}
								</Table.Cell>
								<Table.Cell class="w-1/12 items-center">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger class={buttonVariants({ variant: 'ghost' })}
											><Ellipsis /></DropdownMenu.Trigger
										>
										<DropdownMenu.Content class="w-56">
											<DropdownMenu.Group>
												<a href={`${page.url.pathname}/${test.id}/`}>
													<DropdownMenu.Item>
														<Pencil />
														<span>Edit</span>
													</DropdownMenu.Item>
												</a>
												<DropdownMenu.Item
													onclick={() =>
														(deleteAction = `${page.url.pathname}/${test.id}/?/delete`)}
												>
													<Trash_2 />
													Delete
												</DropdownMenu.Item>

												<!-- <form action="{page.url.pathname}/{test.id}/?/save" method="POST">
													<input type="hidden" name="name" value={'Copy of ' + test.name} />
													<button type="submit" class="w-full text-left">
														<DropdownMenu.Item>
															<CopyPlus />
															<span>Clone</span>
														</DropdownMenu.Item>
													</button>
												</form> -->
												<a
													href="/tests/test-session/convert/?template_id={test.id}"
													hidden={!test.is_template}
												>
													<DropdownMenu.Item>
														<FilePlus />
														<span>Make a Test</span>
													</DropdownMenu.Item>
												</a>
												<DropdownMenu.Item
													hidden={test.is_template}
													onclick={() => {
														window.open(`${data.test_taker_url}/test/${test.link}`, '_blank');
													}}
												>
													<ExternalLink />
													<span>Conduct Test</span>
												</DropdownMenu.Item>
											</DropdownMenu.Group>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	{/if}
</div>
