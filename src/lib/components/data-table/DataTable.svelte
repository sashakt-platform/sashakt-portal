<script lang="ts" generics="TData, TValue">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { type ColumnDef, getCoreRowModel } from '@tanstack/table-core';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	type DataTableProps<TData, TValue> = {
		columns: ColumnDef<TData, TValue>[];
		data: TData[];
		totalItems: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
		search: string;
	};

	let {
		data,
		columns,
		totalItems,
		totalPages,
		currentPage,
		pageSize,
		search
	}: DataTableProps<TData, TValue> = $props();

	let searchInput = $state(search);
	let searchTimeout: number;

	// cleanup timeout on component destroy
	$effect(() => {
		return () => {
			clearTimeout(searchTimeout);
		};
	});

	// let's add debouncing for search
	function handleSearch() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			updateUrl({ search: searchInput, page: 1 });
		}, 500);
	}

	// update URL parameters and navigate to the new URL
	function updateUrl(params: Record<string, string | number>) {
		const url = new URL(page.url);

		Object.entries(params).forEach(([key, value]) => {
			if (value) {
				url.searchParams.set(key, value.toString());
			} else {
				url.searchParams.delete(key);
			}
		});

		goto(url.toString(), { replaceState: false });
	}

	// pagination
	function goToPage(newPage: number) {
		updateUrl({ page: newPage });
	}

	// create table
	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		manualSorting: true,
		manualFiltering: true
	});
</script>

<div>
	<div class="flex items-center py-4">
		<Input
			placeholder="Search all columns..."
			bind:value={searchInput}
			oninput={handleSearch}
			class="max-w-sm"
		/>
	</div>
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
						<Table.Cell>
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
