import { render, fireEvent, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import TagManagementPage from './+page.svelte';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { goto } from '$app/navigation';
import { page } from '$app/state';

const mockData = {
	user: { id: 1, permissions: ['create_tag', 'update_tag', 'delete_tag'] },

	tags: {
		items: [{ id: 1, name: 'tag1', description: null, is_active: true }],
		total: 1,
		page: 1,
		size: 25,
		pages: 1
	},

	tagTypes: {
		items: [{ id: 10, name: 'type1' }],
		total: 1,
		page: 1,
		size: 25,
		pages: 1
	},

	tagsParams: { page: 1, size: 25, search: '', sortBy: '', sortOrder: 'asc' },
	tagTypesParams: { page: 1, size: 25, search: '', sortBy: '', sortOrder: 'asc' },

	tagsTotalPages: 1,
	tagTypesTotalPages: 1
};

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));
vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/tags')
	}
}));

describe('TagManagementPage', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		page.url = new URL('http://localhost/tags');
	});
	test('renders Tag Management title', () => {
		render(TagManagementPage, { data: mockData });

		expect(screen.getByRole('heading', { name: /tag management/i })).toBeInTheDocument();
		expect(screen.getByText(/manage tags and tag types/i)).toBeInTheDocument();
	});
	test('renders Create buttons when user has permission', () => {
		render(TagManagementPage, { data: mockData });
		expect(
			screen.getByRole('button', {
				name: /create a tag/i
			})
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', {
				name: /create tag type/i
			})
		).toBeInTheDocument();
	});
	test('create buttons hidden when user lacks permissions', async () => {
		const noPermData = { ...mockData, user: { permissions: [] } };

		render(TagManagementPage, { data: noPermData });

		expect(screen.queryByText('Create a Tag')).not.toBeInTheDocument();
		expect(screen.queryByText('Create Tag Type')).not.toBeInTheDocument();
	});

	test('search input works for tags', async () => {
		render(TagManagementPage, { data: mockData });
		const input = screen.getByPlaceholderText('Search tags...') as HTMLInputElement;
		await fireEvent.input(input, { target: { value: 'hello' } });
		expect(input.value).toBe('hello');
	});
	test('tag types search input updates value', async () => {
		const { page } = await import('$app/state');
		page.url = new URL('http://localhost/tags?tab=tagtype');

		render(TagManagementPage, { data: mockData });

		const input = screen.getByPlaceholderText('Search tag types...') as HTMLInputElement;

		await fireEvent.input(input, { target: { value: 'type' } });

		expect(input.value).toBe('type');
	});

	test('DataTable shows tag items', async () => {
		render(TagManagementPage, { data: mockData });

		expect(await screen.findByText('tag1')).toBeInTheDocument();
	});
	test('sorting tags calls goto with correct params', async () => {
		render(TagManagementPage, { data: mockData });

		const columnHeader = screen.getByRole('columnheader', { name: 'Name' });
		const sortBtn = columnHeader.closest('th')!.querySelector('button');
		expect(sortBtn).toBeTruthy();
		await fireEvent.click(sortBtn!);
		expect(goto).toHaveBeenCalled();
		const call = vi.mocked(goto).mock.calls[0][0].toString();
		console.log(call);

		expect(call).toContain('tagsSortBy');
		expect(call).toContain('tagsSortOrder');
	});
	test('sorting tag types calls goto', async () => {
		page.url = new URL('http://localhost/tags?tab=tagtype');

		render(TagManagementPage, { data: mockData });

		const columnHeader = screen.getByRole('columnheader', { name: 'Name' });
		const sortBtn = columnHeader.closest('th')!.querySelector('button');
		expect(sortBtn).toBeTruthy();
		await fireEvent.click(sortBtn!);
		const call = vi.mocked(goto).mock.calls.at(0)![0].toString();
		console.log('call2', call);

		expect(call).toContain('tagTypesSortBy');
		expect(call).toContain('tagTypesSortOrder');
		expect(call).toContain('tagTypesPage=1');
	});
});
