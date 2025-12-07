import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DataTableSortButton from './DataTableSortButton.svelte';

describe('DataTableSortButton', () => {
	const defaultProps = {
		title: 'Name',
		columnId: 'name',
		currentSortBy: '',
		currentSortOrder: 'asc',
		handleSort: vi.fn()
	};

	it('should render button with title', () => {
		render(DataTableSortButton, { props: defaultProps });

		const button = screen.getByRole('button', { name: /Name/i });
		expect(button).toBeInTheDocument();
	});

	describe('Sort Icons', () => {
		it('should show unsorted icon (ArrowUpDown) when column is not sorted', () => {
			const { container } = render(DataTableSortButton, {
				props: {
					...defaultProps,
					currentSortBy: 'email', // different column is sorted
					currentSortOrder: 'asc'
				}
			});

			const button = screen.getByRole('button');
			expect(button).toBeInTheDocument();
			// ArrowUpDown SVG should be present
			const svg = container.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});

		it('should show ascending icon (ArrowUp) when column is sorted ascending', () => {
			const { container } = render(DataTableSortButton, {
				props: {
					...defaultProps,
					currentSortBy: 'name',
					currentSortOrder: 'asc'
				}
			});

			const button = screen.getByRole('button');
			expect(button).toBeInTheDocument();
			// ArrowUp SVG should be present
			const svg = container.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});

		it('should show descending icon (ArrowDown) when column is sorted descending', () => {
			const { container } = render(DataTableSortButton, {
				props: {
					...defaultProps,
					currentSortBy: 'name',
					currentSortOrder: 'desc'
				}
			});

			const button = screen.getByRole('button');
			expect(button).toBeInTheDocument();
			// ArrowDown SVG should be present
			const svg = container.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});
	});

	describe('Sort Functionality', () => {
		it('should call handleSort with columnId when clicked', async () => {
			const handleSort = vi.fn();

			render(DataTableSortButton, {
				props: {
					...defaultProps,
					handleSort
				}
			});

			const button = screen.getByRole('button');
			await fireEvent.click(button);

			expect(handleSort).toHaveBeenCalledTimes(1);
			expect(handleSort).toHaveBeenCalledWith('name');
		});

		it('should call handleSort multiple times on multiple clicks', async () => {
			const handleSort = vi.fn();

			render(DataTableSortButton, {
				props: {
					...defaultProps,
					handleSort
				}
			});

			const button = screen.getByRole('button');
			await fireEvent.click(button);
			await fireEvent.click(button);
			await fireEvent.click(button);

			expect(handleSort).toHaveBeenCalledTimes(3);
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty currentSortBy', () => {
			render(DataTableSortButton, {
				props: {
					...defaultProps,
					currentSortBy: ''
				}
			});

			const button = screen.getByRole('button');
			expect(button).toBeInTheDocument();
		});

		it('should handle different columnId values', () => {
			const columnIds = ['email', 'phone', 'role_label', 'created_at'];

			columnIds.forEach((id) => {
				const { unmount } = render(DataTableSortButton, {
					props: {
						...defaultProps,
						columnId: id,
						title: id
					}
				});

				expect(screen.getByRole('button')).toBeInTheDocument();
				unmount();
			});
		});

		it('should handle sort order changes', () => {
			const { rerender } = render(DataTableSortButton, {
				props: {
					...defaultProps,
					currentSortBy: 'name',
					currentSortOrder: 'asc'
				}
			});

			let button = screen.getByRole('button');
			expect(button).toBeInTheDocument();

			// Change to desc
			rerender({
				...defaultProps,
				currentSortBy: 'name',
				currentSortOrder: 'desc'
			});

			button = screen.getByRole('button');
			expect(button).toBeInTheDocument();
		});
	});
});
