<script lang="ts" generics="TData, TValue">
	import {
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
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { columns } from '../question_table/columns.js';

	type DataTableProps<TData> = {
		data: TData[];
		open: boolean;
		rowSelection: RowSelectionState;
		isTemplate: boolean;
	};

	let {
		data,
		open = $bindable(),
		rowSelection = $bindable(),
		isTemplate
	}: DataTableProps<TData, TValue> = $props();

	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: data.size || 10 });
	let sorting = $state<SortingState>([]);
	let columnFilters = $state<ColumnFiltersState>([]);
	let columnVisibility = $state<VisibilityState>({});

	let currentRow: number | null = $state(null);

	const table = createSvelteTable({
		get data() {
			return data.items;
		},
		columns,
		manualPagination: true,
		pageCount: -1,
		rowCount: data.total,
		getRowId: (row) => row.latest_question_revision_id.toString(),
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
			const url = new URL(page.url);
			url.searchParams.set('question_page', (pagination.pageIndex + 1).toString());
			goto(url, { keepFocus: true, invalidateAll: true, replaceState: true, noScroll: true });
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
</script>

<div class="flex h-full flex-col">
	<Table.Root>
		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row class="my-auto grid grid-cols-8 rounded-lg  bg-[#0369A1] hover:bg-[#0369A1]">
					{#each headerGroup.headers as header (header.id)}
						<Table.Head
							class={[
								'pl-0 text-white',
								header.id.includes('select') && 'col-span-1 ',
								header.id.includes('question_text') && 'col-span-3',
								header.id.includes('tags') && 'col-span-3',
								header.id.includes('answers') && 'col-span-1',
								header.id.includes('options') && 'hidden'
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
		<Table.Body class="grid max-h-[calc(100vh-300px)] overflow-y-auto pb-16">
			{#each table.getRowModel().rows as row, index (row.original.latest_question_revision_id)}
				<Table.Row
					class={[
						' my-2 mb-0 grid cursor-pointer grid-cols-8 rounded-lg border-1 ',
						currentRow === index ? 'rounded-b-none border-b-0' : ''
					]}
					data-state={row.getIsSelected() && 'selected'}
				>
					{#each row.getVisibleCells() as cell (cell.id)}
						<Table.Cell
							class={[
								'text-left',
								cell.id.includes('select') && 'col-span-1',
								cell.id.includes('question_text') && 'col-span-3',
								cell.id.includes('options') && 'hidden',
								cell.id.includes('tags') && 'col-span-3',
								cell.id.includes('answers') && 'col-span-1'
							]}
							onclick={() => {
								if (!cell.id.includes('correct_answer')) return;
								currentRow = currentRow === index ? null : index;
							}}
						>
							<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
						</Table.Cell>
					{/each}
				</Table.Row>
				<Table.Row
					class="rounded-lg rounded-t-none border-1 border-t-0"
					hidden={currentRow !== index}
					><Table.Cell colspan={columns.length}>
						{#each row.getValue('options') as option: {id:number, key:string, value:string}, index (option.id)}
							<div class="my-auto flex">
								<span class="bg-primary-foreground m-2 rounded-sm p-3">{option.key}</span>
								<p class="my-auto">{option.value}</p>
								{#if row.original?.correct_answer?.includes(option.id)}
									<CircleCheck class="text-primary my-auto ml-4 w-4" />
								{/if}
							</div>
						{/each}
					</Table.Cell></Table.Row
				>
			{:else}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
	<div
		class="fixed right-0 bottom-0 left-0 z-10 mt-4 flex rounded-lg border bg-white px-4 shadow-md"
	>
		<Button
			class="bg-primary hover:bg-primary/90 my-auto rounded px-4 text-white"
			onclick={() => {
				open = false;
			}}
		>
			Add to Test {isTemplate ? ' Template' : ''}
		</Button>
		<div class="my-auto ml-10 flex-1 text-sm font-normal">
			{Object.entries(rowSelection).length} of{' '}
			{data.total} question(s) selected.
		</div>
		<div class="ml-auto flex items-center">
			<p class="mx-4">
				Page {table.getState().pagination.pageIndex + 1} out of {data.pages}
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
