<script lang="ts">
	import TagChip from '$lib/components/ui/tag-chip/TagChip.svelte';
	import TagsSelection from '$lib/components/TagsSelection.svelte';
	import TagTypeSelection from '$lib/components/TagTypeSelection.svelte';
	import StateSelection from '$lib/components/StateSelection.svelte';
	import DistrictSelection from '$lib/components/DistrictSelection.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import Button from '$lib/components/ui/button/button.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useTerms } from '$lib/nomenclature';

	const term = useTerms();

	let {
		templates,
		templateParams = { page: 1, size: 20, search: '', sortBy: '', sortOrder: 'asc' },
		selectedTemplateId = $bindable(null)
	}: {
		templates: {
			items: Array<{
				id: string;
				name: string;
				tags?: Array<{ name: string; tag_type?: { name: string } }>;
				modified_date?: string;
			}>;
			total: number;
			pages: number;
		};
		templateParams?: {
			page: number;
			size: number;
			search: string;
			sortBy: string;
			sortOrder: string;
		};
		selectedTemplateId?: string | null;
	} = $props();

	let filteredTags: { id: string; name: string }[] = $state([]);
	let filteredStates: { id: string; name: string }[] = $state([]);
	let filteredTagTypes: { id: string; name: string }[] = $state([]);
	let filteredDistricts: { id: string; name: string }[] = $state([]);

	const currentPage = $derived(templateParams.page);
	const totalPages = $derived(templates?.pages ?? 1);
	const totalItems = $derived(templates?.total ?? 0);
	const pageSize = $derived(templateParams.size);

	function goToPage(newPage: number) {
		const url = new URL(page.url);
		url.searchParams.set('page', newPage.toString());
		goto(url, { keepFocus: true, invalidateAll: true });
	}

	function handleSort(col: string) {
		const url = new URL(page.url);
		if (templateParams.sortBy === col) {
			url.searchParams.set('sortOrder', templateParams.sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			url.searchParams.set('sortBy', col);
			url.searchParams.set('sortOrder', 'asc');
		}
		url.searchParams.set('page', '1');
		goto(url, { keepFocus: true, invalidateAll: true });
	}

	function formatDate(dateStr: string | undefined) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function formatTime(dateStr: string | undefined) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
	}

	const items = $derived(templates?.items ?? []);
</script>

<!-- Filters -->
<div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
	<SearchInput placeholder="Search templates..." value={templateParams.search} />
	<div class="flex flex-1 flex-wrap items-start justify-end gap-2">
		<div><StateSelection bind:states={filteredStates} filteration={true} /></div>
		<div>
			<DistrictSelection
				bind:districts={filteredDistricts}
				selectedStates={filteredStates}
				filteration={true}
			/>
		</div>
		<div class="mx-2 w-px self-stretch bg-gray-300"></div>
		<div><TagTypeSelection bind:tagTypes={filteredTagTypes} filteration={true} /></div>
		<div>
			<TagsSelection bind:tags={filteredTags} filteration={true} tagTypes={filteredTagTypes} />
		</div>
	</div>
</div>

<!-- Table card -->
<div class="mx-4 mb-4 overflow-hidden rounded-xl border border-gray-300 sm:mx-5">
	<!-- Header row -->
	<div
		class="grid grid-cols-[44px_1fr_280px_160px] bg-gray-200 px-4 py-6 text-xs font-semibold tracking-wide text-gray-500 uppercase"
	>
		<div></div>
		<button
			type="button"
			class="flex items-center gap-1 text-left hover:text-gray-700"
			onclick={() => handleSort('name')}
		>
			TEST TEMPLATES <ArrowUpDown class="h-3 w-3" />
		</button>
		<div>TAGS</div>
		<button
			type="button"
			class="flex items-center gap-1 hover:text-gray-700"
			onclick={() => handleSort('modified_date')}
		>
			UPDATED <ArrowUpDown class="h-3 w-3" />
		</button>
	</div>

	{#if items.length === 0}
		<div class="py-16 text-center text-sm text-gray-400">
			No {term('test_templates', 'lower')} found.
		</div>
	{/if}

	{#each items as template (template.id)}
		{@const isSelected = selectedTemplateId === String(template.id)}
		<button
			type="button"
			class="grid w-full grid-cols-[44px_1fr_280px_160px] items-center border-t border-gray-100 px-4 py-4 text-left transition-colors {isSelected
				? 'bg-primary/5'
				: 'hover:bg-gray-50'}"
			onclick={() => (selectedTemplateId = String(template.id))}
		>
			<!-- Checkbox -->
			<div
				class="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 {isSelected
					? 'border-primary bg-primary'
					: 'border-gray-300'}"
			>
				{#if isSelected}
					<svg class="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
						<path
							d="M2 6l3 3 5-5"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				{/if}
			</div>

			<!-- Name -->
			<p class="text-sm font-medium text-gray-800">{template.name}</p>

			<!-- Tags -->
			<div class="flex flex-wrap gap-1">
				{#each (template.tags ?? []).slice(0, 2) as tag}
					<TagChip name={tag.name} class="max-w-36" />
				{/each}
				{#if (template.tags ?? []).length > 2}
					<TagChip name="+{(template.tags ?? []).length - 2}" />
				{/if}
			</div>

			<!-- Date -->
			<div class="text-sm text-gray-500">
				<p>{formatDate(template.modified_date)}</p>
				<p class="text-xs text-gray-400">{formatTime(template.modified_date)}</p>
			</div>
		</button>
	{/each}

	<!-- Pagination -->
	<div class="flex items-center justify-between border-t border-gray-100 px-4 py-3">
		<p class="text-sm text-gray-500">
			{#if totalItems > 0}
				Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
			{/if}
		</p>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				disabled={currentPage <= 1}
				onclick={() => goToPage(currentPage - 1)}
			>
				Previous
			</Button>
			<span class="text-sm font-medium">{currentPage} / {totalPages}</span>
			<Button
				variant="outline"
				size="sm"
				disabled={currentPage >= totalPages}
				onclick={() => goToPage(currentPage + 1)}
			>
				Next
			</Button>
		</div>
	</div>
</div>
