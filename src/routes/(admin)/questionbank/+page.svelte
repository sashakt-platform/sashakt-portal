<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import FileUp from '@lucide/svelte/icons/file-up';
	import Info from '@lucide/svelte/icons/info';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash';
	import WhiteEmptyBox from '$lib/components/white-empty-box.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Trash_2 from '@lucide/svelte/icons/trash-2';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	$effect(() => useSidebar().setOpen(true));
	const { data } = $props();
	let currentRow: number | null = $state(null);
</script>

<div>
	<div class="mx-10 flex flex-row py-4 sm:w-[80%]">
		<div class="my-auto flex flex-col">
			<div class=" flex w-full items-center align-middle">
				<div class="flex flex-row">
					<h2
						class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
					>
						Question Bank
					</h2>
					<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
				</div>
			</div>
			<Label class="my-auto align-middle text-sm font-extralight"
				>Create, edit and update all the questions</Label
			>
		</div>
		<div class={['my-auto ml-auto gap-3 p-4', data.questions.length == 0 ? 'hidden' : 'flex']}>
			<a href="/questionbank/single-question/new"
				><Button class="font-bold" variant="outline"><Plus />Create a Question</Button></a
			>
			<a href="/questionbank/import"><Button class=" font-bold "><Plus />Bulk Upload</Button></a>
		</div>
	</div>
	{#if data.questions.length == 0}
		<WhiteEmptyBox>
			<svg
				width="100"
				height="100"
				viewBox="0 0 100 100"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="50" cy="50" r="50" fill="#F0F9FF" />
				<mask
					id="mask0_1239_3148"
					style="mask-type:alpha"
					maskUnits="userSpaceOnUse"
					x="25"
					y="22"
					width="56"
					height="56"
				>
					<rect x="25" y="22" width="56" height="56" fill="#D9D9D9" />
				</mask>
				<g mask="url(#mask0_1239_3148)">
					<path
						d="M36.6667 31.3335V45.7599V45.6922V68.6668V31.3335ZM43.6667 54.0835H50.0385C50.5343 54.0835 50.9501 53.9157 51.2857 53.5801C51.6209 53.2445 51.7885 52.8287 51.7885 52.3329C51.7885 51.8367 51.6209 51.4212 51.2857 51.0863C50.9501 50.7511 50.5343 50.5835 50.0385 50.5835H43.6667C43.1709 50.5835 42.7554 50.7513 42.4202 51.0869C42.0846 51.4225 41.9167 51.8382 41.9167 52.3341C41.9167 52.8303 42.0846 53.2458 42.4202 53.5807C42.7554 53.9159 43.1709 54.0835 43.6667 54.0835ZM43.6667 63.4168H46.5385C47.0343 63.4168 47.4501 63.249 47.7857 62.9134C48.1209 62.5778 48.2885 62.1621 48.2885 61.6662C48.2885 61.17 48.1209 60.7545 47.7857 60.4197C47.4501 60.0844 47.0343 59.9168 46.5385 59.9168H43.6667C43.1709 59.9168 42.7554 60.0846 42.4202 60.4202C42.0846 60.7559 41.9167 61.1716 41.9167 61.6674C41.9167 62.1636 42.0846 62.5792 42.4202 62.914C42.7554 63.2492 43.1709 63.4168 43.6667 63.4168ZM37.3848 72.1668C36.2061 72.1668 35.2084 71.7585 34.3917 70.9418C33.5751 70.1252 33.1667 69.1275 33.1667 67.9487V32.0516C33.1667 30.8729 33.5751 29.8752 34.3917 29.0585C35.2084 28.2418 36.2061 27.8335 37.3848 27.8335H54.1714C54.7404 27.8335 55.2827 27.9428 55.7983 28.1613C56.314 28.3795 56.7634 28.6801 57.1464 29.0632L66.9371 38.8538C67.3201 39.2369 67.6207 39.6862 67.8389 40.2019C68.0575 40.7176 68.1667 41.2599 68.1667 41.8288V44.2928C68.1667 44.782 67.9989 45.1923 67.6633 45.5237C67.3277 45.8546 66.912 46.0201 66.4162 46.0201C65.9199 46.0201 65.5044 45.8523 65.1696 45.5167C64.8344 45.1814 64.6667 44.7659 64.6667 44.2701V41.8335H56.2662C55.6712 41.8335 55.1726 41.6322 54.7705 41.2297C54.368 40.8272 54.1667 40.3285 54.1667 39.7335V31.3335H37.3848C37.2052 31.3335 37.0407 31.4084 36.8913 31.5581C36.7416 31.7074 36.6667 31.8719 36.6667 32.0516V67.9487C36.6667 68.1284 36.7416 68.2929 36.8913 68.4422C37.0407 68.592 37.2052 68.6668 37.3848 68.6668H50.0968C50.5927 68.6668 51.0084 68.8346 51.344 69.1702C51.6792 69.5059 51.8468 69.9216 51.8468 70.4174C51.8468 70.9136 51.6792 71.3292 51.344 71.664C51.0084 71.9992 50.5927 72.1668 50.0968 72.1668H37.3848ZM63.8588 50.8081C66.7728 50.8081 69.2512 51.8297 71.294 53.8729C73.3372 55.9157 74.3588 58.3941 74.3588 61.3081C74.3588 64.2216 73.3372 66.7 71.294 68.7432C69.2512 70.7861 66.7728 71.8075 63.8588 71.8075C60.9453 71.8075 58.4669 70.7861 56.4237 68.7432C54.3804 66.7 53.3588 64.2216 53.3588 61.3081C53.3588 58.3941 54.3804 55.9157 56.4237 53.8729C58.4669 51.8297 60.9453 50.8081 63.8588 50.8081ZM63.8588 68.1284C64.2489 68.1284 64.5767 67.9954 64.8423 67.7294C65.1079 67.4638 65.2407 67.1362 65.2407 66.7465C65.2407 66.3564 65.1079 66.0286 64.8423 65.763C64.5767 65.497 64.2489 65.364 63.8588 65.364C63.4692 65.364 63.1413 65.497 62.8753 65.763C62.6097 66.0286 62.4769 66.3564 62.4769 66.7465C62.4769 67.1362 62.6097 67.4638 62.8753 67.7294C63.1413 67.9954 63.4692 68.1284 63.8588 68.1284ZM63.8588 54.3973C63.1258 54.3973 62.4505 54.5821 61.8329 54.9515C61.2154 55.3209 60.7121 55.8244 60.3232 56.4617C60.1825 56.6799 60.1657 56.9027 60.2731 57.1302C60.3804 57.3574 60.5591 57.5232 60.8092 57.6278C61.0234 57.7328 61.2436 57.7383 61.4695 57.6442C61.6954 57.5497 61.8907 57.4052 62.0552 57.2107C62.2644 56.9237 62.524 56.6912 62.8339 56.5131C63.1439 56.3354 63.4847 56.2465 63.8565 56.2465C64.3936 56.2465 64.8544 56.4229 65.239 56.7756C65.6232 57.1287 65.8153 57.5621 65.8153 58.0758C65.8153 58.5102 65.6913 58.8808 65.4432 59.1877C65.1947 59.4941 64.9149 59.8029 64.6037 60.114C64.3704 60.3473 64.1349 60.5845 63.8973 60.8257C63.6593 61.0664 63.4431 61.3347 63.2487 61.6307C63.1172 61.8492 63.026 62.0849 62.9751 62.3377C62.9241 62.5904 62.8987 62.8463 62.8987 63.1053C62.8987 63.4386 62.9846 63.7398 63.1565 64.0089C63.3288 64.2784 63.5592 64.4132 63.8477 64.4132C64.1363 64.4132 64.3704 64.3054 64.5501 64.09C64.7294 63.8745 64.819 63.6231 64.819 63.3357C64.819 62.9154 64.9357 62.5424 65.169 62.2169C65.4023 61.8918 65.6746 61.5762 65.9857 61.2702C66.4523 60.8494 66.8607 60.3718 67.2107 59.8375C67.5607 59.3032 67.7357 58.7192 67.7357 58.0857C67.7357 57.0486 67.3557 56.1746 66.5958 55.4637C65.8356 54.7528 64.9232 54.3973 63.8588 54.3973Z"
						fill="#0369A1"
					/>
				</g>
			</svg>

			<h1 class="mt-4 text-3xl font-bold text-gray-800">Create your first question</h1>
			<p class="mt-4 text-gray-400">
				Click on the button to create questions to be uploaded in the test template and tests
			</p>
			<div class="mt-4">
				<a href="/questionbank/single-question/new"
					><Button
						variant="outline"
						class="mr-4 h-12 cursor-pointer hover:bg-[#0369A1] hover:text-white"
						><Plus /> Create a Question</Button
					></a
				>
				<a href="/questionbank/import"
					><Button
						variant="outline"
						class="mr-4 h-12 cursor-pointer hover:bg-[#0369A1] hover:text-white"
					>
						<FileUp />Bulk Upload
					</Button></a
				>
			</div>
		</WhiteEmptyBox>
	{:else}
		<div class="mx-8 mt-10 flex flex-col gap-8 sm:w-[80%]">
			<div class="flex flex-row gap-2">
				<div class="w-1/5">
					<!-- <TagsSelection /> -->
				</div>
				<div class="w-1/5">
					<!-- <StateSelection /> -->
				</div>
				<div class="ml-auto w-1/5">
					<Input type="search" disabled placeholder="Search by question name, tags, or ID" />
				</div>
			</div>
			<div>
				<Table.Root>
					<Table.Header>
						<Table.Row
							class=" bg-primary-foreground my-2 flex items-center rounded-lg font-bold  text-black"
						>
							<Table.Head class="flex w-1/12 items-center">No.</Table.Head>
							<Table.Head class="flex w-5/12 items-center">Question</Table.Head>
							<Table.Head class="flex w-3/12 items-center">Tags</Table.Head>
							<Table.Head class="flex w-2/12 items-center">Updated</Table.Head>
							<Table.Head class="flex w-1/12 items-center"></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.questions as question, index (question.id)}
							<Table.Row
								onclick={() => {
									currentRow = currentRow === index ? null : index;
								}}
								class={[
									'mt-2 flex cursor-pointer  items-center rounded-lg border  border-gray-200  bg-white font-medium',
									currentRow === index ? 'rounded-b-none border-b-0' : ''
								]}
							>
								<Table.Cell class="w-1/12  items-center">{index + 1}</Table.Cell>
								<Table.Cell class="w-5/12  items-center">{question.question_text}</Table.Cell>
								<Table.Cell class="w-3/12  items-center">
									{#if question.tags && question.tags.length > 0}
										{question.tags.map((tag: { name: string }) => tag.name).join(', ')}
									{:else}
										None
									{/if}
								</Table.Cell>
								<Table.Cell class="w-2/12  items-center">
									{#if question.modified_date}
										{new Date(question.modified_date).toLocaleDateString('en-US', {
											day: 'numeric',
											month: 'short',
											year: 'numeric'
										})}
										{new Date(question.modified_date).toLocaleTimeString('en-US', {
											hour: 'numeric',
											minute: '2-digit',
											hour12: true
										})}
									{/if}
								</Table.Cell>
								<Table.Cell class="w-1/12  items-center">
									<DropdownMenu.Root>
										<DropdownMenu.Trigger class={buttonVariants({ variant: 'ghost' })}
											><Ellipsis /></DropdownMenu.Trigger
										>
										<DropdownMenu.Content class="w-56">
											<DropdownMenu.Group>
												<a href="/questionbank/single-question/{question.id}">
													<DropdownMenu.Item>
														<Pencil />
														<span>Edit</span>
													</DropdownMenu.Item>
												</a>
												<form
													action="/questionbank/single-question/{question.id}?/delete"
													method="POST"
												>
													<button type="submit" class="w-full text-left"
														><DropdownMenu.Item>
															<Trash_2 />
															Delete
														</DropdownMenu.Item>
													</button>
												</form>
											</DropdownMenu.Group>
										</DropdownMenu.Content>
									</DropdownMenu.Root>
								</Table.Cell>
							</Table.Row>

							<Table.Row
								class="h fade-in mb-2  flex items-center rounded-lg  rounded-t-none border border-t-0  border-gray-200 bg-white font-medium "
								hidden={currentRow !== index}
								><Table.Cell class="w-12/12 ">
									<div class="flex h-fit flex-col border-t pt-4">
										{#each question.options as option (option.id)}
											<div class="my-auto flex">
												<span class="bg-primary-foreground m-2 rounded-sm p-3">{option.key}</span>
												<p class="my-auto">{option.value}</p>
												{#if question.correct_answer.includes(option.id)}
													<CircleCheck class="text-primary my-auto ml-4 w-4" />
												{/if}
											</div>
										{/each}
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	{/if}
</div>
