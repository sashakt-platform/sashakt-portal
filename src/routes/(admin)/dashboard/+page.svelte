<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Info from '@lucide/svelte/icons/info';

	let { data } = $props();

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

{#snippet dataBox(title: string, description: string, count: number)}
	<div class="m-4 w-full rounded-xl border border-gray-100 bg-white p-4">
		<p class="font-semibold">{title}</p>
		<p class="text-sm">{description}</p>
		<div class="p-12 text-5xl">{count}</div>
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

<div class="m-4 flex flex-col gap-6">
	<div class="flex flex-row">
		{#each stats_box as stat}
			{@render dataBox(stat.title, stat.description, stat.count)}
		{/each}
	</div>
	<div class="m-4 flex flex-col rounded-xl bg-white p-4">
		<div class="flex flex-row">
			<div class="my-auto flex w-1/2 flex-col">
				<p class="font-semibold">Test Attempt Details</p>
				<p class="text-sm">Details of the Attempts made by the candidate</p>
			</div>
			<div class="flex w-1/2 flex-row gap-8 rounded-lg p-4">
				<p class="my-auto">Select Date of Range</p>
				<div class="mx-auto flex flex-row gap-8 align-middle">
					<div class="flex w-1/2 flex-col gap-1">
						<Label for="dateStart" class="my-auto w-fit font-extralight whitespace-nowrap"
							>Start Time</Label
						>
						<Input type="date" id="dateStart" name="start_time" />
					</div>
					<div class="flex w-1/2 flex-col gap-1">
						<Label for="dateEnd" class="my-auto w-fit font-extralight whitespace-nowrap"
							>End Time</Label
						>
						<Input type="date" id="dateEnd" name="end_time" />
					</div>
				</div>
			</div>
		</div>
		<hr class="my-4 border-gray-100" />
		<div class="flex flex-row">
			{@render dataBox(
				'Submitted Test Attempts',
				'Total Test Attempts  submitted by the candidates',
				data.testAttemptStats?.total_test_submitted
			)}
			{@render dataBox(
				'Non-Submitted Test Attempts',
				'Total Test Attempts non-submitted by the candidates',
				data.testAttemptStats?.total_test_not_submitted
			)}
			{@render dataBox(
				'Active Test Attempts',
				'Non-Submitted Test Attempts which are currently active',
				data.testAttemptStats?.not_submitted_active
			)}
			{@render dataBox(
				'Inactive Test Attempts',
				'Non-Submitted Test Attempts which are now inactive',
				data.testAttemptStats?.not_submitted_inactive
			)}
		</div>
	</div>
</div>
