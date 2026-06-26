import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import type { ComponentProps } from 'svelte';
import { tick } from 'svelte';
import { writable } from 'svelte/store';
import EntityForm from './EntityForm.svelte';
import { setCustomNomenclature, resetNomenclature } from '$lib/test-utils/nomenclature-mock';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn((schema) => schema)
}));

vi.mock('$lib/nomenclature', async () => {
	const { createNomenclatureMock } = await import('$lib/test-utils/nomenclature-mock');
	return createNomenclatureMock();
});

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

function makeForm(data: { name: string; description?: string }) {
	return { valid: true, data };
}

const createData = {
	action: 'add' as const,
	form: makeForm({ name: '', description: '' })
};

const editData = {
	action: 'edit' as const,
	form: makeForm({ name: 'CLF', description: 'Community Level Federation' })
};

function renderEntityForm(data: typeof createData | typeof editData) {
	return render(EntityForm, { data } as ComponentProps<typeof EntityForm>);
}

describe('EntityForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		superFormRef.errors = null;
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Page title', () => {
		it('shows "Create Entity" heading in add mode', () => {
			renderEntityForm(createData);
			expect(screen.getByText('Create Entity')).toBeInTheDocument();
		});

		it('shows "Edit Entity" heading in edit mode', () => {
			renderEntityForm(editData);
			expect(screen.getByText('Edit Entity')).toBeInTheDocument();
		});

		it('does not show "Edit Entity" heading in add mode', () => {
			renderEntityForm(createData);
			expect(screen.queryByText('Edit Entity')).not.toBeInTheDocument();
		});

		it('does not show "Create Entity" heading in edit mode', () => {
			renderEntityForm(editData);
			expect(screen.queryByText('Create Entity')).not.toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Back link', () => {
		it('renders a back link', () => {
			renderEntityForm(createData);
			expect(screen.getByRole('link', { name: /back to entities/i })).toBeInTheDocument();
		});

		it('back link points to /entity', () => {
			renderEntityForm(createData);
			const link = screen.getByRole('link', { name: /back to entities/i });
			expect(link).toHaveAttribute('href', '/entity');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Form attributes', () => {
		it('form has method POST', () => {
			const { container } = renderEntityForm(createData);
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
		});

		it('form has action ?/save', () => {
			const { container } = renderEntityForm(createData);
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('action', '?/save');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Name field', () => {
		it('renders the Name label', () => {
			renderEntityForm(createData);
			expect(screen.getByText('Entity Name')).toBeInTheDocument();
		});

		it('renders the name input', () => {
			const { container } = renderEntityForm(createData);
			expect(container.querySelector('input[name="name"]')).toBeInTheDocument();
		});

		it('name input has correct placeholder in add mode', () => {
			renderEntityForm(createData);
			expect(screen.getByPlaceholderText('Name of this entity...')).toBeInTheDocument();
		});

		it('name input is empty in add mode', () => {
			const { container } = renderEntityForm(createData);
			const input = container.querySelector('input[name="name"]') as HTMLInputElement;
			expect(input.value).toBe('');
		});

		it('name input is pre-filled in edit mode', () => {
			const { container } = renderEntityForm(editData);
			const input = container.querySelector('input[name="name"]') as HTMLInputElement;
			expect(input.value).toBe('CLF');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Description field', () => {
		it('renders the Description label', () => {
			renderEntityForm(createData);
			expect(screen.getByText('Description')).toBeInTheDocument();
		});

		it('renders the description textarea', () => {
			const { container } = renderEntityForm(createData);
			expect(container.querySelector('textarea[name="description"]')).toBeInTheDocument();
		});

		it('description textarea has correct placeholder', () => {
			renderEntityForm(createData);
			expect(
				screen.getByPlaceholderText('Brief description of this entity...')
			).toBeInTheDocument();
		});

		it('description textarea is empty in add mode', () => {
			const { container } = renderEntityForm(createData);
			const textarea = container.querySelector(
				'textarea[name="description"]'
			) as HTMLTextAreaElement;
			expect(textarea.value).toBe('');
		});

		it('description textarea is pre-filled in edit mode', () => {
			const { container } = renderEntityForm(editData);
			const textarea = container.querySelector(
				'textarea[name="description"]'
			) as HTMLTextAreaElement;
			expect(textarea.value).toBe('Community Level Federation');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Save button', () => {
		it('renders the Save button with label "Save Entity"', () => {
			renderEntityForm(createData);
			expect(screen.getByRole('button', { name: /save entity/i })).toBeInTheDocument();
		});

		it('Save button is DISABLED when name is empty', () => {
			renderEntityForm(createData);
			expect(screen.getByRole('button', { name: /save entity/i })).toBeDisabled();
		});

		it('Save button is DISABLED when name is only whitespace', () => {
			renderEntityForm({ ...createData, form: makeForm({ name: '   ' }) });
			expect(screen.getByRole('button', { name: /save entity/i })).toBeDisabled();
		});

		it('Save button is ENABLED when name has a value in edit mode', () => {
			renderEntityForm(editData);
			expect(screen.getByRole('button', { name: /save entity/i })).toBeEnabled();
		});

		it('Save button becomes ENABLED after the user types a name', async () => {
			const { container } = renderEntityForm(createData);
			const input = container.querySelector('input[name="name"]') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'New Entity' } });
			await tick();

			expect(screen.getByRole('button', { name: /save entity/i })).toBeEnabled();
		});

		it('Save button becomes DISABLED again when name is cleared', async () => {
			const { container } = renderEntityForm(editData);
			const input = container.querySelector('input[name="name"]') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: '' } });
			await tick();

			expect(screen.getByRole('button', { name: /save entity/i })).toBeDisabled();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Validation error display', () => {
		it('does NOT show a name error message when there are no errors', () => {
			renderEntityForm(createData);
			expect(screen.queryByText('Entity name is required')).not.toBeInTheDocument();
		});

		it('shows the name error message when $errors.name is set', async () => {
			renderEntityForm(createData);

			superFormRef.errors!.set({ name: ['Entity name is required'] });
			await tick();

			expect(screen.getByText('Entity name is required')).toBeInTheDocument();
		});

		it('clears the name error message when $errors.name is removed', async () => {
			renderEntityForm(createData);

			superFormRef.errors!.set({ name: ['Entity name is required'] });
			await tick();
			superFormRef.errors!.set({});
			await tick();

			expect(screen.queryByText('Entity name is required')).not.toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Custom nomenclature labels', () => {
		afterEach(() => {
			resetNomenclature();
		});

		it('renders custom heading in add mode when entity is overridden', () => {
			setCustomNomenclature({ entity: 'Group' });
			renderEntityForm(createData);
			expect(screen.getByText('Create Group')).toBeInTheDocument();
			expect(screen.queryByText('Create Entity')).not.toBeInTheDocument();
		});

		it('renders custom heading in edit mode when entity is overridden', () => {
			setCustomNomenclature({ entity: 'Group' });
			renderEntityForm(editData);
			expect(screen.getByText('Edit Group')).toBeInTheDocument();
		});

		it('renders custom back link label when entities is overridden', () => {
			setCustomNomenclature({ entities: 'Groups' });
			renderEntityForm(createData);
			expect(screen.getByRole('link', { name: /back to groups/i })).toBeInTheDocument();
		});

		it('renders custom name label when entity is overridden', () => {
			setCustomNomenclature({ entity: 'Group' });
			renderEntityForm(createData);
			expect(screen.getByText('Group Name')).toBeInTheDocument();
			expect(screen.queryByText('Entity Name')).not.toBeInTheDocument();
		});

		it('renders custom save button label when entity is overridden', () => {
			setCustomNomenclature({ entity: 'Group' });
			renderEntityForm(createData);
			expect(screen.getByRole('button', { name: /save group/i })).toBeInTheDocument();
		});

		it('renders custom placeholder when entity is overridden', () => {
			setCustomNomenclature({ entity: 'Group' });
			renderEntityForm(createData);
			expect(screen.getByPlaceholderText('Name of this group...')).toBeInTheDocument();
			expect(screen.getByPlaceholderText('Brief description of this group...')).toBeInTheDocument();
		});

		it('falls back to defaults when no custom nomenclature is set', () => {
			renderEntityForm(createData);
			expect(screen.getByText('Create Entity')).toBeInTheDocument();
			expect(screen.getByText('Entity Name')).toBeInTheDocument();
		});
	});
});
