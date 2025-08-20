<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import Info from '@lucide/svelte/icons/info';

	import Applyform from './Applyform.svelte';

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
	<div class="mt-4 ml-10 flex w-3/4 flex-row">
		{#each stats_box as stat}
			<div
				class="animate-fadeIn m-4 w-1/3 rounded-xl bg-white p-4 shadow-lg hover:scale-105 hover:shadow-2xl hover:shadow-2xl"
			>
				<p class="mb-2 border-b pb-2 font-semibold">{stat.title}</p>
				<p class="text-sm">{stat.description}</p>
				<div class="p-12 text-5xl font-semibold">{stat.count}</div>
			</div>
		{/each}
	</div>

	<Applyform {data} />
</div>
