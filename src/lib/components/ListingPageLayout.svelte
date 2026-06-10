<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TooltipKey } from '$lib/config/tooltips';
	import Label from '$lib/components/ui/label/label.svelte';
	import TooltipInfo from './TooltipInfo.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { resolve } from '$app/paths';

	type ListingPageLayoutProps = {
		title: string;
		subtitle: string;
		backHref?: string;
		tooltipKey?: TooltipKey;
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
		backHref,
		showFilters = true,
		showEmptyState = false,
		showInfoIcon = true,
		tooltipKey,
		headerActions,
		toolbar,
		filters,
		content,
		emptyState
	}: ListingPageLayoutProps = $props();
</script>

<div class="flex min-h-full flex-col">
	<!-- Page Header -->
	<div class="bg-card">
		<div class="mx-4 flex flex-col gap-4 py-4 sm:mx-10 sm:flex-row sm:gap-0">
			<div class="my-auto flex flex-col">
				<div class="flex w-full items-center align-middle">
					<div class="flex flex-row items-center gap-3">
						{#if backHref}
							<a
								href={resolve(backHref)}
								class="hover:bg-muted rounded-lg border p-2"
								aria-label="Go back"
							>
								<ArrowLeft size={20} />
							</a>
						{/if}
						<h2
							class="mr-2 w-fit scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0 sm:text-3xl"
						>
							{title}
						</h2>
						{#if showInfoIcon}
							<TooltipInfo {tooltipKey} />
						{/if}
					</div>
				</div>
				{#if subtitle}
					<Label class="my-auto align-middle text-sm font-extralight">{subtitle}</Label>
				{/if}
			</div>
			{#if headerActions}
				<div class="my-auto flex flex-wrap gap-3 sm:ml-auto sm:p-4">
					{@render headerActions()}
				</div>
			{/if}
		</div>
	</div>
	<hr class="border-border" />

	<!-- Empty State -->
	{#if showEmptyState && emptyState}
		{@render emptyState()}
	{:else}
		<!-- Content Section -->
		<div class="bg-background">
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
		</div>
	{/if}
</div>
