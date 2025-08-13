<script lang="ts" generics="TData, TValue">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { type ColumnDef, getCoreRowModel, getExpandedRowModel } from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	type DataTableProps<TData, TValue> = {
		columns: ColumnDef<TData, TValue>[];
		data: TData[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
		search: string;
		paramPrefix?: string; // optional parameter prefix for URL params
		expandable?: boolean; // enable row expansion
		renderExpandedRow?: (row: TData) => any; // snippet function to render expanded content
		emptyStateMessage?: string; // custom empty state message
		emptyStateContent?: () => any; // custom empty state content
	};

	let {
		data,
		columns,
		totalItems,
		totalPages,
		currentPage,
		pageSize,
		search,
		paramPrefix = '',
		expandable = false,
		renderExpandedRow,
		emptyStateMessage = 'No results.',
		emptyStateContent
	}: DataTableProps<TData, TValue> = $props();

	// update URL parameters and navigate to the new URL
	function updateUrl(params: Record<string, string | number>) {
		const url = new URL(page.url);

		Object.entries(params).forEach(([key, value]) => {
			const paramName = paramPrefix
				? paramPrefix + key.charAt(0).toUpperCase() + key.slice(1)
				: key;
			if (value) {
				url.searchParams.set(paramName, value.toString());
			} else {
				url.searchParams.delete(paramName);
			}
		});

		goto(url.toString(), { replaceState: false });
	}

	// pagination
	function goToPage(newPage: number) {
		updateUrl({ page: newPage });
	}

	// State for expanded rows
	let expanded = $state({});

	// create table

	const table = $derived(
		createSvelteTable({
			data,
			columns,
			state: expandable ? { expanded } : {},
			onExpandedChange: expandable
				? (updater) => {
						if (typeof updater === 'function') {
							expanded = updater(expanded);
						} else {
							expanded = updater;
						}
					}
				: undefined,
			getCoreRowModel: getCoreRowModel(),
			getExpandedRowModel: expandable ? getExpandedRowModel() : undefined,
			enableExpanding: expandable,
			getRowCanExpand: expandable ? () => true : undefined,
			manualPagination: true,
			manualSorting: true,
			manualFiltering: true
		})
	);
</script>

<div>
	<Table.Root>
		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row class="bg-primary-foreground">
					{#each headerGroup.headers as header (header.id)}
						<Table.Head colspan={header.colSpan}>
							{#if !header.isPlaceholder}
								<FlexRender
									content={header.column.columnDef.header}
									context={header.getContext()}
								/>
							{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>
		<Table.Body>
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row
					data-state={row.getIsSelected() && 'selected'}
					class={expandable && row.getCanExpand() ? 'cursor-pointer' : ''}
					onclick={expandable && row.getCanExpand() ? () => row.toggleExpanded() : undefined}
				>
					{#each row.getVisibleCells() as cell, index (cell.id)}
						<Table.Cell
							title={expandable && index === 0 && row.getCanExpand() ? 'View options' : undefined}
						>
							<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
						</Table.Cell>
					{/each}
				</Table.Row>

				{#if expandable && row.getIsExpanded() && renderExpandedRow}
					<Table.Row class="border-t-0">
						<Table.Cell colspan={columns.length} class="p-0">
							<div class="border-t p-4">
								{@html renderExpandedRow(row.original)}
							</div>
						</Table.Cell>
					</Table.Row>
				{/if}
			{:else}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="h-24 text-center">
						{#if emptyStateContent}
							{@html emptyStateContent()}
						{:else}
							{emptyStateMessage}
						{/if}
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
	<div class="flex items-center justify-between space-x-2 py-4">
		<div class="text-muted-foreground flex-1 text-sm">
			Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of
			{totalItems} entries
		</div>
		<div class="flex items-center space-x-2">
			<Button
				variant="outline"
				size="sm"
				onclick={() => goToPage(currentPage - 1)}
				disabled={currentPage <= 1}
			>
				Previous
			</Button>
			<div class="flex items-center space-x-1">
				<span class="text-sm font-medium">
					Page {currentPage} of {totalPages}
				</span>
			</div>
			<Button
				variant="outline"
				size="sm"
				onclick={() => goToPage(currentPage + 1)}
				disabled={currentPage >= totalPages}
			>
				Next
			</Button>
		</div>
	</div>
</div>
