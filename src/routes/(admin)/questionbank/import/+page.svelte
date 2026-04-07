<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Download from '@lucide/svelte/icons/download';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import Upload from '@lucide/svelte/icons/upload';
	import X from '@lucide/svelte/icons/x';
	import { fileProxy, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { schema } from './schema.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import BulkTemplate from '$lib/components/Bulk-Upload-Question-Template.csv?url';
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
	let dropError = $state('');
	let fileInput = $state<HTMLInputElement | null>(null);

	function clearFile() {
		$file = undefined;
		if (fileInput) fileInput.value = '';
	}

	const MAX_FILE_SIZE = 20 * 1024 * 1024;
	const MAX_FILE_SIZE_MB = MAX_FILE_SIZE / (1024 * 1024);

	function isValidCsv(file: File): boolean {
		return file.type === 'text/csv' || file.name.endsWith('.csv');
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		dropError = '';
		const droppedFiles = e.dataTransfer?.files;
		if (!droppedFiles?.length) return;

		const file = droppedFiles[0];

		if (!isValidCsv(file)) {
			dropError = 'Only CSV files are supported.';
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			dropError = `File size exceeds ${MAX_FILE_SIZE_MB} MB limit.`;
			return;
		}

		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(file);
		const input = document.querySelector('input[type=file]') as HTMLInputElement;
		if (input) {
			input.files = dataTransfer.files;
			input.dispatchEvent(new Event('change', { bubbles: true }));
		}
	}
</script>

<div class="mx-4 sm:mx-6 md:mx-10">
	<!-- Header -->
	<div class="mt-6 mb-6 flex items-center gap-3 sm:mt-10">
		<a href={resolve('/questionbank')} class="text-foreground hover:text-foreground/80">
			<ArrowLeft size={24} />
		</a>
		<h2 class="text-2xl font-bold tracking-tight sm:text-3xl">Bulk Upload Questions</h2>
	</div>

	<!-- Outer card container -->
	<div class="border-border bg-gray-0 rounded-xl border p-4 sm:p-6">
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
				<Button variant="outline" class="border-primary text-primary bg-gray-0 cursor-pointer">
					<Download size={16} />
					Download Template
				</Button>
			</a>
		</div>

		<!-- Upload zone -->
		<form method="POST" enctype="multipart/form-data" use:enhance>
			<input
				type="file"
				hidden
				name="file"
				bind:files={$file}
				bind:this={fileInput}
				accept=".csv"
			/>

			<div
				class="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-gray-50 p-6 text-center {dragging
					? 'border-primary bg-accent'
					: 'border-border'}"
				ondragover={(e) => {
					e.preventDefault();
					dragging = true;
				}}
				ondragleave={() => (dragging = false)}
				ondrop={handleDrop}
			>
				{#if $message}
					<!-- Result state (inline) -->
					<div class="flex w-full max-w-lg flex-col items-center gap-4">
						{#if $message.failed_questions}
							<div
								class="flex h-14 w-14 items-center justify-center rounded-full"
								style="background-color: hsl(var(--error-subtle));"
							>
								<CircleX class="text-destructive" size={28} />
							</div>
							<h3 class="text-xl font-bold">Bulk upload error</h3>
						{:else}
							<div
								class="flex h-14 w-14 items-center justify-center rounded-full"
								style="background-color: hsl(var(--success-subtle));"
							>
								<CircleCheck style="color: hsl(var(--success-bold));" size={28} />
							</div>
							<h3 class="text-xl font-bold">Bulk upload successful</h3>
						{/if}
						<p class="text-muted-foreground text-sm">{$message.message}</p>

						<!-- Upload Summary table -->
						<table class="w-full max-w-sm overflow-hidden rounded-lg border text-left text-sm">
							<thead>
								<tr class="bg-muted border-b">
									<th
										class="text-muted-foreground px-4 py-3 text-left text-sm font-semibold"
										colspan="2"
									>
										Upload Summary
									</th>
								</tr>
							</thead>
							<tbody>
								<tr class="border-b">
									<td class="px-4 py-3 font-medium">Total rows</td>
									<td class="px-4 py-3 text-right">{$message.uploaded_questions}</td>
								</tr>
								<tr class="border-b">
									<td class="px-4 py-3 font-medium">Validated rows</td>
									<td class="px-4 py-3 text-right">{$message.success_questions}</td>
								</tr>
								<tr>
									<td
										class="px-4 py-3 font-medium {$message.failed_questions
											? 'text-destructive'
											: ''}"
									>
										Errors
									</td>
									<td
										class="px-4 py-3 text-right {$message.failed_questions
											? 'text-destructive'
											: ''}"
									>
										{$message.failed_questions}
									</td>
								</tr>
							</tbody>
						</table>

						{#if $message.failed_questions}
							<div class="mt-2 flex gap-3">
								{#if $message.error_log?.startsWith('data:text/csv;base64')}
									<a href={$message.error_log} download="error_report.csv">
										<Button variant="outline" class="border-primary text-primary cursor-pointer">
											Download Error Report
										</Button>
									</a>
								{/if}
								<Button
									variant="destructive"
									onclick={() => {
										$message = undefined;
										clearFile();
									}}>Retry Upload</Button
								>
							</div>
						{:else}
							<div class="mt-2 flex gap-3">
								<Button
									variant="outline"
									class="border-primary text-primary"
									onclick={() => {
										$message = undefined;
										clearFile();
									}}>Upload More</Button
								>
								<a href={resolve('/questionbank')}>
									<Button>Go to Question Bank</Button>
								</a>
							</div>
						{/if}
					</div>
				{:else if $form.file}
					<!-- File selected state -->
					<div class="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border-1">
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
									clearFile();
								}}
							/>
						</div>
						<div class="flex gap-3 p-4">
							<Button
								variant="outline"
								onclick={() => {
									clearFile();
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
					<!-- Empty upload state -->
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
						<p class="text-muted-foreground mt-1 text-sm">
							Supports CSV (max {MAX_FILE_SIZE_MB} MB)
						</p>
						{#if dropError}
							<p class="text-destructive mt-2 text-sm">{dropError}</p>
						{/if}
					</div>
				{/if}
			</div>
		</form>
	</div>
</div>
