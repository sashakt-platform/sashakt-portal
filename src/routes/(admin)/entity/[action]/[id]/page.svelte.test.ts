import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Page from './+page.svelte';

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	onNavigate: vi.fn(),
	disableScrollHandling: vi.fn(),
	invalidateAll: vi.fn()
}));

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/entity/view/1'),
		data: {}
	}
}));

vi.mock('$lib/utils/permissions.js', () => ({
	canCreate: vi.fn(() => true),
	canUpdate: vi.fn(() => true),
	canDelete: vi.fn(() => true),
	requirePermission: vi.fn(),
	PERMISSIONS: {}
}));

vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

const createFormData = {
	action: 'add',
	id: 'new',
	form: {
		valid: true,
		data: { name: '', description: '' }
	},
	entityType: null,
	currentUser: { id: 1, name: 'Test User' }
};

const editFormData = {
	action: 'edit',
	id: '1',
	form: {
		valid: true,
		data: { name: '', description: '' }
	},
	entityType: { name: 'CLF', description: 'Community Level Federation' },
	currentUser: { id: 1, name: 'Test User' }
};

const viewData = {
	action: 'view',
	id: '1',
	entities: {
		items: [
			{ id: 1, name: 'Entity 1', state: { id: 1, name: 'Maharashtra' } },
			{ id: 2, name: 'Entity 2', state: { id: 2, name: 'Karnataka' } }
		],
		total: 2,
		pages: 1
	},
	entityType: { id: 1, name: 'CLF', description: 'Community Level Federation' },
	entityTypeId: '1',
	totalPages: 1,
	params: { page: 1, size: 25, search: '', sortBy: '', sortOrder: 'asc' },
	user: { id: 1, name: 'Test User', permissions: [] }
};

describe('Entity Page', () => {
	describe('View mode - Entity List', () => {
		it('renders the entity list view when action is view', () => {
			render(Page, { data: viewData } as any);

			expect(screen.getByText('CLF')).toBeInTheDocument();
		});

		it('shows the entity type name as title', () => {
			render(Page, { data: viewData } as any);

			expect(screen.getByText('CLF')).toBeInTheDocument();
		});

		it('shows Add button when user has create permission', () => {
			render(Page, { data: viewData } as any);

			expect(screen.getByText('Add CLF Record')).toBeInTheDocument();
		});

		it('shows Back to Entities button', () => {
			render(Page, { data: viewData } as any);

			expect(screen.getByText('Back to Entities')).toBeInTheDocument();
		});

		it('renders search input', () => {
			render(Page, { data: viewData } as any);

			expect(screen.getByPlaceholderText('Search records...')).toBeInTheDocument();
		});

		it('renders with empty entities list', () => {
			const emptyViewData = {
				...viewData,
				entities: { items: [], total: 0, pages: 0 }
			};

			render(Page, { data: emptyViewData } as any);

			expect(screen.getByText('CLF')).toBeInTheDocument();
		});
	});

	describe('Add mode - Entity Form', () => {
		it('renders the create entity form when action is add', () => {
			render(Page, { data: createFormData } as any);

			expect(screen.getByText('Create Entity')).toBeInTheDocument();
		});

		it('shows Name and Description fields', () => {
			render(Page, { data: createFormData } as any);

			expect(screen.getByRole('heading', { name: /name/i })).toBeInTheDocument();
			expect(screen.getByRole('heading', { name: /description/i })).toBeInTheDocument();
		});

		it('shows Cancel and Save buttons', () => {
			render(Page, { data: createFormData } as any);

			expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
		});

		it('enables Save button after entering name', async () => {
			const { container } = render(Page, { data: createFormData } as any);

			const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
			await fireEvent.input(nameInput, { target: { value: 'New Entity Type' } });

			const saveBtn = screen.getByRole('button', { name: /save/i });
			expect(saveBtn).toBeEnabled();
		});
	});

	describe('Edit mode - Entity Form', () => {
		it('renders the edit entity form when action is edit', () => {
			render(Page, { data: editFormData } as any);

			expect(screen.getByText('Edit Entity')).toBeInTheDocument();
		});

		it('pre-fills name and description from entity type data', () => {
			render(Page, { data: editFormData } as any);

			expect(screen.getByDisplayValue('CLF')).toBeInTheDocument();
			expect(screen.getByDisplayValue('Community Level Federation')).toBeInTheDocument();
		});

		it('has Save button enabled when name is pre-filled', () => {
			render(Page, { data: editFormData } as any);

			const saveBtn = screen.getByRole('button', { name: /save/i });
			expect(saveBtn).toBeEnabled();
		});
	});
});
