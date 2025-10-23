<script lang="ts">
	import type { Snippet } from 'svelte';
	import Info from '@lucide/svelte/icons/info';
	import Label from '$lib/components/ui/label/label.svelte';

	type ListingPageLayoutProps = {
		title: string;
		subtitle: string;
		showFilters?: boolean;
		showEmptyState?: boolean;
		showInfoIcon?: boolean;
		headerActions?: () => Snippet;
		toolbar?: () => Snippet;
		filters?: () => Snippet;
		content?: () => Snippet;
		emptyState?: () => Snippet;
	};

	let {
		title,
		subtitle,
		showFilters = true,
		showEmptyState = false,
		showInfoIcon = true,
		headerActions,
		toolbar,
		filters,
		content,
		emptyState
	}: ListingPageLayoutProps = $props();
</script>

<div>
	<!-- Page Header -->
	<div class="mx-4 flex flex-col gap-4 py-4 sm:mx-10 sm:flex-row sm:gap-0">
		<div class="my-auto flex flex-col">
			<div class="flex w-full items-center align-middle">
				<div class="flex flex-row">
					<h2
						class="mr-2 w-fit scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 sm:text-3xl"
					>
						{title}
					</h2>
					{#if showInfoIcon}
						<Info class="my-auto w-4 align-middle text-xs text-gray-600" />
					{/if}
				</div>
			</div>
			<Label class="my-auto align-middle text-sm font-extralight">{subtitle}</Label>
		</div>
		{#if headerActions}
			<div class="my-auto flex flex-wrap gap-3 sm:ml-auto sm:p-4">
				{@render headerActions()}
			</div>
		{/if}
	</div>

	<!-- Empty State -->
	{#if showEmptyState && emptyState}
		{@render emptyState()}
	{:else}
		<!-- Content Section -->
		<div class="mx-4 mt-6 flex flex-col gap-8 sm:mx-8 sm:mt-10">
			<!-- Toolbar (always shown if present, e.g., batch actions) -->
			{#if toolbar}
				{@render toolbar()}
			{/if}

			<!-- Filter Section (conditionally shown) -->
			{#if showFilters && filters}
				{@render filters()}
			{/if}

			<!-- Main Content (DataTable) -->
			{#if content}
				{@render content()}
			{/if}
		</div>
	{/if}
</div>
