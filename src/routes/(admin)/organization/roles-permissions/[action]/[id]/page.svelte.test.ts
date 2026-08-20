import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import RoleCreateEditPage from './+page.svelte';

const roleFormMock = vi.fn(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }));

vi.mock('./RoleForm.svelte', () => ({
	default: (...args: unknown[]) => roleFormMock(...args)
}));

function makeData(overrides: Record<string, unknown> = {}) {
	return {
		action: 'add',
		id: 'new',
		form: {},
		availableRoles: [],
		...overrides
	};
}

describe('Role Create / Edit Page (+page.svelte)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders without crashing in add mode', () => {
		expect(() => render(RoleCreateEditPage, { data: makeData() } as never)).not.toThrow();
	});

	it('renders without crashing in edit mode', () => {
		expect(() =>
			render(RoleCreateEditPage, {
				data: makeData({ action: 'edit', id: '5' })
			} as never)
		).not.toThrow();
	});

	it('renders the RoleForm component', () => {
		render(RoleCreateEditPage, { data: makeData() } as never);
		expect(roleFormMock).toHaveBeenCalledTimes(1);
	});

	it('passes the page data straight through to RoleForm', () => {
		const data = makeData({ action: 'edit', id: '5' });
		render(RoleCreateEditPage, { data } as never);

		const [, props] = roleFormMock.mock.calls[0] as [unknown, { data: unknown }];
		expect(props.data).toEqual(data);
	});
});
