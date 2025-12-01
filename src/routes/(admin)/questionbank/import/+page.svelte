<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Table from '$lib/components/ui/table';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Download from '@lucide/svelte/icons/download';
	import Info from '@lucide/svelte/icons/info';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import X from '@lucide/svelte/icons/x';
	import { fileProxy, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { schema } from './schema.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import BulkTemplate from '$lib/components/Bulk-Upload-Question-Template.csv?url';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import TooltipInfo from '$lib/components/TooltipInfo.svelte';
	import CsvImport from '$lib/icons/CsvImport.svelte';
	import CsvLogo from '$lib/icons/CsvLogo.svelte';

	let { data } = $props();
	const { form, enhance, submit, message } = superForm(data.form, {
		validators: zodClient(schema),
		dataType: 'json',
		onSubmit: () => {
			$form.user_id = data.user.id;
		}
	});

	const file = fileProxy(form, 'file');
</script>

<Dialog.Root open={$message}>
	<Dialog.Content class="text-sm sm:max-w-[512px]">
		<Dialog.Header>
			<Dialog.Title class="mb-4 inline-flex items-center gap-2 text-xl font-semibold">
				{#if $message.failed_questions}
					<TriangleAlert color="#C7584A" size={28} />
					Import error(s)
				{:else}
					<CircleCheck color="#1E8F36" size={28} />
					File upload successful
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{$message.message}
			</Dialog.Description>
		</Dialog.Header>
		<p class="text-muted-foreground mt-2 font-semibold">Upload summary</p>
		<Table.Root class="rounded-lg bg-blue-50">
			{#if $message.failed_questions}
				<Table.Caption class="text-left">
					Download the error report to fix the row-specific issues and re-upload the file after
					fixing the errors.
				</Table.Caption>
			{/if}
			<Table.Body>
				<Table.Row>
					<Table.Cell class="font-medium">Total Rows</Table.Cell>
					<Table.Cell>
						{$message.uploaded_questions}
					</Table.Cell>
				</Table.Row>
				<Table.Row>
					<Table.Cell class="font-medium">Validated Rows</Table.Cell>
					<Table.Cell>
						{$message.success_questions}
					</Table.Cell>
				</Table.Row>
				<Table.Row>
					<Table.Cell class="font-medium">Errors</Table.Cell>
					<Table.Cell>
						{$message.failed_questions}
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>

		{#if $message.error_log?.startsWith('data:text/csv;base64')}
			<div class="mt-5 flex w-full items-center">
				<a
					href={$message.error_log}
					class="text-primary w-full font-medium"
					download="error_report.csv"
				>
					<Button class="w-full cursor-pointer py-2 text-base font-semibold"
						><Download />Download error report</Button
					>
				</a>
			</div>
		{:else}
			<div class="mt-5 w-full font-semibold">
				<div class="float-end">
					<Dialog.Close>
						<Button class="bg-primary-foreground text-primary mr-2">Upload more</Button>
					</Dialog.Close>
					<a href="/questionbank" class="bg-primary rounded-md px-5 py-2 text-white"
						>Go to question bank</a
					>
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
<div class="mx-10 flex flex-col gap-20">
	<div class="mt-10 flex flex-row">
		<div class="align-left flex flex-col">
			<span class="flex flex-row">
				<h2
					class="mr-2 w-fit scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
				>
					Import questions
				</h2>
				<TooltipInfo
					label="Help: Question Bank"
					description="Upload a CSV file containing questions. Make sure to follow the template format. After uploading, you will see a summary and can download an error report if there are issues."
				/>
			</span>
			<Label class="my-auto align-middle text-sm font-extralight"
				>Upload a .csv file to import questions to your question bank</Label
			>
		</div>
		<div class="ml-auto">
			<Button variant="outline" class="text-primary border-primary cursor-pointer bg-transparent"
				><a href={BulkTemplate} download="template.csv">Download Template</a></Button
			>
		</div>
	</div>

	<div class="flex flex-row justify-between">
		<div class="mr-4 h-fit w-1/4 rounded-xl bg-white p-6 shadow-lg">
			<p class="mb-4 text-2xl font-semibold" style="color:#0369A1">Instructions</p>
			<ol class="list-inside list-decimal text-sm" style="color: #525252;">
				<li class="mb-4">
					Download the CSV template or upload your own with appropriate tags & details.
				</li>
				<li class="mb-4">
					Add questions as per the template provided with all tags included & upload the .csv files.
				</li>
				<li class="mb-4">
					You can edit and update the imported questions after uploading the .csv files.
				</li>
			</ol>
		</div>
		<div class="w-3/4 bg-white shadow-lg">
			<form method="POST" enctype="multipart/form-data" use:enhance>
				<input type="file" hidden name="file" bind:files={$file} accept=".csv" />

				<div class="flex flex-col px-6">
					<div
						class="my-6 cursor-pointer items-center rounded-xl border-2 border-dotted border-blue-400 py-6 text-center"
						onclick={() => document.querySelector('input[type=file]').click()}
						onkeydown={(e) =>
							e.key === 'Enter' && document.querySelector('input[type=file]').click()}
						role="button"
						tabindex="0"
					>
						<div class="flex items-center justify-center text-center">
							<CsvImport />
						</div>

						<p class="text-lg font-bold text-blue-400" style="color:#0369A1">
							Click to upload Questions
						</p>
						<p class="text-sm text-gray-400">CSV | File size limit: 20MB</p>
					</div>
					{#if $form.file}
						<div class="flex flex-row gap-2 bg-[#F0F9FF] p-4">
							<CsvLogo />
							<div class="my-auto flex-row">
								<p class="font-bold">{$form.file?.name}</p>
								<p class="text-sm font-light">
									{#if $form.file?.size}
										{$form.file.size < 1024 * 1024
											? `${($form.file.size / 1024).toFixed(2)} KB`
											: `${($form.file.size / (1024 * 1024)).toFixed(2)} MB`}
									{/if}
								</p>
							</div>
							<X
								class="my-auto ml-auto cursor-pointer rounded-full bg-gray-100 p-1"
								onclick={() => {
									$file = undefined;
								}}
							/>
						</div>
					{/if}
					<div class="m-4 ml-auto space-x-3">
						<Button
							variant="outline"
							onclick={() => {
								$file = undefined;
							}}>Discard</Button
						>
						<Button
							disabled={!$form.file}
							onclick={() => {
								submit();
							}}>Import</Button
						>
					</div>
				</div>
			</form>
		</div>
	</div>
</div>
