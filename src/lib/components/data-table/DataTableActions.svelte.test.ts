import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DataTableActions from './DataTableActions.svelte';

// Mock DeleteDialog component
vi.mock('$lib/components/DeleteDialog.svelte', () => {
	return {
		default: vi.fn().mockImplementation(() => ({
			render: vi.fn(),
			$$set: vi.fn(),
			$destroy: vi.fn()
		}))
	};
});

describe('DataTableActions', () => {
	const defaultProps = {
		entityName: 'User',
		editUrl: '/users/edit/1',
		deleteUrl: '/users/delete/1',
		canEdit: true,
		canDelete: true,
		customActions: []
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render actions dropdown when permissions allow', () => {
			render(DataTableActions, { props: defaultProps });

			const button = screen.getByRole('button', { name: /Open menu/i });
			expect(button).toBeInTheDocument();
		});

		it('should not render when no permissions and no custom actions', () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					canEdit: false,
					canDelete: false,
					customActions: []
				}
			});

			const button = screen.queryByRole('button');
			expect(button).not.toBeInTheDocument();
		});

		it('should render when only canEdit is true', () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					canEdit: true,
					canDelete: false
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			expect(button).toBeInTheDocument();
		});

		it('should render when only canDelete is true', () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					canEdit: false,
					canDelete: true
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			expect(button).toBeInTheDocument();
		});

		it('should render when only custom actions exist', () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					canEdit: false,
					canDelete: false,
					customActions: [{ label: 'View Details', href: '/details/1' }]
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			expect(button).toBeInTheDocument();
		});
	});

	describe('Edit Action', () => {
		it('should show edit option when canEdit is true', async () => {
			render(DataTableActions, { props: defaultProps });

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			// Check for Edit text in dropdown
			expect(screen.getByText('Edit')).toBeInTheDocument();
		});

		it('should not show edit option when canEdit is false', async () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					canEdit: false
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			expect(screen.queryByText('Edit')).not.toBeInTheDocument();
		});
	});

	describe('Delete Action', () => {
		it('should show delete option when canDelete is true', async () => {
			render(DataTableActions, { props: defaultProps });

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			const deleteOption = screen.getByText('Delete');
			expect(deleteOption).toBeInTheDocument();
		});

		it('should not show delete option when canDelete is false', async () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					canDelete: false
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			const deleteOption = screen.queryByText('Delete');
			expect(deleteOption).not.toBeInTheDocument();
		});

		it('should call onDelete callback when provided', async () => {
			const onDelete = vi.fn();
			render(DataTableActions, {
				props: {
					...defaultProps,
					onDelete
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			const deleteOption = screen.getByText('Delete');
			await fireEvent.click(deleteOption);

			expect(onDelete).toHaveBeenCalledTimes(1);
		});
	});

	describe('Custom Actions', () => {
		it('should render custom action with href', async () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					customActions: [
						{
							label: 'View Details',
							href: '/details/1'
						}
					]
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			expect(screen.getByText('View Details')).toBeInTheDocument();
		});

		it('should render custom action with action callback', async () => {
			const customAction = vi.fn();
			render(DataTableActions, {
				props: {
					...defaultProps,
					customActions: [
						{
							label: 'Custom Action',
							action: customAction
						}
					]
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			const actionItem = screen.getByText('Custom Action');
			expect(actionItem).toBeInTheDocument();

			await fireEvent.click(actionItem);
			expect(customAction).toHaveBeenCalledTimes(1);
		});

		it('should render custom action with POST method', async () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					customActions: [
						{
							label: 'Generate Report',
							href: '/generate-report/1',
							method: 'POST'
						}
					]
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			expect(screen.getByText('Generate Report')).toBeInTheDocument();
		});

		it('should render custom action with icon', async () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					customActions: [
						{
							label: 'Generate QR',
							href: '/qr-code/1',
							icon: 'qr-code'
						}
					]
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			expect(screen.getByText('Generate QR')).toBeInTheDocument();
		});

		it('should render multiple custom actions', async () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					customActions: [
						{ label: 'Action 1', href: '/action1' },
						{ label: 'Action 2', href: '/action2' },
						{ label: 'Action 3', href: '/action3' }
					]
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			expect(screen.getByText('Action 1')).toBeInTheDocument();
			expect(screen.getByText('Action 2')).toBeInTheDocument();
			expect(screen.getByText('Action 3')).toBeInTheDocument();
		});
	});

	describe('Icon Mapping', () => {
		it.each([
			['file-plus', 'Add File'],
			['external-link', 'External Link'],
			['copy', 'Copy'],
			['qr-code', 'QR Code']
		])('should handle %s icon', async (icon, label) => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					customActions: [
						{
							label,
							href: '/action',
							icon
						}
					]
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			expect(screen.getByText(label)).toBeInTheDocument();
		});

		it('should handle undefined icon gracefully', async () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					customActions: [
						{
							label: 'No Icon Action',
							href: '/action'
						}
					]
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			expect(screen.getByText('No Icon Action')).toBeInTheDocument();
		});
	});

	describe('Entity Name', () => {
		it('should use default entityName', () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					entityName: 'User'
				}
			});

			// DeleteDialog should receive entityName prop
			expect(screen.getByRole('button')).toBeInTheDocument();
		});

		it('should use custom entityName', () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					entityName: 'Organization'
				}
			});

			expect(screen.getByRole('button')).toBeInTheDocument();
		});
	});

	describe('Inline Actions', () => {
		it('should render inline edit button with sr-only label', () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					editInline: true,
					canDelete: false
				}
			});

			// Inline edit renders as a button with sr-only "Edit" text
			expect(screen.getByText('Edit')).toBeInTheDocument();
			// No overflow dropdown since delete is disabled and edit is inline
			expect(screen.queryByRole('button', { name: /Open menu/i })).not.toBeInTheDocument();
		});

		it('should render inline delete button with sr-only label', () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					canEdit: false,
					deleteInline: true
				}
			});

			expect(screen.getByText('Delete')).toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /Open menu/i })).not.toBeInTheDocument();
		});

		it('should call onDelete when inline delete is clicked', async () => {
			const onDelete = vi.fn();
			render(DataTableActions, {
				props: {
					...defaultProps,
					canEdit: false,
					deleteInline: true,
					onDelete
				}
			});

			const deleteButton = screen.getByText('Delete').closest('button');
			expect(deleteButton).toBeInTheDocument();
			await fireEvent.click(deleteButton!);

			expect(onDelete).toHaveBeenCalledTimes(1);
		});

		it('should render inline custom action with icon', () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					canEdit: false,
					canDelete: false,
					customActions: [
						{ label: 'View Details', href: '/details/1', icon: 'external-link', inline: true }
					]
				}
			});

			// Inline custom action shows sr-only label
			expect(screen.getByText('View Details')).toBeInTheDocument();
			// No overflow dropdown
			expect(screen.queryByRole('button', { name: /Open menu/i })).not.toBeInTheDocument();
		});

		it('should fall back to overflow when inline custom action has no icon', async () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					canEdit: false,
					canDelete: false,
					customActions: [{ label: 'No Icon Action', href: '/action', inline: true }]
				}
			});

			// Should be in overflow dropdown since no icon
			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			expect(screen.getByText('No Icon Action')).toBeInTheDocument();
		});

		it('should show mixed inline and overflow actions', async () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					editInline: true,
					canDelete: true,
					customActions: [
						{ label: 'View', href: '/view/1', icon: 'external-link', inline: true },
						{ label: 'Clone', href: '/clone/1', icon: 'copy' }
					]
				}
			});

			// Inline: Edit (sr-only) and View (sr-only) should be visible
			expect(screen.getByText('Edit')).toBeInTheDocument();
			expect(screen.getByText('View')).toBeInTheDocument();

			// Overflow dropdown should exist for Delete and Clone
			const menuButton = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(menuButton);

			expect(screen.getByText('Delete')).toBeInTheDocument();
			expect(screen.getByText('Clone')).toBeInTheDocument();
		});

		it('should hide overflow dropdown when all actions are inline', () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					editInline: true,
					deleteInline: true,
					customActions: []
				}
			});

			// Both Edit and Delete are inline
			expect(screen.getByText('Edit')).toBeInTheDocument();
			expect(screen.getByText('Delete')).toBeInTheDocument();
			// No overflow dropdown
			expect(screen.queryByRole('button', { name: /Open menu/i })).not.toBeInTheDocument();
		});

		it('should render inline custom action with callback', async () => {
			const customAction = vi.fn();
			render(DataTableActions, {
				props: {
					...defaultProps,
					canEdit: false,
					canDelete: false,
					customActions: [{ label: 'Run Action', action: customAction, icon: 'copy', inline: true }]
				}
			});

			const actionButton = screen.getByText('Run Action').closest('button');
			expect(actionButton).toBeInTheDocument();
			await fireEvent.click(actionButton!);

			expect(customAction).toHaveBeenCalledTimes(1);
		});
	});

	describe('Edge Cases', () => {
		it('should handle all options together', async () => {
			const onDelete = vi.fn();
			const customAction = vi.fn();

			render(DataTableActions, {
				props: {
					...defaultProps,
					canEdit: true,
					canDelete: true,
					onDelete,
					customActions: [{ label: 'Custom', action: customAction }]
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			expect(screen.getByText('Edit')).toBeInTheDocument();
			expect(screen.getByText('Delete')).toBeInTheDocument();
			expect(screen.getByText('Custom')).toBeInTheDocument();
		});

		it('should handle empty custom actions array', async () => {
			render(DataTableActions, {
				props: {
					...defaultProps,
					customActions: []
				}
			});

			const button = screen.getByRole('button', { name: /Open menu/i });
			await fireEvent.click(button);

			expect(screen.getByText('Edit')).toBeInTheDocument();
			expect(screen.getByText('Delete')).toBeInTheDocument();
		});
	});
});
