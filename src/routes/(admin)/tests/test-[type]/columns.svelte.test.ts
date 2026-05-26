import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestColumns, type Test } from './columns';
import type { User } from '$lib/utils/permissions.js';

vi.mock('$lib/components/ui/data-table/index.js', () => ({
	renderComponent: vi.fn((_Component, props) => props)
}));

vi.mock('$lib/utils/permissions.js', async (importOriginal) => {
	return await importOriginal();
});

vi.mock('$lib/components/data-table/column-helpers', () => ({
	createSortableColumn: vi.fn(() => ({ id: 'mocked-sortable' }))
}));

vi.mock('$lib/components/data-table/index.js', () => ({
	DataTableActions: {}
}));

vi.mock('$lib/components/data-table/DateCell.svelte', () => ({ default: {} }));
vi.mock('$lib/components/data-table/TagCell.svelte', () => ({ default: {} }));
vi.mock('$lib/components/data-table/TruncatedTextCell.svelte', () => ({ default: {} }));
vi.mock('$lib/components/data-table/TestStatusBadge.svelte', () => ({ default: {} }));
vi.mock('svelte-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('$app/paths', () => ({ resolve: vi.fn((path: string) => path) }));
vi.mock('$lib/utils', () => ({ downloadQRCode: vi.fn() }));

const makeUser = (id: string, permissions: string[] = []): User =>
	({ id, permissions, states: [], districts: [] }) as unknown as User;

const makeTest = (created_by_id: string | null): Test => ({
	id: 't1',
	name: 'Test',
	created_by_id,
	modified_date: '2024-01-01',
	is_template: false,
	status: 'draft' as any
});

function getActionProps(user: User | null, test: Test, canEdit = true, canDelete = true) {
	const columns = createTestColumns(
		'',
		'asc',
		vi.fn(),
		1,
		25,
		false,
		'http://test-taker.example.com',
		vi.fn(),
		(key: any) => key,
		{ canEdit, canDelete },
		user
	);
	const actionsCol = columns.find((c: any) => c.id === 'actions') as any;
	return actionsCol.cell({ row: { original: test } });
}

describe('createTestColumns — edit/delete visibility based on ownership', () => {
	const currentUser = makeUser('1');
	const otherUser = makeUser('99');
	const superAdminUser = makeUser('99', ['create_organization']);
	const systemAdminUser = makeUser('99', ['update_my_organization']);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('shows edit and delete buttons when the test belongs to the current user', () => {
		const props = getActionProps(currentUser, makeTest('1'));
		expect(props.canEdit).toBe(true);
		expect(props.canDelete).toBe(true);
	});

	it('hides edit and delete buttons when the test belongs to a different user', () => {
		const props = getActionProps(currentUser, makeTest('99'));
		expect(props.canEdit).toBe(false);
		expect(props.canDelete).toBe(false);
	});

	it('shows edit and delete for a super admin even on another user\'s test', () => {
		const props = getActionProps(superAdminUser, makeTest('1'));
		expect(props.canEdit).toBe(true);
		expect(props.canDelete).toBe(true);
	});

	it('shows edit and delete for a system admin even on another user\'s test', () => {
		const props = getActionProps(systemAdminUser, makeTest('1'));
		expect(props.canEdit).toBe(true);
		expect(props.canDelete).toBe(true);
	});

	it('hides edit and delete when created_by_id is null (unknown ownership)', () => {
		const props = getActionProps(currentUser, makeTest(null));
		expect(props.canEdit).toBe(false);
		expect(props.canDelete).toBe(false);
	});

	it('ownership overrides canEdit permission flag — owner can always edit', () => {
		const props = getActionProps(currentUser, makeTest('1'), false, true);
		expect(props.canEdit).toBe(true);
	});

	it('ownership overrides canDelete permission flag — owner can always delete', () => {
		const props = getActionProps(currentUser, makeTest('1'), true, false);
		expect(props.canDelete).toBe(true);
	});
});
