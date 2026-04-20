<script lang="ts">
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import TagTypeSelection from '$lib/components/TagTypeSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import DistrictSelection from '$lib/components/DistrictSelection.svelte';
	import {
		isStateAdmin,
		getUserState,
		type User,
		getUserDistrict,
		hasAssignedDistricts
	} from '$lib/utils/permissions.js';
	import TemplateSelect from './TemplateSelect.svelte';

	let {
		formData,
		user = null,
		convertTemplate = false,
		templates = { items: [], total: 0, pages: 0 },
		templateParams = {},
		selectedTemplateId = $bindable(null)
	}: {
		formData: any;
		user?: User | null;
		convertTemplate: boolean;
		templates?: any;
		templateParams?: any;
		selectedTemplateId?: string | null;
	} = $props();
	let selectedStates = $derived($formData.state_ids || []);
	let selectedTagTypes: { id: string; name: string }[] = $state([]);

	// for State admins, auto-assign their state
	$effect(() => {
		if (isStateAdmin(user) && $formData.state_ids?.length === 0) {
			const userState = getUserState(user);
			if (userState) {
				$formData.state_ids = [{ id: String(userState.id), name: userState.name }];
			}
		}
		if (hasAssignedDistricts(user) && $formData.district_ids?.length === 0) {
			const userDistrict = getUserDistrict(user);
			if (userDistrict && userDistrict?.length > 0) {
				$formData.district_ids = userDistrict.map((d: { id: string | number; name: string }) => ({
					id: String(d.id),
					name: d.name
				}));
			}
		}
	});
</script>

<!-- Section Header -->
<div class="flex items-center gap-4 border-b border-gray-100 px-6 py-5 sm:px-8">
	<div class="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
		<ClipboardList class="text-primary h-5 w-5" />
	</div>
	<div>
		<h2 class="text-base font-semibold text-gray-900">
			{convertTemplate ? 'Select Template' : 'Primary Details'}
		</h2>
		<p class="text-sm text-gray-500">
			{convertTemplate
				? 'Choose template to include its questions'
				: 'Basic information about the ' + ($formData.is_template ? 'test template' : 'test')}
		</p>
	</div>
</div>
{#if convertTemplate}
	<TemplateSelect {templates} {templateParams} bind:selectedTemplateId />
{:else}
	<!-- Two-Column Layout -->
	<div class="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:gap-0">
		<!-- Left Column: Name + Description -->
		<div class="flex w-full flex-1 flex-col gap-6 lg:w-3/5 lg:pr-8">
			<div>
				<Label for="template-name" class="text-sm font-medium text-gray-800">
					{$formData.is_template ? 'Template Name' : 'Test Name'}
					<span class="text-muted-foreground font-normal">(Visible to the candidate)</span>
				</Label>
				<Input
					type="text"
					id="template-name"
					placeholder="E.g., Sashakt Governance Assessment"
					class="mt-2"
					name="name"
					bind:value={$formData.name}
				/>
			</div>

			<div>
				<Label for="description" class="text-sm font-medium text-gray-800">
					Description
					<span class="text-muted-foreground font-normal">(Visible to the candidate)</span>
				</Label>
				<Textarea
					id="description"
					placeholder="Brief description of this {$formData.is_template
						? 'test template'
						: 'test'}..."
					class="mt-2 min-h-30"
					name="description"
					bind:value={$formData.description}
				/>
			</div>
		</div>

		<!-- Vertical Divider -->
		<div class="hidden lg:block lg:w-px lg:self-stretch lg:bg-gray-200"></div>

		<!-- Right Column: Tag Types, Tags, State, District, Status -->
		<div class="flex w-full flex-col gap-5 lg:w-2/5 lg:pl-8">
			<div>
				<Label class="text-sm font-semibold text-gray-800">Tag Types</Label>
				<div class="mt-2">
					<TagTypeSelection bind:tagTypes={selectedTagTypes} />
				</div>
			</div>

			<div>
				<Label class="text-sm font-semibold text-gray-800">Tags</Label>
				<div class="mt-2">
					<TagsSelection bind:tags={$formData.tag_ids} tagTypes={selectedTagTypes} />
				</div>
			</div>
			{#if !isStateAdmin(user) || !hasAssignedDistricts(user)}
				<hr class="border-border my-4" />
				{#if !isStateAdmin(user)}
					<div>
						<Label class="text-sm font-semibold text-gray-800">State</Label>
						<div class="mt-2">
							<StateSelection bind:states={$formData.state_ids} />
						</div>
					</div>
				{/if}

				{#if !hasAssignedDistricts(user)}
					<div>
						<Label class="text-sm font-semibold text-gray-800">District</Label>
						<div class="mt-2">
							<DistrictSelection bind:districts={$formData.district_ids} {selectedStates} />
						</div>
					</div>
				{/if}
			{/if}

			<hr class="border-border my-4" />
			<div class="flex items-center justify-between pt-2">
				<Label class="text-sm font-semibold text-gray-800">
					{$formData.is_template ? 'Template Status' : 'Test Status'}
				</Label>
				<div class="flex items-center gap-2">
					<span
						class="text-sm {$formData.is_active
							? 'text-primary font-semibold'
							: 'text-muted-foreground'}">{$formData.is_active ? 'Active' : 'Inactive'}</span
					>
					<Switch id="is-active" bind:checked={$formData.is_active} />
				</div>
			</div>
		</div>
	</div>
{/if}
