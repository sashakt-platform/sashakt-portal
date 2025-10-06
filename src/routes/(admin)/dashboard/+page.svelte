<script lang="ts">
	import DistrictSelection from '$lib/components/DistrictSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import TagTypeSelection from '$lib/components/TagTypeSelection.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { type Filter } from '$lib/types/filters.js';
	import Info from '@lucide/svelte/icons/info';

	let { data } = $props();

	let filteredStates: Filter[] = $state([]);
	let filteredTagtypes: Filter[] = $state([]);
	let filteredDistricts: Filter[] = $state([]);

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
			title: 'No of Questions',
			count: data?.stats?.total_questions
		},
		{
			title: 'No of Tests',
			count: data?.stats?.total_tests
		},
		{
			title: 'No of Users',
			count: data?.stats?.total_users
		}
	];
</script>

{#snippet dataBox(title: string, description: string, count: number, percent: boolean = false)}
	<div class=" m-4 w-full justify-items-center rounded-xl border border-gray-100 bg-white p-4">
		<p class="font-semibold">{title}</p>
		<p class="text-sm">{description}</p>
		<div class="p-12 text-5xl">{count}{percent ? '%' : ''}</div>
	</div>
{/snippet}

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

<div class="mx-8 my-4 flex flex-col gap-6">
	<div class="flex flex-row">
		{#each stats_box as stat (stat.title)}
			{@render dataBox(stat.title, '', stat.count)}
		{/each}
	</div>
	<div class="flex flex-col rounded-xl bg-white p-4">
		<div class="flex flex-row">
			<div class="my-auto flex w-1/2 flex-col">
				<p class="font-semibold">Summary of Test Attempts</p>
				<!-- <p class="text-sm">Details of the attempts made by the candidate</p> -->
			</div>
		</div>
		<!-- <hr class="my-4 border-gray-300" /> -->
		<div class="flex flex-row">
			{@render dataBox('Submitted', '', data.testAttemptStats?.total_test_submitted)}
			{@render dataBox('Non-Submitted', '', data.testAttemptStats?.total_test_not_submitted)}
			{@render dataBox('Active', '', data.testAttemptStats?.not_submitted_active)}
			{@render dataBox('Inactive', '', data.testAttemptStats?.not_submitted_inactive)}
		</div>
	</div>
	<div class="flex flex-row justify-between">
		<div class=" flex-1 rounded-xl bg-white p-4">
			<div class="flex flex-row gap-8">
				<div class="flex w-3/4 flex-col">
					<p class="font-semibold">Score & Duration Analysis</p>
					<!-- <p class="text-sm">Overall performance of all candidates</p> -->
				</div>
				<div class="w-1/3">
					<StateSelection bind:states={filteredStates} filteration={true} />
				</div>
				<div class="w-1/3">
					<DistrictSelection bind:districts={filteredDistricts} selectedStates={filteredStates} filteration={true} />
				</div>
				<div class="w-1/3">
					<TagTypeSelection bind:tagTypes={filteredTagtypes} filteration={true} />
				</div>
			</div>
			<!-- <hr class="my-4 border-gray-300" /> -->

			<div class=" flex flex-row gap-8">
				<div class="item-center flex w-1/2 flex-col items-center p-2">
					{@render dataBox(
						'Percentage Scored',
						'',
						data.overallAnalyticsStats?.overall_score_percent,
						true
					)}
				</div>
				<div class=" flex w-1/2 flex-col items-center p-2">
					{@render dataBox(
						'Average Time Taken (Minutes)',
						'',
						data.overallAnalyticsStats?.overall_avg_time_minutes
					)}
				</div>
			</div>
		</div>
	</div>
</div>
