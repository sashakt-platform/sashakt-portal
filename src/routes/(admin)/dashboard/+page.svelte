<script lang="ts">
	import type { Component } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { type Filter } from '$lib/types/filters.js';
	import TooltipInfo from '$lib/components/data-table/TooltipInfo.svelte';

	// lazy-loaded components
	let DistrictSelection: Component | null = $state(null);
	let StateSelection: Component | null = $state(null);
	let TagTypeSelection: Component | null = $state(null);

	// state for dashboard data
	let dashboardStats = $state({
		total_questions: 0,
		total_tests: 0,
		total_users: 0
	});

	let testAttemptStats = $state({
		total_test_submitted: 0,
		total_test_not_submitted: 0,
		not_submitted_active: 0,
		not_submitted_inactive: 0
	});

	let overallAnalyticsStats = $state({
		overall_score_percent: 0,
		overall_avg_time_minutes: 0
	});

	// loading states
	let isLoadingStats = $state(true);
	let isLoadingTestStats = $state(true);
	let isLoadingAnalytics = $state(true);
	let areFiltersLoaded = $state(false);

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

	const stats_box = $derived([
		{
			title: 'No of Questions',
			count: dashboardStats.total_questions
		},
		{
			title: 'No of Tests',
			count: dashboardStats.total_tests
		},
		{
			title: 'No of Users',
			count: dashboardStats.total_users
		}
	]);

	// load basic stats first
	async function loadDashboardStats() {
		try {
			const response = await fetch('/api/dashboard/stats');
			if (response.ok) {
				const stats = await response.json();
				dashboardStats = stats;
			}
		} catch (error) {
			console.error('Failed to load dashboard stats:', error);
		} finally {
			isLoadingStats = false;
		}
	}

	// load test attempt stats
	async function loadTestAttemptStats() {
		try {
			const response = await fetch('/api/dashboard/test-attempts');
			if (response.ok) {
				const stats = await response.json();
				testAttemptStats = stats;
			}
		} catch (error) {
			console.error('Failed to load test attempt stats:', error);
		} finally {
			isLoadingTestStats = false;
		}
	}

	// load analytics stats with optional filters
	async function loadAnalyticsStats(filters?: {
		states?: Filter[];
		districts?: Filter[];
		tagTypes?: Filter[];
	}) {
		try {
			isLoadingAnalytics = true;
			const queryParts: string[] = [];

			// Add state filters
			if (filters?.states?.length) {
				filters.states.forEach((state) =>
					queryParts.push(`state_ids=${encodeURIComponent(String(state.id))}`)
				);
			}

			// Add district filters
			if (filters?.districts?.length) {
				filters.districts.forEach((district) =>
					queryParts.push(`district_ids=${encodeURIComponent(String(district.id))}`)
				);
			}

			// Add tag type filters
			if (filters?.tagTypes?.length) {
				filters.tagTypes.forEach((tagType) =>
					queryParts.push(`tag_type_ids=${encodeURIComponent(String(tagType.id))}`)
				);
			}

			const queryString = queryParts.join('&');
			const url = queryString
				? `/api/dashboard/analytics?${queryString}`
				: '/api/dashboard/analytics';

			const response = await fetch(url);
			if (response.ok) {
				const stats = await response.json();
				overallAnalyticsStats = stats;
			}
		} catch (error) {
			console.error('Failed to load analytics stats:', error);
		} finally {
			isLoadingAnalytics = false;
		}
	}

	// lazy load filter components only when analytics section is visible
	async function loadFilterComponents() {
		if (areFiltersLoaded) return;

		try {
			const [districtModule, stateModule, tagTypeModule] = await Promise.all([
				import('$lib/components/DistrictSelection.svelte'),
				import('$lib/components/StateSelection.svelte'),
				import('$lib/components/TagTypeSelection.svelte')
			]);

			DistrictSelection = districtModule.default;
			StateSelection = stateModule.default;
			TagTypeSelection = tagTypeModule.default;
			areFiltersLoaded = true;
		} catch (error) {
			console.error('Failed to load filter components:', error);
		}
	}

	// initial load effect
	$effect(() => {
		(async () => {
			await loadDashboardStats();
			await loadTestAttemptStats();
		})();
	});
</script>

{#snippet dataBox(
	title: string,
	description: string,
	count: number,
	percent: boolean = false,
	loading: boolean = false
)}
	<div class="w-full justify-items-center rounded-xl border border-gray-100 bg-white p-4">
		<p class="font-semibold">{title}</p>
		<p class="text-sm">{description}</p>
		{#if loading}
			<div class="p-12 text-5xl">
				<div class="h-12 w-24 animate-pulse rounded bg-gray-200"></div>
			</div>
		{:else}
			<div class="p-12 text-5xl">{count}{percent ? '%' : ''}</div>
		{/if}
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

<div class="mt-6 ml-4 flex items-center align-middle sm:mt-10 sm:ml-10">
	<span class="flex flex-row">
		<h2
			class="mr-2 w-fit scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 sm:text-3xl"
		>
			Dashboard
		</h2>
		<TooltipInfo
			label="Help: Dashboard"
			description="Dashboard provides a quick overview of your organization's activity. Shows how many candidates have successfully submitted their tests, and from the non-submitted group, how many are still active versus inactive."
		/>
	</span>
</div>

<div class="mx-4 my-4 flex flex-col gap-6 sm:mx-8">
	<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
		{#each stats_box as stat (stat.title)}
			{@render dataBox(stat.title, '', stat.count, false, isLoadingStats)}
		{/each}
	</div>
	<div class="flex flex-col rounded-xl bg-white p-4">
		<div class="mb-4">
			<p class="font-semibold">Summary of Test Attempts</p>
		</div>
		<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
			{@render dataBox(
				'Submitted',
				'',
				testAttemptStats.total_test_submitted,
				false,
				isLoadingTestStats
			)}
			{@render dataBox(
				'Non-Submitted',
				'',
				testAttemptStats.total_test_not_submitted,
				false,
				isLoadingTestStats
			)}
			{@render dataBox(
				'Active',
				'',
				testAttemptStats.not_submitted_active,
				false,
				isLoadingTestStats
			)}
			{@render dataBox(
				'Inactive',
				'',
				testAttemptStats.not_submitted_inactive,
				false,
				isLoadingTestStats
			)}
		</div>
	</div>
</div>
