<script lang="ts" generics="TData, TValue">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		type ColumnDef,
		type RowSelectionState,
		getCoreRowModel,
		getExpandedRowModel
	} from '@tanstack/table-core';
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
		paramPrefix?: string; // optional parameter prefix for URL params
		expandable?: boolean; // enable row expansion
		renderExpandedRow?: (row: TData) => any; // snippet function to render expanded content
		emptyStateMessage?: string; // custom empty state message
		emptyStateContent?: () => any; // custom empty state content
		expandColumnId?: string; // column ID that should handle expand functionality
		enableSelection?: boolean; // enable row selection
		onSelectionChange?: (selectedRows: TData[]) => void; // callback when selection changes
		getRowId?: (row: TData) => string; // function to get unique row ID
		preSelectedIds?: (string | number)[]; // pre-selected row IDs
	};

	let {
		data,
		columns,
		totalItems,
		totalPages,
		currentPage,
		pageSize,
		paramPrefix = '',
		expandable = false,
		renderExpandedRow,
		emptyStateMessage = 'No results.',
		emptyStateContent,
		expandColumnId,
		enableSelection = false,
		onSelectionChange,
		getRowId = (row: any) => String(row.id),
		preSelectedIds = []
	}: DataTableProps<TData, TValue> = $props();

	// pagination
	function goToPage(newPage: number) {
		const url = new URL(page.url);
		const paramName = paramPrefix ? paramPrefix + 'Page' : 'page';
		url.searchParams.set(paramName, newPage.toString());
		goto(url.toString(), { replaceState: false });
	}

	// state for expanded rows
	let expanded = $state({});

	// initialize row selection with preselected IDs
	const initialRowSelection: RowSelectionState = {};
	if (enableSelection && preSelectedIds.length > 0) {
		preSelectedIds.forEach((id) => {
			initialRowSelection[String(id)] = true;
		});
	}

	// state for row selection
	let rowSelection = $state<RowSelectionState>(initialRowSelection);

	// create table
	const table = $derived(
		createSvelteTable({
			data,
			columns,
			state: {
				...(expandable && { expanded }),
				...(enableSelection && { rowSelection })
			},
			onExpandedChange: expandable
				? (updater) => {
						if (typeof updater === 'function') {
							expanded = updater(expanded);
						} else {
							expanded = updater;
						}
					}
				: undefined,
			onRowSelectionChange: enableSelection
				? (updater) => {
						if (typeof updater === 'function') {
							rowSelection = updater(rowSelection);
						} else {
							rowSelection = updater;
						}
						// Notify parent of selection changes
						if (onSelectionChange) {
							const selectedRows = table
								.getFilteredSelectedRowModel()
								.rows.map((row) => row.original);
							onSelectionChange(selectedRows);
						}
					}
				: undefined,
			getCoreRowModel: getCoreRowModel(),
			getExpandedRowModel: expandable ? getExpandedRowModel() : undefined,
			enableExpanding: expandable,
			getRowCanExpand: expandable ? () => true : undefined,
			enableRowSelection: enableSelection,
			getRowId: enableSelection ? getRowId : undefined,
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
				<Table.Row data-state={row.getIsSelected() && 'selected'}>
					{#each row.getVisibleCells() as cell (cell.id)}
						<Table.Cell
							class={expandable && expandColumnId && cell.column.id === expandColumnId
								? 'cursor-pointer'
								: ''}
							onclick={expandable &&
							expandColumnId &&
							cell.column.id === expandColumnId &&
							row.getCanExpand()
								? () => row.toggleExpanded()
								: undefined}
							title={expandable &&
							expandColumnId &&
							cell.column.id === expandColumnId &&
							row.getCanExpand()
								? 'View details'
								: undefined}
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
			{#if enableSelection}
				{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows
					.length} selected
				<span class="mx-2">•</span>
			{/if}
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
