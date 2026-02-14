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
		url: new URL('http://localhost/entity/view/1/add/new'),
		data: {}
	}
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {}
}));

const createFormData = {
	entityAction: 'add',
	entityId: 'new',
	entityTypeId: '1',
	form: {
		valid: true,
		data: {
			name: '',
			description: '',
			active: true,
			entity_type_id: 1,
			state_id: null,
			district_id: null,
			block_id: null
		}
	},
	entity: null,
	entityType: { id: 1, name: 'CLF' },
	currentUser: { id: 1, name: 'Test User' }
};

const editFormData = {
	entityAction: 'edit',
	entityId: '5',
	entityTypeId: '1',
	form: {
		id: 'edit-form',
		valid: true,
		posted: false,
		errors: {},
		data: {
			name: 'My Entity',
			description: 'A test entity',
			active: true,
			entity_type_id: 1,
			state_id: 1,
			district_id: 10,
			block_id: 100
		}
	},
	entity: {
		name: 'My Entity',
		description: 'A test entity',
		active: true,
		entity_type_id: 1,
		state_id: 1,
		district_id: 10,
		block_id: 100,
		state: { id: 1, name: 'Maharashtra' },
		district: { id: 10, name: 'Pune' },
		block: { id: 100, name: 'Haveli' }
	},
	entityType: { id: 1, name: 'CLF' },
	currentUser: { id: 1, name: 'Test User' }
};

const editFormDataPartialLocation = {
	...editFormData,
	form: {
		id: 'edit-form-partial',
		valid: true,
		posted: false,
		errors: {},
		data: {
			name: 'State Only Entity',
			description: '',
			active: true,
			entity_type_id: 1,
			state_id: 2,
			district_id: null,
			block_id: null
		}
	},
	entity: {
		name: 'State Only Entity',
		description: '',
		active: true,
		entity_type_id: 1,
		state_id: 2,
		district_id: null,
		block_id: null,
		state: { id: 2, name: 'Karnataka' },
		district: null,
		block: null
	}
};

describe('Entity Form Page', () => {
	describe('Add mode - Create Record', () => {
		it('renders the create form with entity type name', () => {
			render(Page, { data: createFormData } as any);

			expect(screen.getByText('Create CLF Record')).toBeInTheDocument();
		});

		it('shows Name, Description, State, District and Block fields', () => {
			render(Page, { data: createFormData } as any);

			expect(screen.getByRole('heading', { name: /^name$/i })).toBeInTheDocument();
			expect(screen.getByRole('heading', { name: /^description$/i })).toBeInTheDocument();
			expect(screen.getByRole('heading', { name: /^state$/i })).toBeInTheDocument();
			expect(screen.getByRole('heading', { name: /^district$/i })).toBeInTheDocument();
			expect(screen.getByRole('heading', { name: /^block$/i })).toBeInTheDocument();
		});

		it('shows Cancel and Save buttons', () => {
			render(Page, { data: createFormData } as any);

			expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
		});

		it('enables Save button after entering name', async () => {
			const { container } = render(Page, { data: createFormData } as any);

			const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
			await fireEvent.input(nameInput, { target: { value: 'New Entity' } });

			const saveBtn = screen.getByRole('button', { name: /save/i });
			expect(saveBtn).toBeEnabled();
		});

		it('has Cancel link pointing to entity type view', () => {
			render(Page, { data: createFormData } as any);

			const cancelLink = screen.getByRole('link', { name: /cancel/i });
			expect(cancelLink).toHaveAttribute('href', '/entity/view/1');
		});

		it('renders name input as empty for new entity', () => {
			const { container } = render(Page, { data: createFormData } as any);

			const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
			expect(nameInput.value).toBe('');
		});

		it('renders description textarea as empty for new entity', () => {
			const { container } = render(Page, { data: createFormData } as any);

			const descTextarea = container.querySelector(
				'textarea[name="description"]'
			) as HTMLTextAreaElement;
			expect(descTextarea.value).toBe('');
		});
	});

	describe('Edit mode - Edit Record', () => {
		it('renders the edit form with entity type name', () => {
			render(Page, { data: editFormData } as any);

			expect(screen.getByText('Edit CLF Record')).toBeInTheDocument();
		});

		it('pre-fills name from entity data', () => {
			render(Page, { data: editFormData } as any);

			expect(screen.getByDisplayValue('My Entity')).toBeInTheDocument();
		});

		it('pre-fills description from entity data', () => {
			render(Page, { data: editFormData } as any);

			expect(screen.getByDisplayValue('A test entity')).toBeInTheDocument();
		});

		it('has Save button enabled when name is pre-filled', () => {
			render(Page, { data: editFormData } as any);

			const saveBtn = screen.getByRole('button', { name: /save/i });
			expect(saveBtn).toBeEnabled();
		});

		it('shows Cancel and Save buttons in edit mode', () => {
			render(Page, { data: editFormData } as any);

			expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
		});

		it('renders with entity that has partial location (state only)', () => {
			render(Page, { data: editFormDataPartialLocation } as any);

			expect(screen.getByDisplayValue('State Only Entity')).toBeInTheDocument();
		});
	});

	describe('Form structure', () => {
		it('renders as a form with POST method', () => {
			const { container } = render(Page, { data: createFormData } as any);

			const form = container.querySelector('form');
			expect(form).toBeInTheDocument();
			expect(form).toHaveAttribute('method', 'POST');
		});

		it('form action points to save endpoint', () => {
			const { container } = render(Page, { data: createFormData } as any);

			const form = container.querySelector('form');
			expect(form?.getAttribute('action')).toContain('?/save');
		});

		it('disables Save button when name is cleared in edit mode', async () => {
			const { container } = render(Page, { data: editFormData } as any);

			const nameInput = container.querySelector('input[name="name"]') as HTMLInputElement;
			await fireEvent.input(nameInput, { target: { value: '' } });

			const saveBtn = screen.getByRole('button', { name: /save/i });
			expect(saveBtn).toBeDisabled();
		});
	});
});
