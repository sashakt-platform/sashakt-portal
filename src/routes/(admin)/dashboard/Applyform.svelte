<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { basedateSchema, type FormSchema } from './schema';

	let { data }: { data: any } = $props();
	type SummaryItem = { title: string; description: string; count: number };

	let test_summary_box = $state<SummaryItem[]>([]);

	let userData: Partial<Infer<FormSchema>> | null = data?.user || null;

	const form = superForm(userData || data.form, {
		validators: zodClient(basedateSchema)
	});

	const { form: formData, enhance } = form;

	$effect(() => {
		test_summary_box = [
			{
				title: ' Tests Submitted',
				description: 'Number of tests submitted by candidates',
				count: data?.summary?.total_test_submitted
			},
			{
				title: ' Tests Not Submitted',
				description: 'Number of tests not submitted by candidates',
				count: data?.summary?.total_test_not_submitted
			},
			{
				title: ' Active',
				description: 'Tests not submitted but still active',
				count: data?.summary?.not_submitted_active
			},
			{
				title: 'Inactive',
				description: 'Tests not submitted and inactive',
				count: data?.summary?.not_submitted_inactive
			}
		];
	});
</script>

<div class="mt-10 flex w-full justify-center">
	<div class="w-full max-w-7xl rounded-xl bg-white p-6">
		<div class="m-4 flex items-start justify-between">
			<div>
				<h2 class=" text-2xl font-bold">Test Attempt Details</h2>
				<p class="text-sm text-gray-600">Details of the Attempts made by Candidates</p>
			</div>

			<div class="mt-4 flex flex-col items-start md:mt-0 md:items-center">
				<h3 class="mb-2 text-sm font-semibold text-gray-700">Select Date Range</h3>
				<form method="POST" use:enhance action="?/applyFilter" class="flex flex-col gap-4">
					<div class="flex flex-col md:flex-row">
						<Form.Field {form} name="start_date">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label class="flex items-center justify-center">From</Form.Label>
									<Input {...props} type="date" bind:value={$formData.start_date} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
						<Form.Field {form} name="end_date">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label class="flex items-center justify-center">To</Form.Label>
									<Input {...props} type="date" bind:value={$formData.end_date} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>

					<div class="flex justify-center">
						<Form.Button class="px-4">Apply Filter</Form.Button>
					</div>
				</form>
			</div>
		</div>

		<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each test_summary_box as stat}
				<div class="flex flex-col justify-between rounded-lg border p-6 text-center">
					<p class="text-base font-semibold">{stat.title}</p>
					<p class="text-4xl">{stat.count}</p>
				</div>
			{/each}
		</div>
	</div>
</div>
