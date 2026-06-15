import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { writable } from 'svelte/store';
import EntityRecordForm from './EntityRecordForm.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn((schema) => schema)
}));

vi.mock('$lib/components/StateSelection.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }))
}));

vi.mock('$lib/components/DistrictSelection.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }))
}));

vi.mock('$lib/components/BlockSelection.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }))
}));

const superFormRef = vi.hoisted(() => ({
	errors: null as ReturnType<typeof writable> | null
}));

vi.mock('sveltekit-superforms', () => ({
	superForm: (initialData: Record<string, unknown>) => {
		const data = (initialData as { data?: Record<string, unknown> })?.data ?? {};
		const errorsStore = writable<Record<string, unknown>>({});
		superFormRef.errors = errorsStore;
		return {
			form: writable(data),
			errors: errorsStore,
			enhance: () => () => {},
			submit: vi.fn()
		};
	}
}));

function makeForm(data: {
	name?: string;
	description?: string | null;
	state_id?: number | null;
	district_id?: number | null;
	block_id?: number | null;
}) {
	return { valid: true, data: { name: '', description: '', state_id: null, district_id: null, block_id: null, ...data } };
}

const createData = {
	entityAction: 'add' as const,
	entityTypeId: '42',
	form: makeForm({ name: '', description: '' }),
	entity: null,
	entityType: { id: 42, name: 'SHG' }
};

const editData = {
	entityAction: 'edit' as const,
	entityTypeId: '42',
	form: makeForm({ name: 'Kokan SHG', description: 'A group in Kokan' }),
	entity: {
		name: 'Kokan SHG',
		description: 'A group in Kokan',
		state: { id: 1, name: 'Maharashtra' },
		district: { id: 10, name: 'Ratnagiri' },
		block: { id: 100, name: 'Lanja' }
	},
	entityType: { id: 42, name: 'SHG' }
};

