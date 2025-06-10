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
		open: boolean;
		formData: any;
	};

	let { columns, data, open = $bindable(), formData }: DataTableProps<TData, TValue> = $props();

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
				return rowSelection;
			}
		}
	});

	if (open) {
		$formData.question_revision_ids.forEach((element: any) => {
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
				<Table.Row class="my-auto grid grid-cols-8 rounded-lg  bg-[#0369A1] hover:bg-[#0369A1]">
					{#each headerGroup.headers as header (header.id)}
						<Table.Head
							class={[
								'pl-0 text-white',
								header.id.includes('select') && 'col-span-1 ',
								header.id.includes('question') && 'col-span-3',
								header.id.includes('tags') && 'col-span-3',
								header.id.includes('answers') && 'col-span-1'
							]}
						>
							{#if !header.isPlaceholder}
								<Table.Cell class="">
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
		<Table.Body class="grid">
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row
					class=" my-2 grid cursor-pointer grid-cols-8 rounded-lg border-1 "
					data-state={row.getIsSelected() && 'selected'}
				>
					{#each row.getVisibleCells() as cell (cell.id)}
						<Table.Cell
							class={[
								'text-left',
								cell.id.includes('select') && 'col-span-1',
								cell.id.includes('question') && 'col-span-3',
								cell.id.includes('tags') && 'col-span-3',
								cell.id.includes('answers') && 'col-span-1'
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
			class="bg-primary hover:bg-primary/90 my-auto rounded px-4 text-white"
			onclick={() => {
				let tempArray: number[] = [];
				table.getFilteredSelectedRowModel().rows.forEach((element: any) => {
					tempArray.push(element.original?.id);
				});
				$formData.question_revision_ids = tempArray;
				open = false;
			}}
		>
			Add to Test {$formData.is_template ? ' Template' : ''}
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
