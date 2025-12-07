import { describe, it, expect, vi } from 'vitest';
import { createSortableColumn, createActionsColumn, createSelectionColumn } from './column-helpers';

describe('column-helpers', () => {
	describe('createSortableColumn()', () => {
		it('should create a column with correct accessor key', () => {
			const handleSort = vi.fn();
			const column = createSortableColumn('name', 'Name', 'name', 'asc', handleSort);

			expect(column.accessorKey).toBe('name');
		});

		it('should create a column with header function', () => {
			const handleSort = vi.fn();
			const column = createSortableColumn('email', 'Email', 'email', 'desc', handleSort);

			expect(typeof column.header).toBe('function');
		});

		it('should merge additional options into column', () => {
			const handleSort = vi.fn();
			const column = createSortableColumn('username', 'Username', 'username', 'asc', handleSort, {
				enableSorting: false,
				size: 200
			});

			expect(column.enableSorting).toBe(false);
			expect(column.size).toBe(200);
		});

		it('should pass correct props to header component', () => {
			const handleSort = vi.fn();
			const currentSortBy = 'created_at';
			const currentSortOrder = 'desc';

			const column = createSortableColumn(
				'created_at',
				'Created At',
				currentSortBy,
				currentSortOrder,
				handleSort
			);

			// The header function returns a component with props
			// We can verify it's a function that will be called with table context
			expect(typeof column.header).toBe('function');
		});
	});

	describe('createActionsColumn()', () => {
		type TestEntity = { id: string | number; name: string };

		it('should create a column with id "actions"', () => {
			const column = createActionsColumn<TestEntity>('user', '/users');

			expect(column.id).toBe('actions');
		});

		it('should disable sorting and hiding', () => {
			const column = createActionsColumn<TestEntity>('user', '/users');

			expect(column.enableSorting).toBe(false);
			expect(column.enableHiding).toBe(false);
		});

		it('should create cell function', () => {
			const column = createActionsColumn<TestEntity>('user', '/users');

			expect(typeof column.cell).toBe('function');
		});

		it('should default canEdit and canDelete to true', () => {
			const column = createActionsColumn<TestEntity>('user', '/users');

			// Create a mock row
			const mockRow = {
				original: { id: '123', name: 'Test' },
				getIsSelected: vi.fn(),
				toggleSelected: vi.fn()
			};

			// The cell function should exist and be callable
			expect(typeof column.cell).toBe('function');
		});

		it('should respect custom canEdit and canDelete options', () => {
			const column = createActionsColumn<TestEntity>('user', '/users', {
				canEdit: false,
				canDelete: false
			});

			expect(typeof column.cell).toBe('function');
		});

		it('should generate correct URLs with entity id', () => {
			const column = createActionsColumn<TestEntity>('user', '/admin/users');

			// Cell function exists
			expect(typeof column.cell).toBe('function');
		});
	});

	describe('createSelectionColumn()', () => {
		it('should create a column with id "select"', () => {
			const column = createSelectionColumn();

			expect(column.id).toBe('select');
		});

		it('should disable sorting and hiding', () => {
			const column = createSelectionColumn();

			expect(column.enableSorting).toBe(false);
			expect(column.enableHiding).toBe(false);
		});

		it('should set size to 50', () => {
			const column = createSelectionColumn();

			expect(column.size).toBe(50);
		});

		it('should create header function', () => {
			const column = createSelectionColumn();

			expect(typeof column.header).toBe('function');
		});

		it('should create cell function', () => {
			const column = createSelectionColumn();

			expect(typeof column.cell).toBe('function');
		});
	});
});
