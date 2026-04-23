<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	let {
		open = $bindable(false),
		testId
	}: {
		open: boolean;
		testId: string | null;
	} = $props();

	interface ReportData {
		total_test_submitted: number;
		total_test_not_submitted: number;
		not_submitted_active: number;
		not_submitted_inactive: number;
	}

	let reportData = $state<ReportData | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		if (open && testId) {
			loading = true;
			error = null;
			reportData = null;

			fetch(`/api/test-report?test_id=${encodeURIComponent(testId)}`)
				.then((res) => {
					if (!res.ok) throw new Error('Failed to load report');
					return res.json();
				})
				.then((data) => {
					reportData = data;
				})
				.catch((err) => {
					console.error('Failed to fetch test report:', err);
					error = 'Failed to load report. Please try again.';
				})
				.finally(() => {
					loading = false;
				});
		}
	});

	const total = $derived(
		reportData
			? reportData.total_test_submitted + reportData.total_test_not_submitted
			: 0
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Test Report</Dialog.Title>
		</Dialog.Header>
		<hr class="border-border" />

		<div class="flex flex-col gap-2">
			{#if loading}
				<div class="flex flex-col gap-2">
					{#each [1, 2, 3] as _}
						<div class="bg-muted h-12 animate-pulse rounded-lg"></div>
					{/each}
				</div>
			{:else if error}
				<p class="text-destructive text-sm">{error}</p>
			{:else if reportData}
				<div
					class="flex items-center justify-between rounded-lg px-4 py-3"
					style="background: hsla(0, 0%, 94%, 1)"
				>
					<div class="flex items-center gap-2">
						<span class="inline-block h-2.5 w-2.5 rounded-full bg-blue-500"></span>
						<span class="text-sm font-medium">Total</span>
					</div>
					<span class="text-sm font-bold">{total} tests</span>
				</div>

				<div
					class="flex items-center justify-between rounded-lg px-4 py-3"
					style="background: hsla(0, 0%, 94%, 1)"
				>
					<div class="flex items-center gap-2">
						<span class="inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
						<span class="text-sm font-medium">Submitted</span>
					</div>
					<span class="text-sm font-bold">{reportData.total_test_submitted} tests</span>
				</div>

				<div class="rounded-lg px-4 py-3" style="background: hsla(0, 0%, 94%, 1)">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="inline-block h-2.5 w-2.5 rounded-full bg-orange-400"></span>
							<span class="text-sm font-medium">Not submitted</span>
						</div>
						<span class="text-sm font-bold">{reportData.total_test_not_submitted} tests</span>
					</div>
					<hr class="border-border mt-3" />
					<div class="mt-2 flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2 pl-4">
								<span class="inline-block h-2 w-2 rounded-full bg-orange-400"></span>
								<span class="text-muted-foreground text-sm">Active</span>
							</div>
							<span class="text-muted-foreground text-sm font-semibold">{reportData.not_submitted_active} tests</span>
						</div>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2 pl-4">
								<span class="inline-block h-2 w-2 rounded-full bg-orange-400"></span>
								<span class="text-muted-foreground text-sm">Inactive</span>
							</div>
							<span class="text-muted-foreground text-sm font-semibold">{reportData.not_submitted_inactive} tests</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
