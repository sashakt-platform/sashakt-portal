import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import DataTable from './DataTable.svelte';
import type { ColumnDef } from '@tanstack/table-core';

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock $app/state
vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/users?page=1')
	}
}));

describe('DataTable', () => {
	type TestData = {
		id: number;
		name: string;
		email: string;
	};

	const testData: TestData[] = [
		{ id: 1, name: 'John Doe', email: 'john@example.com' },
		{ id: 2, name: 'Jane Smith', email: 'jane@example.com' },
		{ id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
	];

	const testColumns: ColumnDef<TestData>[] = [
		{
			accessorKey: 'name',
			header: 'Name'
		},
		{
			accessorKey: 'email',
			header: 'Email'
		}
	];

	const defaultProps = {
		data: testData,
		columns: testColumns,
		totalItems: 3,
		totalPages: 1,
		currentPage: 1,
		pageSize: 10
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render table with data', () => {
			render(DataTable, { props: defaultProps });

			expect(screen.getByText('John Doe')).toBeInTheDocument();
			expect(screen.getByText('jane@example.com')).toBeInTheDocument();
			expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
		});

		it('should render column headers', () => {
			render(DataTable, { props: defaultProps });

			expect(screen.getByText('Name')).toBeInTheDocument();
			expect(screen.getByText('Email')).toBeInTheDocument();
		});

		it('should render all rows', () => {
			render(DataTable, { props: defaultProps });

			expect(screen.getByText('John Doe')).toBeInTheDocument();
			expect(screen.getByText('Jane Smith')).toBeInTheDocument();
			expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
		});
	});

	describe('Empty State', () => {
		it('should show default empty message when no data', () => {
			render(DataTable, {
				props: {
					...defaultProps,
					data: [],
					totalItems: 0
				}
			});

			expect(screen.getByText('No results.')).toBeInTheDocument();
		});

		it('should show custom empty message', () => {
			render(DataTable, {
				props: {
					...defaultProps,
					data: [],
					totalItems: 0,
					emptyStateMessage: 'No users found'
				}
			});

			expect(screen.getByText('No users found')).toBeInTheDocument();
		});
	});

	describe('Pagination Info', () => {
		it('should show correct pagination info for first page', () => {
			render(DataTable, { props: defaultProps });

			expect(screen.getByText(/Showing 1 to 3 of 3 entries/)).toBeInTheDocument();
		});

		it('should show correct pagination info for second page', () => {
			render(DataTable, {
				props: {
					...defaultProps,
					currentPage: 2,
					totalItems: 25,
					totalPages: 3,
					pageSize: 10
				}
			});

			expect(screen.getByText(/Showing 11 to 20 of 25 entries/)).toBeInTheDocument();
		});

		it('should show correct pagination info for last page with partial data', () => {
			render(DataTable, {
				props: {
					...defaultProps,
					data: [
						{ id: 21, name: 'User 21', email: 'user21@example.com' },
						{ id: 22, name: 'User 22', email: 'user22@example.com' }
					],
					currentPage: 3,
					totalItems: 22,
					totalPages: 3,
					pageSize: 10
				}
			});

			expect(screen.getByText(/Showing 21 to 22 of 22 entries/)).toBeInTheDocument();
		});

		it('should show current page and total pages', () => {
			render(DataTable, {
				props: {
					...defaultProps,
					currentPage: 2,
					totalPages: 5
				}
			});

			expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
		});
	});

	describe('Pagination Controls', () => {
		it('should render previous and next buttons', () => {
			render(DataTable, { props: defaultProps });

			expect(screen.getByText('Previous')).toBeInTheDocument();
			expect(screen.getByText('Next')).toBeInTheDocument();
		});

		it('should disable previous button on first page', () => {
			render(DataTable, {
				props: {
					...defaultProps,
					currentPage: 1,
					totalPages: 3
				}
			});

			const prevButton = screen.getByText('Previous').closest('button');
			expect(prevButton).toBeDisabled();
		});

		it('should disable next button on last page', () => {
			render(DataTable, {
				props: {
					...defaultProps,
					currentPage: 3,
					totalPages: 3
				}
			});

			const nextButton = screen.getByText('Next').closest('button');
			expect(nextButton).toBeDisabled();
		});

		it('should enable both buttons on middle page', () => {
			render(DataTable, {
				props: {
					...defaultProps,
					currentPage: 2,
					totalPages: 3
				}
			});

			const prevButton = screen.getByText('Previous').closest('button');
			const nextButton = screen.getByText('Next').closest('button');

			expect(prevButton).not.toBeDisabled();
			expect(nextButton).not.toBeDisabled();
		});

		it('should disable both buttons when only one page', () => {
			render(DataTable, {
				props: {
					...defaultProps,
					currentPage: 1,
					totalPages: 1
				}
			});

			const prevButton = screen.getByText('Previous').closest('button');
			const nextButton = screen.getByText('Next').closest('button');

			expect(prevButton).toBeDisabled();
			expect(nextButton).toBeDisabled();
		});
	});

	describe('Row Selection', () => {
		it('should not show selection info by default', () => {
			render(DataTable, { props: defaultProps });

			expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
		});

		it('should show selection info when enabled', () => {
			render(DataTable, {
				props: {
					...defaultProps,
					enableSelection: true
				}
			});

			// Initially no rows selected
			expect(screen.getByText(/0 of 3 selected/)).toBeInTheDocument();
		});
	});

	describe('Parameter Prefix', () => {
		it('should use default param name without prefix', () => {
			render(DataTable, { props: defaultProps });

			// Just verify component renders without error
			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		it('should accept custom param prefix', () => {
			render(DataTable, {
				props: {
					...defaultProps,
					paramPrefix: 'user'
				}
			});

			// Just verify component renders without error
			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty data array', () => {
			render(DataTable, {
				props: {
					...defaultProps,
					data: [],
					totalItems: 0,
					totalPages: 0
				}
			});

			expect(screen.getByText('No results.')).toBeInTheDocument();
		});

		it('should handle single item', () => {
			render(DataTable, {
				props: {
					...defaultProps,
					data: [{ id: 1, name: 'Solo User', email: 'solo@example.com' }],
					totalItems: 1,
					totalPages: 1
				}
			});

			expect(screen.getByText('Solo User')).toBeInTheDocument();
			expect(screen.getByText(/Showing 1 to 1 of 1 entries/)).toBeInTheDocument();
		});

		it('should handle large datasets', () => {
			const largeData = Array.from({ length: 100 }, (_, i) => ({
				id: i + 1,
				name: `User ${i + 1}`,
				email: `user${i + 1}@example.com`
			}));

			render(DataTable, {
				props: {
					...defaultProps,
					data: largeData.slice(0, 10),
					totalItems: 100,
					totalPages: 10,
					currentPage: 1,
					pageSize: 10
				}
			});

			expect(screen.getByText('User 1')).toBeInTheDocument();
			expect(screen.getByText(/Showing 1 to 10 of 100 entries/)).toBeInTheDocument();
		});

		it('should update when props change', () => {
			const { rerender } = render(DataTable, { props: defaultProps });

			expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();

			rerender({
				...defaultProps,
				currentPage: 2,
				totalPages: 5
			});

			expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should render table structure', () => {
			const { container } = render(DataTable, { props: defaultProps });

			const table = container.querySelector('table');
			expect(table).toBeInTheDocument();
		});

		it('should have proper table headers', () => {
			const { container } = render(DataTable, { props: defaultProps });

			const headers = container.querySelectorAll('thead th');
			expect(headers.length).toBeGreaterThan(0);
		});

		it('should have proper table body', () => {
			const { container } = render(DataTable, { props: defaultProps });

			const tbody = container.querySelector('tbody');
			expect(tbody).toBeInTheDocument();
		});
	});
});
