<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Download from '@lucide/svelte/icons/download';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Upload from '@lucide/svelte/icons/upload';
	import X from '@lucide/svelte/icons/x';
	import { fileProxy, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { schema } from './schema.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import BulkTemplate from '$lib/components/Bulk-Upload-Question-Template.csv?url';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { resolve } from '$app/paths';

	let { data } = $props();
	const { form, enhance, submit, message } = superForm(data.form, {
		validators: zod4Client(schema),
		dataType: 'json',
		onSubmit: () => {
			$form.user_id = data.user.id;
		}
	});

	const file = fileProxy(form, 'file');

	let dragging = $state(false);

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const droppedFiles = e.dataTransfer?.files;
		if (droppedFiles?.length) {
			const input = document.querySelector('input[type=file]') as HTMLInputElement;
			if (input) {
				input.files = droppedFiles;
				input.dispatchEvent(new Event('change', { bubbles: true }));
			}
		}
	}
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
		<Table.Root class="bg-accent rounded-lg">
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
					<a href={resolve('/questionbank')} class="bg-primary rounded-md px-5 py-2 text-white"
						>Go to question bank</a
					>
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
<div class="mx-4 sm:mx-6 md:mx-10">
	<!-- Header -->
	<div class="mt-6 mb-6 flex items-center gap-3 sm:mt-10">
		<a href={resolve('/questionbank')} class="text-foreground hover:text-foreground/80">
			<ArrowLeft size={24} />
		</a>
		<h2 class="text-2xl font-bold tracking-tight sm:text-3xl">Bulk Upload Questions</h2>
	</div>

	<!-- Outer card container -->
	<div class="border-border rounded-xl border border-dashed p-4 sm:p-6">
		<!-- Template download banner -->
		<div
			class="bg-accent mb-6 flex flex-col items-start gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6"
		>
			<div>
				<p class="text-base font-semibold">Download the template to get started</p>
				<p class="text-muted-foreground text-sm">
					Use our template to ensure your data is formatted correctly for upload.
				</p>
			</div>
			<a href={BulkTemplate} download="template.csv">
				<Button variant="outline" class="border-primary text-primary cursor-pointer bg-transparent">
					<Download size={16} />
					Download Template
				</Button>
			</a>
		</div>

		<!-- Upload zone -->
		<form method="POST" enctype="multipart/form-data" use:enhance>
			<input type="file" hidden name="file" bind:files={$file} accept=".csv" />

			<div
				class="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center {dragging
					? 'border-primary bg-accent'
					: 'border-border'}"
				ondragover={(e) => {
					e.preventDefault();
					dragging = true;
				}}
				ondragleave={() => (dragging = false)}
				ondrop={handleDrop}
			>
				{#if $form.file}
					<div class="flex w-full max-w-md flex-col items-center gap-4">
						<div class="bg-accent flex w-full flex-row items-center gap-2 rounded-lg p-4">
							<div class="flex-1 text-left">
								<p class="font-bold">{$form.file?.name}</p>
								<p class="text-muted-foreground text-sm">
									{#if $form.file?.size}
										{$form.file.size < 1024 * 1024
											? `${($form.file.size / 1024).toFixed(2)} KB`
											: `${($form.file.size / (1024 * 1024)).toFixed(2)} MB`}
									{/if}
								</p>
							</div>
							<X
								class="bg-muted cursor-pointer rounded-full p-1"
								onclick={() => {
									$file = undefined;
								}}
							/>
						</div>
						<div class="flex gap-3">
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
				{:else}
					<div
						class="flex cursor-pointer flex-col items-center"
						onclick={() =>
							(document.querySelector('input[type=file]') as HTMLInputElement)?.click()}
						onkeydown={(e) =>
							e.key === 'Enter' &&
							(document.querySelector('input[type=file]') as HTMLInputElement)?.click()}
						role="button"
						tabindex="0"
					>
						<div class="bg-primary mb-4 flex h-14 w-14 items-center justify-center rounded-full">
							<Upload class="text-primary-foreground" size={24} />
						</div>

						<p class="text-foreground text-base">
							Drag and drop your file here, or <span class="text-primary font-semibold">browse</span
							>
						</p>
						<p class="text-muted-foreground mt-1 text-sm">Supports CSV (max 20 MB)</p>
					</div>
				{/if}
			</div>
		</form>
	</div>
</div>
