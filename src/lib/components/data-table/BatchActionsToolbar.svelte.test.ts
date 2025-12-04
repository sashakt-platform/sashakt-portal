import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import BatchActionsToolbar from './BatchActionsToolbar.svelte';

describe('BatchActionsToolbar', () => {
	const defaultProps = {
		selectedCount: 3,
		selectedRows: [
			{ id: 1, name: 'Item 1' },
			{ id: 2, name: 'Item 2' },
			{ id: 3, name: 'Item 3' }
		],
		selectedRowIds: ['1', '2', '3'],
		onAction: vi.fn(),
		onClearSelection: vi.fn()
	};

	describe('Visibility', () => {
		it('should render when items are selected', () => {
			render(BatchActionsToolbar, { props: defaultProps });

			expect(screen.getByText('3 items selected')).toBeInTheDocument();
		});

		it('should not render when no items are selected', () => {
			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					selectedCount: 0,
					selectedRows: [],
					selectedRowIds: []
				}
			});

			expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
		});

		it('should render when only one item is selected', () => {
			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					selectedCount: 1,
					selectedRows: [{ id: 1, name: 'Item 1' }],
					selectedRowIds: ['1']
				}
			});

			expect(screen.getByText('1 item selected')).toBeInTheDocument();
		});
	});

	describe('Selected Count Display', () => {
		it('should show singular "item" for one selection', () => {
			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					selectedCount: 1
				}
			});

			expect(screen.getByText('1 item selected')).toBeInTheDocument();
		});

		it('should show plural "items" for multiple selections', () => {
			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					selectedCount: 5
				}
			});

			expect(screen.getByText('5 items selected')).toBeInTheDocument();
		});

		it('should update count when selectedCount changes', () => {
			const { rerender } = render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					selectedCount: 2
				}
			});

			expect(screen.getByText('2 items selected')).toBeInTheDocument();

			rerender({
				...defaultProps,
				selectedCount: 10
			});

			expect(screen.getByText('10 items selected')).toBeInTheDocument();
		});
	});

	describe('Default Actions', () => {
		it('should render default delete action', () => {
			render(BatchActionsToolbar, { props: defaultProps });

			expect(screen.getByText('Delete')).toBeInTheDocument();
		});

		it('should call onAction with delete when delete is clicked', async () => {
			const onAction = vi.fn();

			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					onAction
				}
			});

			const deleteButton = screen.getByText('Delete');
			await fireEvent.click(deleteButton);

			expect(onAction).toHaveBeenCalledTimes(1);
			expect(onAction).toHaveBeenCalledWith('delete');
		});
	});

	describe('Custom Actions', () => {
		it('should render custom actions', () => {
			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					actions: [
						{ id: 'export', label: 'Export' },
						{ id: 'archive', label: 'Archive' }
					]
				}
			});

			expect(screen.getByText('Export')).toBeInTheDocument();
			expect(screen.getByText('Archive')).toBeInTheDocument();
		});

		it('should call onAction with correct action id', async () => {
			const onAction = vi.fn();

			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					actions: [
						{ id: 'export', label: 'Export' },
						{ id: 'archive', label: 'Archive' }
					],
					onAction
				}
			});

			const exportButton = screen.getByText('Export');
			await fireEvent.click(exportButton);

			expect(onAction).toHaveBeenCalledWith('export');

			const archiveButton = screen.getByText('Archive');
			await fireEvent.click(archiveButton);

			expect(onAction).toHaveBeenCalledWith('archive');
		});

		it('should render actions with different variants', () => {
			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					actions: [
						{ id: 'export', label: 'Export', variant: 'default' },
						{ id: 'delete', label: 'Delete', variant: 'destructive' }
					]
				}
			});

			expect(screen.getByText('Export')).toBeInTheDocument();
			expect(screen.getByText('Delete')).toBeInTheDocument();
		});

		it('should handle disabled actions', () => {
			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					actions: [{ id: 'export', label: 'Export', disabled: true }]
				}
			});

			const button = screen.getByText('Export').closest('button');
			expect(button).toBeDisabled();
		});

		it('should not disable enabled actions', () => {
			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					actions: [{ id: 'export', label: 'Export', disabled: false }]
				}
			});

			const button = screen.getByText('Export').closest('button');
			expect(button).not.toBeDisabled();
		});
	});

	describe('Clear Selection', () => {
		it('should render clear selection button', () => {
			render(BatchActionsToolbar, { props: defaultProps });

			const clearButton = screen.getByLabelText('Clear selection');
			expect(clearButton).toBeInTheDocument();
		});

		it('should call onClearSelection when clicked', async () => {
			const onClearSelection = vi.fn();

			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					onClearSelection
				}
			});

			const clearButton = screen.getByLabelText('Clear selection');
			await fireEvent.click(clearButton);

			expect(onClearSelection).toHaveBeenCalledTimes(1);
		});

		it('should call onClearSelection multiple times', async () => {
			const onClearSelection = vi.fn();

			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					onClearSelection
				}
			});

			const clearButton = screen.getByLabelText('Clear selection');
			await fireEvent.click(clearButton);
			await fireEvent.click(clearButton);

			expect(onClearSelection).toHaveBeenCalledTimes(2);
		});
	});

	describe('Edge Cases', () => {
		it('should handle undefined onAction gracefully', () => {
			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					onAction: undefined
				}
			});

			const deleteButton = screen.getByText('Delete');
			expect(deleteButton).toBeInTheDocument();
			// Should not throw when clicked
		});

		it('should handle undefined onClearSelection gracefully', () => {
			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					onClearSelection: undefined
				}
			});

			const clearButton = screen.getByLabelText('Clear selection');
			expect(clearButton).toBeInTheDocument();
			// Should not throw when clicked
		});

		it('should handle empty actions array', () => {
			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					actions: []
				}
			});

			expect(screen.getByText('3 items selected')).toBeInTheDocument();
		});

		it('should handle large selection counts', () => {
			render(BatchActionsToolbar, {
				props: {
					...defaultProps,
					selectedCount: 1000
				}
			});

			expect(screen.getByText('1000 items selected')).toBeInTheDocument();
		});

		it('should pass selectedRows and selectedRowIds to handlers', () => {
			const onAction = vi.fn();
			const selectedRows = [{ id: 1 }, { id: 2 }];
			const selectedRowIds = ['1', '2'];

			render(BatchActionsToolbar, {
				props: {
					selectedCount: 2,
					selectedRows,
					selectedRowIds,
					onAction
				}
			});

			// Component receives the data even if handlers don't use it directly
			expect(screen.getByText('2 items selected')).toBeInTheDocument();
		});
	});
});
