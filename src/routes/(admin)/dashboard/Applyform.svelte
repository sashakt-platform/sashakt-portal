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

<div class="m-4 mt-10 mr-10 ml-10 flex items-center justify-start gap-90">
	<div class="flex flex-col">
		<h2 class=" text-2xl font-bold">Test Attempt Details</h2>

		<p class=" text-sm text-gray-600">details of the attempts made by candidates</p>
	</div>

	<div class="m-4 mt-6 ml-10 flex flex-col items-center">
		<h3 class="mb-2 text-sm font-semibold text-gray-700">Select Date Range</h3>

		<div>
			<form method="POST" use:enhance action="?/applyFilter">
				<div class="flex gap-4">
					<Form.Field {form} name="start_date">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Start Date</Form.Label>
								<Input {...props} type="date" bind:value={$formData.start_date} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="end_date">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>End Date</Form.Label>
								<Input {...props} type="date" bind:value={$formData.end_date} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<div class="flex items-center justify-center">
					<Form.Button class="px-4">Apply Filter</Form.Button>
				</div>
			</form>
		</div>
	</div>
</div>
<div class="card m-4 mt-10 ml-10 flex w-full cursor-pointer">
	{#each test_summary_box as stat}
		<div
			class="m-4 w-1/4 rounded-xl bg-white p-4 hover:scale-105 hover:shadow-xl"
			style="flex: 0 0 20%;"
		>
			<div class="flex items-center gap-2 font-semibold">
				<p class="mb-2 border-b">{stat.title}</p>
			</div>
			<p class="text-sm">{stat.description}</p>
			<div class="p-12 text-5xl">{stat.count}</div>
		</div>
	{/each}
</div>
