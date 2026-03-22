import { render, fireEvent, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import TagManagementPage from './+page.svelte';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { goto } from '$app/navigation';
import { page } from '$app/state';

const mockData = {
	user: { id: 1, organization_id: 10, permissions: ['create_tag', 'update_tag', 'delete_tag'] },

	tagTypes: {
		items: [
			{
				id: 1,
				name: 'Difficulty Level',
				description: 'Classify questions by how challenging they are',
				tags: [
					{ id: 10, name: 'Easy' },
					{ id: 11, name: 'Medium' },
					{ id: 12, name: 'Hard' }
				]
			},
			{
				id: 2,
				name: 'Subject',
				description: 'The subject area the question belongs to',
				tags: [
					{ id: 20, name: 'Geography' },
					{ id: 21, name: 'Science' }
				]
			}
		],
		total: 2,
		pages: 1
	},

	totalPages: 1,
	params: { page: 1, size: 25, search: '', sortBy: '', sortOrder: 'asc' }
};

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));
vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/tags')
	}
}));
vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => ({ destroy: vi.fn() }))
}));
vi.mock('$lib/utils/permissions.js', () => ({
	canCreate: vi.fn(),
	canUpdate: vi.fn(),
	canDelete: vi.fn()
}));

import { canCreate, canUpdate, canDelete } from '$lib/utils/permissions.js';
vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

describe('TagManagementPage', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		page.url = new URL('http://localhost/tags');
	});

	it('renders Tag Management title', () => {
		render(TagManagementPage, { data: mockData });
		expect(screen.getByRole('heading', { name: /Tag Management/i })).toBeInTheDocument();
	});

	it('renders Create Tag Type button when user has permission', () => {
		vi.mocked(canCreate).mockReturnValue(true);
		vi.mocked(canUpdate).mockReturnValue(true);
		vi.mocked(canDelete).mockReturnValue(true);
		render(TagManagementPage, { data: mockData });
		expect(screen.getByText(/Create Tag Type/i)).toBeInTheDocument();
	});

	it('hides Create Tag Type button when user lacks permissions', () => {
		vi.mocked(canCreate).mockReturnValue(false);
		vi.mocked(canUpdate).mockReturnValue(false);
		vi.mocked(canDelete).mockReturnValue(false);

		render(TagManagementPage, { data: mockData });
		expect(screen.queryByText('Create Tag Type')).not.toBeInTheDocument();
	});

	it('renders tag types as rows in the table', () => {
		vi.mocked(canCreate).mockReturnValue(false);
		render(TagManagementPage, { data: mockData });
		expect(screen.getByText('Difficulty Level')).toBeInTheDocument();
		expect(screen.getByText('Subject')).toBeInTheDocument();
		expect(screen.getByText('Classify questions by how challenging they are')).toBeInTheDocument();
	});

	it('renders tags as chips grouped by tag type', () => {
		vi.mocked(canCreate).mockReturnValue(false);
		render(TagManagementPage, { data: mockData });
		expect(screen.getByText('Easy')).toBeInTheDocument();
		expect(screen.getByText('Medium')).toBeInTheDocument();
		expect(screen.getByText('Hard')).toBeInTheDocument();
		expect(screen.getByText('Geography')).toBeInTheDocument();
		expect(screen.getByText('Science')).toBeInTheDocument();
	});

	it('search input works', async () => {
		vi.mocked(canCreate).mockReturnValue(false);
		render(TagManagementPage, { data: mockData });
		const input = screen.getByPlaceholderText('Search tag types or tags...') as HTMLInputElement;
		await fireEvent.input(input, { target: { value: 'hello' } });
		expect(input.value).toBe('hello');
	});

	it('sorting calls goto with correct params', async () => {
		vi.mocked(canCreate).mockReturnValue(false);
		render(TagManagementPage, { data: mockData });

		const sortButton = screen.getByText('Tag Types').closest('button');
		expect(sortButton).toBeTruthy();
		await fireEvent.click(sortButton!);
		expect(goto).toHaveBeenCalled();
		const call = vi.mocked(goto).mock.calls[0][0].toString();
		expect(call).toContain('sort_by=name');
		expect(call).toContain('sort_order');
	});

	it('shows Add tag buttons when user has create permission', () => {
		vi.mocked(canCreate).mockReturnValue(true);
		render(TagManagementPage, { data: mockData });
		const addButtons = screen.getAllByText('Add tag');
		expect(addButtons.length).toBeGreaterThan(0);
	});

	it('hides Add tag buttons when user lacks create permission', () => {
		vi.mocked(canCreate).mockReturnValue(false);
		render(TagManagementPage, { data: mockData });
		expect(screen.queryByText('Add tag')).not.toBeInTheDocument();
	});

	it('shows pagination info', () => {
		vi.mocked(canCreate).mockReturnValue(false);
		render(TagManagementPage, { data: mockData });
		expect(screen.getByText(/Showing 1 to/)).toBeInTheDocument();
		expect(screen.getByText('Previous')).toBeInTheDocument();
		expect(screen.getByText('Next')).toBeInTheDocument();
	});
});
