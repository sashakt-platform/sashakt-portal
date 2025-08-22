<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	import Info from '@lucide/svelte/icons/info';

	let { data } = $props();

	let filteredTags: string[] = $state([]);
	let filteredStates: string[] = $state([]);

	const information = [
		{
			title: 'Manage Question Banks',
			description:
				'Effortlessly create, edit, and organize question banks to keep everything at your fingertips.'
		},
		{
			title: 'Generate Test Templates',
			description:
				'Customize test templates to suit diverse requirements, ensuring consistency and ease of use.'
		},
		{
			title: 'Create and Assign Tests',
			description:
				'Build, schedule, and assign tests seamlessly to streamline the evaluation process.'
		},
		{
			title: 'Monitor Analytics',
			description:
				'Gain valuable insights through detailed analytics to track performance and progress.'
		},
		{
			title: 'User Management',
			description: 'Add, manage, and oversee user roles to ensure collaboration and control.'
		}
	];

	const stats_box = [
		{
			title: 'Total Questions',
			description: 'Total Questions created for the organization',
			count: data?.stats?.total_questions
		},
		{
			title: 'Tests',
			description: 'Total Tests created for the organization',
			count: data?.stats?.total_tests
		},
		{
			title: 'Users',
			description: 'Total Users created for the organization',
			count: data?.stats?.total_users
		}
	];
</script>

<Dialog.Root open={false}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Welcome to Sashakt!</Dialog.Title>
			<Dialog.Description>Here’s what all you can do</Dialog.Description>
		</Dialog.Header>
		<div class="w-full rounded-xl p-4" style="background:#F0F9FF">
			{#each information as item}
				<div class="mb-4">
					<p class="font-semibold">{item.title}</p>
					<p class="text-sm font-light">{item.description}</p>
				</div>
			{/each}
		</div>
		<Button style="background:#0369A1" class="cursor-pointer">Get Started</Button>
	</Dialog.Content>
</Dialog.Root>

<div class="mt-10 ml-10 flex items-center align-middle">
	<span class="flex flex-row">
		<h2
			class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
		>
			Dashboard
		</h2>
		<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
	</span>
</div>

<div>
	<div class="mt-4 ml-10 flex w-3/4 flex-row justify-between">
		{#each stats_box as stat}
			<div class="m-4 w-1/3 rounded-xl bg-white p-4">
				<p class="font-semibold">{stat.title}</p>
				<p class="text-sm">{stat.description}</p>
				<div class="p-12 text-5xl">{stat.count}</div>
			</div>
		{/each}
	</div>
	<!-- <div class="mt-4 ml-10 flex w-3/4 flex-row justify-between"> -->
	<!-- 	<div class="m-4 mb-10 h-1/2 w-1/2 rounded-xl bg-white p-4"> -->
	<!-- 		<div class="h-screen w-full"></div> -->
	<!-- 	</div> -->
	<!-- 	<div class="m-4 h-1/2 w-1/2 rounded-xl bg-white p-4"> -->
	<!-- 		<div class="h-screen w-full"></div> -->
	<!-- 	</div> -->
	<!-- </div> -->
</div>
<div class="m-10 flex w-1/2 flex-row justify-between">
	<div class=" flex-1 rounded-xl bg-white p-4">
		<p class="font-semibold">Score & Duration Analysis</p>
		<p class="text-sm">Overall average performance of all candidates</p>
		<div class="mt-5 flex flex-col justify-between gap-2 sm:flex-row">
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

		<div class="flex flex-row justify-between p-5">
			<div class="item-center ml-5 flex flex-col p-2">
				<p class="item-center text-lg font-medium">Avg. Score</p>
				<p class="text-5xl">{data?.performance?.overall_avg_score}%</p>
			</div>
			<div class="mr-10 flex flex-col p-2">
				<p class="text-lg font-medium">Avg. Duration</p>
				<p class="text-5xl">{data?.performance?.overall_avg_time_minutes}</p>
			</div>
		</div>
	</div>
</div>