describe('EntityRecordForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		superFormRef.errors = null;
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Page title', () => {
		it('shows "Create SHG Record" in add mode', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(screen.getByText('Create SHG Record')).toBeInTheDocument();
		});

		it('shows "Edit SHG Record" in edit mode', () => {
			render(EntityRecordForm, { data: editData } as any);
			expect(screen.getByText('Edit SHG Record')).toBeInTheDocument();
		});

		it('falls back to "Entity" in the title when entityType is null', () => {
			render(EntityRecordForm, {
				data: { ...createData, entityType: null }
			} as any);
			expect(screen.getByText('Create Entity Record')).toBeInTheDocument();
		});

		it('does not show "Edit" title in add mode', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(screen.queryByText(/edit.*record/i)).not.toBeInTheDocument();
		});

		it('does not show "Create" title in edit mode', () => {
			render(EntityRecordForm, { data: editData } as any);
			expect(screen.queryByText(/create.*record/i)).not.toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Back link', () => {
		it('renders a back link with aria-label "Back to records"', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(screen.getByRole('link', { name: /back to records/i })).toBeInTheDocument();
		});

		it('back link points to /entity/view/{entityTypeId}', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(screen.getByRole('link', { name: /back to records/i })).toHaveAttribute(
				'href',
				'/entity/view/42'
			);
		});

		it('back link uses the correct entityTypeId', () => {
			render(EntityRecordForm, {
				data: { ...createData, entityTypeId: '99' }
			} as any);
			expect(screen.getByRole('link', { name: /back to records/i })).toHaveAttribute(
				'href',
				'/entity/view/99'
			);
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Form attributes', () => {
		it('form has method POST', () => {
			const { container } = render(EntityRecordForm, { data: createData } as any);
			expect(container.querySelector('form')).toHaveAttribute('method', 'POST');
		});

		it('form has action ?/save', () => {
			const { container } = render(EntityRecordForm, { data: createData } as any);
			expect(container.querySelector('form')).toHaveAttribute('action', '?/save');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Name field', () => {
		it('renders the "Name" section heading', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(screen.getByText('Name')).toBeInTheDocument();
		});

		it('renders the name input', () => {
			const { container } = render(EntityRecordForm, { data: createData } as any);
			expect(container.querySelector('input[name="name"]')).toBeInTheDocument();
		});

		it('name input has correct placeholder', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(screen.getByPlaceholderText('Name of this entity...')).toBeInTheDocument();
		});

		it('name input is empty in add mode', () => {
			const { container } = render(EntityRecordForm, { data: createData } as any);
			const input = container.querySelector('input[name="name"]') as HTMLInputElement;
			expect(input.value).toBe('');
		});

		it('name input is pre-filled in edit mode', () => {
			const { container } = render(EntityRecordForm, { data: editData } as any);
			const input = container.querySelector('input[name="name"]') as HTMLInputElement;
			expect(input.value).toBe('Kokan SHG');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Description field', () => {
		it('renders the "Description" section heading', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(screen.getByText('Description')).toBeInTheDocument();
		});

		it('renders the description textarea', () => {
			const { container } = render(EntityRecordForm, { data: createData } as any);
			expect(container.querySelector('textarea[name="description"]')).toBeInTheDocument();
		});

		it('description textarea has correct placeholder', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(
				screen.getByPlaceholderText('Brief description of this entity...')
			).toBeInTheDocument();
		});

		it('description textarea is empty in add mode', () => {
			const { container } = render(EntityRecordForm, { data: createData } as any);
			const textarea = container.querySelector(
				'textarea[name="description"]'
			) as HTMLTextAreaElement;
			expect(textarea.value).toBe('');
		});

		it('description textarea is pre-filled in edit mode', () => {
			const { container } = render(EntityRecordForm, { data: editData } as any);
			const textarea = container.querySelector(
				'textarea[name="description"]'
			) as HTMLTextAreaElement;
			expect(textarea.value).toBe('A group in Kokan');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Location section headings', () => {
		it('renders "State" section heading', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(screen.getByText('State')).toBeInTheDocument();
		});

		it('renders "District" section heading', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(screen.getByText('District')).toBeInTheDocument();
		});

		it('renders "Block" section heading', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(screen.getByText('Block')).toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Save button', () => {
		it('renders a Save button', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
		});

		it('Save button is DISABLED when name is empty', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
		});

		it('Save button is DISABLED when name is only whitespace', () => {
			render(EntityRecordForm, {
				data: { ...createData, form: makeForm({ name: '   ' }) }
			} as any);
			expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
		});

		it('Save button is ENABLED when name has a value', () => {
			render(EntityRecordForm, { data: editData } as any);
			expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
		});

		it('Save button becomes ENABLED after typing a name', async () => {
			const { container } = render(EntityRecordForm, { data: createData } as any);
			const input = container.querySelector('input[name="name"]') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'New Record' } });
			await tick();

			expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
		});

		it('Save button becomes DISABLED again when name is cleared', async () => {
			const { container } = render(EntityRecordForm, { data: editData } as any);
			const input = container.querySelector('input[name="name"]') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: '' } });
			await tick();

			expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Validation error display', () => {
		it('does NOT show a name error by default', () => {
			render(EntityRecordForm, { data: createData } as any);
			expect(screen.queryByText('Record name is required')).not.toBeInTheDocument();
		});

		it('shows name error when $errors.name is set', async () => {
			render(EntityRecordForm, { data: createData } as any);
			superFormRef.errors!.set({ name: ['Record name is required'] });
			await tick();
			expect(screen.getByText('Record name is required')).toBeInTheDocument();
		});

		it('clears name error when $errors.name is removed', async () => {
			render(EntityRecordForm, { data: createData } as any);
			superFormRef.errors!.set({ name: ['Record name is required'] });
			await tick();
			superFormRef.errors!.set({});
			await tick();
			expect(screen.queryByText('Record name is required')).not.toBeInTheDocument();
		});

		it('shows state_id error when $errors.state_id is set', async () => {
			render(EntityRecordForm, { data: createData } as any);
			superFormRef.errors!.set({ state_id: ['State is required'] });
			await tick();
			expect(screen.getByText('State is required')).toBeInTheDocument();
		});

		it('shows district_id error when $errors.district_id is set', async () => {
			render(EntityRecordForm, { data: createData } as any);
			superFormRef.errors!.set({ district_id: ['District is required'] });
			await tick();
			expect(screen.getByText('District is required')).toBeInTheDocument();
		});

		it('shows block_id error when $errors.block_id is set', async () => {
			render(EntityRecordForm, { data: createData } as any);
			superFormRef.errors!.set({ block_id: ['Block is required'] });
			await tick();
			expect(screen.getByText('Block is required')).toBeInTheDocument();
		});
	});
});
