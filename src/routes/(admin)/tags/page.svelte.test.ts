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

const emptyMockData = {
	user: { id: 1, organization_id: 10, permissions: ['create_tag'] },
	tagTypes: { items: [], total: 0, pages: 0 },
	totalPages: 0,
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

	describe('page header', () => {
		it('renders Tag Management title', () => {
			render(TagManagementPage, { data: mockData });
			expect(screen.getByRole('heading', { name: /Tag Management/i })).toBeInTheDocument();
		});

		it('renders Create Tag Type button when user has permission', () => {
			vi.mocked(canCreate).mockReturnValue(true);
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
	});

	describe('empty state', () => {
		it('shows empty state when no tag types and no search', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			render(TagManagementPage, { data: emptyMockData });
			expect(screen.getByText('No tag types yet')).toBeInTheDocument();
		});

		it('does not show empty state when search is active with no results', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			const searchData = {
				...emptyMockData,
				params: { ...emptyMockData.params, search: 'nonexistent' }
			};
			render(TagManagementPage, { data: searchData });
			expect(screen.queryByText('No tag types yet')).not.toBeInTheDocument();
		});
	});

	describe('table rendering', () => {
		it('renders tag types as rows in the table', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(TagManagementPage, { data: mockData });
			expect(screen.getByText('Difficulty Level')).toBeInTheDocument();
			expect(screen.getByText('Subject')).toBeInTheDocument();
			expect(
				screen.getByText('Classify questions by how challenging they are')
			).toBeInTheDocument();
		});

		it('renders tags as chips within their tag type rows', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(TagManagementPage, { data: mockData });
			expect(screen.getByText('Easy')).toBeInTheDocument();
			expect(screen.getByText('Medium')).toBeInTheDocument();
			expect(screen.getByText('Hard')).toBeInTheDocument();
			expect(screen.getByText('Geography')).toBeInTheDocument();
			expect(screen.getByText('Science')).toBeInTheDocument();
		});

		it('renders tag type with no tags showing only Add tag button', () => {
			vi.mocked(canCreate).mockReturnValue(true);
			const dataWithEmptyTags = {
				...mockData,
				tagTypes: {
					...mockData.tagTypes,
					items: [{ id: 3, name: 'Language', description: '', tags: [] }]
				}
			};
			render(TagManagementPage, { data: dataWithEmptyTags });
			expect(screen.getByText('Language')).toBeInTheDocument();
			expect(screen.getByText('Add tag')).toBeInTheDocument();
		});
	});

	describe('search', () => {
		it('search input renders with correct placeholder', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(TagManagementPage, { data: mockData });
			const input = screen.getByPlaceholderText('Search tag types or tags...');
			expect(input).toBeInTheDocument();
		});

		it('search input accepts user input', async () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(TagManagementPage, { data: mockData });
			const input = screen.getByPlaceholderText('Search tag types or tags...') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: 'hello' } });
			expect(input.value).toBe('hello');
		});
	});

	describe('sorting', () => {
		it('clicking Tag Types header calls goto with sort params', async () => {
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
	});

	describe('permissions-based UI', () => {
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
	});

	describe('pagination', () => {
		it('shows pagination info', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(TagManagementPage, { data: mockData });
			expect(screen.getByText(/Showing 1 to/)).toBeInTheDocument();
			expect(screen.getByText('Previous')).toBeInTheDocument();
			expect(screen.getByText('Next')).toBeInTheDocument();
		});

		it('disables Previous button on first page', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(TagManagementPage, { data: mockData });
			const prevButton = screen.getByText('Previous');
			expect(prevButton).toBeDisabled();
		});

		it('disables Next button on last page', () => {
			vi.mocked(canCreate).mockReturnValue(false);
			render(TagManagementPage, { data: mockData });
			const nextButton = screen.getByText('Next');
			expect(nextButton).toBeDisabled();
		});
	});
});
