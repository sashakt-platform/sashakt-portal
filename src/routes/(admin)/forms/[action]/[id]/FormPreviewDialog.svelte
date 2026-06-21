<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import PreviewDialog from '$lib/components/PreviewDialog.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import DistrictSelection from '$lib/components/DistrictSelection.svelte';
	import BlockSelection from '$lib/components/BlockSelection.svelte';
	import EntitySelection from '$lib/components/EntitySelection.svelte';
	import type { FormField } from './schema.js';
	import { FormFieldType } from './schema.js';

	let {
		open = $bindable(false),
		formName = '',
		formDescription = '',
		fields = []
	}: {
		open: boolean;
		formName: string;
		formDescription?: string | null;
		fields: FormField[];
	} = $props();

	let viewMode: 'mobile' | 'desktop' = $state('mobile');
	let selectedStates = $state<{ id: string; name: string }[]>([]);
	let selectedDistricts = $state<{ id: string; name: string }[]>([]);
	let selectedBlocks = $state<{ id: string; name: string }[]>([]);
	let selectedEntities = $state<{ id: string; name: string }[]>([]);
	let selectValues = $state<Record<string, string>>({});

	$effect(() => {
		if (open) {
			selectedStates = [];
			selectedDistricts = [];
			selectedBlocks = [];
			selectedEntities = [];
			selectValues = {};
		}
	});
</script>

{#snippet formField(field: FormField)}
	<div class="flex flex-col gap-1.5">
		<div class="flex items-center justify-between">
			<Label class="text-sm font-semibold">
				{field.label}
				{#if field.is_required}<span class="text-destructive ml-0.5">*</span>{/if}
			</Label>
		</div>

		{#if field.help_text}
			<p class="text-muted-foreground text-xs">{field.help_text}</p>
		{/if}

		{#if field.field_type === FormFieldType.TEXTAREA}
			<Textarea
				placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}...`}
				class="min-h-20 text-sm"
			/>
		{:else if field.field_type === FormFieldType.SELECT}
			<Select.Root
				type="single"
				value={selectValues[field.name]}
				onValueChange={(v) => {
					if (v) selectValues[field.name] = v;
				}}
			>
				<Select.Trigger class="h-10 w-full rounded-full px-4 text-sm">
					{#if selectValues[field.name]}
						<span>{(field.options ?? []).find((o) => o.value === selectValues[field.name])?.label ?? selectValues[field.name]}</span>
					{:else}
						<span class="text-muted-foreground">{field.placeholder ?? `Select ${field.label.toLowerCase()}...`}</span>
					{/if}
				</Select.Trigger>
				<Select.Content>
					{#each field.options ?? [] as opt, idx (idx)}
						<Select.Item value={opt.value} label={opt.label} />
					{/each}
				</Select.Content>
			</Select.Root>
		{:else if field.field_type === FormFieldType.MULTI_SELECT}
			<div class="flex flex-col gap-2">
				{#if (field.options ?? []).length > 0}
					{#each field.options ?? [] as opt, idx (idx)}
						<Label class="flex items-center gap-2 text-sm font-normal">
							<Checkbox />
							{opt.label}
						</Label>
					{/each}
				{:else}
					<p class="text-muted-foreground text-sm italic">No options added yet...</p>
				{/if}
			</div>
		{:else if field.field_type === FormFieldType.RADIO}
			<RadioGroup.Root class="flex flex-col gap-2">
				{#if (field.options ?? []).length > 0}
					{#each field.options ?? [] as opt, idx (idx)}
						<Label class="flex items-center gap-2 text-sm font-normal">
							<RadioGroup.Item value={opt.value} />
							{opt.label}
						</Label>
					{/each}
				{:else}
					<p class="text-muted-foreground text-sm italic">No options added yet...</p>
				{/if}
			</RadioGroup.Root>
		{:else if field.field_type === FormFieldType.CHECKBOX}
			<div class="flex flex-col gap-2">
				{#if (field.options ?? []).length > 0}
					{#each field.options ?? [] as opt, idx (idx)}
						<Label class="flex items-center gap-2 text-sm font-normal">
							<Checkbox />
							{opt.label}
						</Label>
					{/each}
				{:else}
					<Label class="flex items-center gap-2 text-sm font-normal">
						<Checkbox />
						{field.label}
					</Label>
				{/if}
			</div>
		{:else if field.field_type === FormFieldType.DATE}
			<Input type="date" class="h-10 text-sm" />
		{:else if field.field_type === FormFieldType.NUMBER}
			<Input type="number" placeholder={field.placeholder ?? '0'} class="h-10 text-sm" />
		{:else if field.field_type === FormFieldType.EMAIL}
			<Input
				type="email"
				placeholder={field.placeholder ?? 'email@example.com'}
				class="h-10 text-sm"
			/>
		{:else if field.field_type === FormFieldType.PHONE}
			<Input
				type="tel"
				placeholder={field.placeholder ?? '10-digit phone number'}
				class="h-10 text-sm"
			/>
		{:else if field.field_type === FormFieldType.STATE}
			<StateSelection bind:states={selectedStates} multiple={false} />
		{:else if field.field_type === FormFieldType.DISTRICT}
			<DistrictSelection bind:districts={selectedDistricts} {selectedStates} multiple={false} />
		{:else if field.field_type === FormFieldType.BLOCK}
			<BlockSelection bind:blocks={selectedBlocks} {selectedDistricts} multiple={false} />
		{:else if field.field_type === FormFieldType.ENTITY}
			<EntitySelection
				bind:entities={selectedEntities}
				entityTypeId={field.entity_type_id ?? null}
				multiple={false}
			/>
		{:else}
			<Input
				type="text"
				placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}...`}
				class="h-10 text-sm"
			/>
		{/if}
	</div>
{/snippet}

{#snippet formBody()}
	<div class="flex flex-col gap-6 bg-muted {viewMode === 'desktop' ? 'px-24 py-12' : 'p-6'}">
		{#if formName}
			<div class="flex flex-col gap-1 text-center">
				<h2 class="text-lg font-bold">{formName}</h2>
				{#if formDescription}
					<p class="text-muted-foreground text-sm">{formDescription}</p>
				{/if}
			</div>
		{:else}
			<p class="text-muted-foreground text-sm italic">Enter a form name to see the preview...</p>
		{/if}

		<div class="bg-background rounded-xl p-6 shadow-sm">
			{#if fields.length > 0}
				<div class="flex flex-col gap-5">
					{#each fields as field (field.id)}
						{@render formField(field)}
					{/each}
				</div>
			{:else}
				<p class="text-muted-foreground text-sm italic">Add fields to see them in preview...</p>
			{/if}
		</div>
	</div>
{/snippet}

<PreviewDialog bind:open bind:viewMode title="Form Preview">
	{@render formBody()}
</PreviewDialog>
