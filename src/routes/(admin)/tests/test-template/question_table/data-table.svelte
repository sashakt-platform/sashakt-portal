<script lang="ts" generics="TData, TValue">
	import {
		type ColumnDef,
		type PaginationState,
		type SortingState,
		type ColumnFiltersState,
		type VisibilityState,
		type RowSelectionState,
		getCoreRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		getFilteredRowModel
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	type DataTableProps<TData, TValue> = {
		columns: ColumnDef<TData, TValue>[];
		data: TData[];
		questions: Number[];
		open: boolean;
	};

	let {
		columns,
		data,
		questions = $bindable(),
		open = $bindable()
	}: DataTableProps<TData, TValue> = $props();

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let columnVisibility = $state<VisibilityState>({});
	let rowSelection = $state<RowSelectionState>({});

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				pagination = updater(pagination);
			} else {
				pagination = updater;
			}
		},
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onColumnVisibilityChange: (updater) => {
			if (typeof updater === 'function') {
				columnVisibility = updater(columnVisibility);
			} else {
				columnVisibility = updater;
			}
		},
		onRowSelectionChange: (updater) => {
			if (typeof updater === 'function') {
				rowSelection = updater(rowSelection);
			} else {
				rowSelection = updater;
			}
		},
		state: {
			get pagination() {
				return pagination;
			},
			get sorting() {
				return sorting;
			},
			get columnFilters() {
				return columnFilters;
			},
			get columnVisibility() {
				return columnVisibility;
			},
			get rowSelection() {
				// console.log('rowSelectionn function is -->', $state.snapshot(rowSelection));
				return rowSelection;
			}
		}
	});

	if (open) {
		questions.forEach((element: any) => {
			table.getFilteredRowModel().rows.filter((row: any) => {
				if (row.original?.id == element) {
					row.toggleSelected(true);
				}
			});
		});
	}
</script>

<div class="text-muted-foreground flex-1 text-sm">
	{table.getFilteredSelectedRowModel().rows.length} of{' '}
	{table.getFilteredRowModel().rows.length} row(s) selected.
</div>
<div>
	<Table.Root>
		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row class="my-auto flex rounded-lg bg-[#0369A1]  hover:bg-[#0369A1]">
					{#each headerGroup.headers as header (header.id)}
						<Table.Head class="flex-1 text-white ">
							{#if !header.isPlaceholder}
								<Table.Cell class="flex  w-fit">
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								</Table.Cell>
							{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>
		<Table.Body>
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row
					class="my-2 grid cursor-pointer grid-cols-4 rounded-lg border-1"
					data-state={row.getIsSelected() && 'selected'}
				>
					{#each row.getVisibleCells() as cell (cell.id)}
						{console.log('cellidd->', cell.id)}
						<Table.Cell
							class={[
								'text-left',
								cell.id.includes('select') && 'w-1',
								cell.id.includes('question') && 'w-3/4'
							]}
						>
							<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
						</Table.Cell>
					{/each}
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
	<div class="sticky bottom-0 mt-4 flex border-t-1 bg-white p-4 shadow-md">
		<Button
			class="bg-primary hover:bg-primary/90 rounded px-4 my-auto text-white"
			onclick={() => {
				questions.length = 0;
				table.getFilteredSelectedRowModel().rows.forEach((element: any) => {
					questions.push(element.original?.id);
				});

				open = false;
			}}
		>
			Add to Test Templates
		</Button>
		<div class="ml-auto flex items-center">
			<!-- <p>Questions per page</p> -->
			<p class="mx-4">
				Page {table.getState().pagination.pageIndex + 1} out of {table.getPageCount()}
			</p>
		</div>
		<div class="flex items-center justify-end space-x-2 py-4">
			<Button
				variant="outline"
				size="sm"
				onclick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				<ChevronLeft />
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				<ChevronRight />
			</Button>
		</div>
	</div>
</div>
