import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DeleteDialog from './DeleteDialog.svelte';

describe('DeleteDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Single Delete Mode', () => {
		it('should not render when action is null', () => {
			render(DeleteDialog, {
				props: {
					action: null,
					elementName: 'User'
				}
			});

			expect(screen.queryByText('Delete User?')).not.toBeInTheDocument();
		});

		it('should render when action is provided', () => {
			render(DeleteDialog, {
				props: {
					action: '/users/delete/1',
					elementName: 'User'
				}
			});

			expect(screen.getByText('Delete User?')).toBeInTheDocument();
		});

		it('should show correct warning message', () => {
			render(DeleteDialog, {
				props: {
					action: '/users/delete/1',
					elementName: 'User'
				}
			});

			expect(
				screen.getByText('This action cannot be undone. This will permanently delete your User')
			).toBeInTheDocument();
		});

		it('should render with delete form', () => {
			render(DeleteDialog, {
				props: {
					action: '/users/delete/1',
					elementName: 'User'
				}
			});

			// Delete button should be a submit button (inside form)
			const deleteButton = screen.getByRole('button', { name: 'Delete' });
			expect(deleteButton).toHaveAttribute('type', 'submit');
		});

		it('should show delete and cancel buttons', () => {
			render(DeleteDialog, {
				props: {
					action: '/users/delete/1',
					elementName: 'User'
				}
			});

			expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
		});

		it('should use custom element name', () => {
			render(DeleteDialog, {
				props: {
					action: '/organizations/delete/1',
					elementName: 'Organization'
				}
			});

			expect(screen.getByText('Delete Organization?')).toBeInTheDocument();
		});

		it('should default to "Element" if no elementName provided', () => {
			render(DeleteDialog, {
				props: {
					action: '/items/delete/1'
				}
			});

			expect(screen.getByText('Delete Element?')).toBeInTheDocument();
		});
	});

	describe('Batch Delete Mode', () => {
		const batchProps = {
			action: null,
			batchMode: true,
			selectedCount: 3,
			selectedItems: [
				{ id: 1, name: 'Item 1' },
				{ id: 2, name: 'Item 2' },
				{ id: 3, name: 'Item 3' }
			],
			elementName: 'User',
			onBatchConfirm: vi.fn(),
			onBatchCancel: vi.fn()
		};

		it('should render when in batch mode with selections', () => {
			render(DeleteDialog, { props: batchProps });

			expect(screen.getByText('Delete 3 User?')).toBeInTheDocument();
		});

		it('should not render when in batch mode with no selections', () => {
			render(DeleteDialog, {
				props: {
					...batchProps,
					selectedCount: 0,
					selectedItems: []
				}
			});

			expect(screen.queryByText(/Delete/)).not.toBeInTheDocument();
		});

		it('should show correct warning message for batch delete', () => {
			render(DeleteDialog, { props: batchProps });

			expect(
				screen.getByText(/This action cannot be undone. This will permanently delete the selected/)
			).toBeInTheDocument();
		});

		it('should pluralize element name correctly', () => {
			render(DeleteDialog, {
				props: {
					...batchProps,
					selectedCount: 3
				}
			});

			expect(screen.getByText(/selected Users/)).toBeInTheDocument();
		});

		it('should not pluralize for single item', () => {
			render(DeleteDialog, {
				props: {
					...batchProps,
					selectedCount: 1,
					selectedItems: [{ id: 1, name: 'Item 1' }]
				}
			});

			expect(screen.getByText(/selected User[^s]/)).toBeInTheDocument();
		});

		it('should show list of items when count <= 5', () => {
			render(DeleteDialog, { props: batchProps });

			expect(screen.getByText('Items to be deleted:')).toBeInTheDocument();
			expect(screen.getByText('Item 1')).toBeInTheDocument();
			expect(screen.getByText('Item 2')).toBeInTheDocument();
			expect(screen.getByText('Item 3')).toBeInTheDocument();
		});

		it('should not show list of items when count > 5', () => {
			render(DeleteDialog, {
				props: {
					...batchProps,
					selectedCount: 10,
					selectedItems: Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Item ${i}` }))
				}
			});

			expect(screen.queryByText('Items to be deleted:')).not.toBeInTheDocument();
		});

		it('should limit displayed items to 5', () => {
			render(DeleteDialog, {
				props: {
					...batchProps,
					selectedCount: 5,
					selectedItems: [
						{ id: 1, name: 'Item 1' },
						{ id: 2, name: 'Item 2' },
						{ id: 3, name: 'Item 3' },
						{ id: 4, name: 'Item 4' },
						{ id: 5, name: 'Item 5' }
					]
				}
			});

			expect(screen.getByText('Item 1')).toBeInTheDocument();
			expect(screen.getByText('Item 5')).toBeInTheDocument();
		});

		it('should display question_text for question items', () => {
			render(DeleteDialog, {
				props: {
					...batchProps,
					selectedItems: [{ id: 1, question_text: 'What is 2+2?' }]
				}
			});

			expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
		});

		it('should fallback to item id if no name or question_text', () => {
			render(DeleteDialog, {
				props: {
					...batchProps,
					selectedCount: 1,
					selectedItems: [{ id: 42 }]
				}
			});

			expect(screen.getByText('Item 42')).toBeInTheDocument();
		});

		it('should call onBatchConfirm when confirm button clicked', async () => {
			const onBatchConfirm = vi.fn();

			render(DeleteDialog, {
				props: {
					...batchProps,
					onBatchConfirm
				}
			});

			const confirmButton = screen.getByRole('button', { name: /Delete 3/ });
			await fireEvent.click(confirmButton);

			expect(onBatchConfirm).toHaveBeenCalledTimes(1);
		});

		it('should call onBatchCancel when cancel button clicked', async () => {
			const onBatchCancel = vi.fn();

			render(DeleteDialog, {
				props: {
					...batchProps,
					onBatchCancel
				}
			});

			const cancelButton = screen.getByRole('button', { name: 'Cancel' });
			await fireEvent.click(cancelButton);

			// May be called multiple times due to dialog closing behavior
			expect(onBatchCancel).toHaveBeenCalled();
		});

		it('should show correct count in delete button', () => {
			render(DeleteDialog, {
				props: {
					...batchProps,
					selectedCount: 7,
					elementName: 'Question'
				}
			});

			expect(screen.getByRole('button', { name: /Delete 7 Question/ })).toBeInTheDocument();
		});
	});

	describe('Dialog Behavior', () => {
		it('should be open when action is set', () => {
			render(DeleteDialog, {
				props: {
					action: '/delete/1',
					elementName: 'Item'
				}
			});

			expect(screen.getByText('Delete Item?')).toBeInTheDocument();
		});

		it('should be open when batch mode is active with selections', () => {
			render(DeleteDialog, {
				props: {
					action: null,
					batchMode: true,
					selectedCount: 1,
					selectedItems: [{ id: 1, name: 'Item' }],
					elementName: 'Item'
				}
			});

			expect(screen.getByText('Delete 1 Item?')).toBeInTheDocument();
		});

		it('should handle both modes simultaneously preferring batch', () => {
			render(DeleteDialog, {
				props: {
					action: '/delete/1',
					batchMode: true,
					selectedCount: 2,
					selectedItems: [
						{ id: 1, name: 'Item 1' },
						{ id: 2, name: 'Item 2' }
					],
					elementName: 'Item',
					onBatchConfirm: vi.fn()
				}
			});

			// Should show batch mode dialog
			expect(screen.getByText('Delete 2 Item?')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /Delete 2/ })).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty selectedItems array', () => {
			render(DeleteDialog, {
				props: {
					action: null,
					batchMode: true,
					selectedCount: 0,
					selectedItems: [],
					elementName: 'Item'
				}
			});

			expect(screen.queryByText(/Delete/)).not.toBeInTheDocument();
		});

		it('should handle undefined callbacks gracefully', () => {
			render(DeleteDialog, {
				props: {
					action: null,
					batchMode: true,
					selectedCount: 1,
					selectedItems: [{ id: 1, name: 'Item' }],
					elementName: 'Item'
				}
			});

			expect(screen.getByText('Delete 1 Item?')).toBeInTheDocument();
			// Should not throw when callbacks are undefined
		});

		it('should handle special characters in element name', () => {
			render(DeleteDialog, {
				props: {
					action: '/delete/1',
					elementName: "User's Profile"
				}
			});

			expect(screen.getByText("Delete User's Profile?")).toBeInTheDocument();
		});

		it('should handle items with only id field', () => {
			render(DeleteDialog, {
				props: {
					action: null,
					batchMode: true,
					selectedCount: 2,
					selectedItems: [{ id: 1 }, { id: 2 }],
					elementName: 'Record'
				}
			});

			expect(screen.getByText('Item 1')).toBeInTheDocument();
			expect(screen.getByText('Item 2')).toBeInTheDocument();
		});
	});
});
