import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { writable } from 'svelte/store';
import EntityForm from './EntityForm.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn((schema) => schema)
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

describe('EntityForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		superFormRef.errors = null;
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Page title', () => {
		it('shows "Create Entity" heading in add mode', () => {
			render(EntityForm, { data: createData } as any);
			expect(screen.getByText('Create Entity')).toBeInTheDocument();
		});

		it('shows "Edit Entity" heading in edit mode', () => {
			render(EntityForm, { data: editData } as any);
			expect(screen.getByText('Edit Entity')).toBeInTheDocument();
		});

		it('does not show "Edit Entity" heading in add mode', () => {
			render(EntityForm, { data: createData } as any);
			expect(screen.queryByText('Edit Entity')).not.toBeInTheDocument();
		});

		it('does not show "Create Entity" heading in edit mode', () => {
			render(EntityForm, { data: editData } as any);
			expect(screen.queryByText('Create Entity')).not.toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Back link', () => {
		it('renders a back link', () => {
			render(EntityForm, { data: createData } as any);
			expect(screen.getByRole('link', { name: /back to entities/i })).toBeInTheDocument();
		});

		it('back link points to /entity', () => {
			render(EntityForm, { data: createData } as any);
			const link = screen.getByRole('link', { name: /back to entities/i });
			expect(link).toHaveAttribute('href', '/entity');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Form attributes', () => {
		it('form has method POST', () => {
			const { container } = render(EntityForm, { data: createData } as any);
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
		});

		it('form has action ?/save', () => {
			const { container } = render(EntityForm, { data: createData } as any);
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('action', '?/save');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Name field', () => {
		it('renders the Name label', () => {
			render(EntityForm, { data: createData } as any);
			expect(screen.getByText('Entity Name')).toBeInTheDocument();
		});

		it('renders the name input', () => {
			const { container } = render(EntityForm, { data: createData } as any);
			expect(container.querySelector('input[name="name"]')).toBeInTheDocument();
		});

		it('name input has correct placeholder in add mode', () => {
			render(EntityForm, { data: createData } as any);
			expect(screen.getByPlaceholderText('Name of this entity...')).toBeInTheDocument();
		});

		it('name input is empty in add mode', () => {
			const { container } = render(EntityForm, { data: createData } as any);
			const input = container.querySelector('input[name="name"]') as HTMLInputElement;
			expect(input.value).toBe('');
		});

		it('name input is pre-filled in edit mode', () => {
			const { container } = render(EntityForm, { data: editData } as any);
			const input = container.querySelector('input[name="name"]') as HTMLInputElement;
			expect(input.value).toBe('CLF');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Description field', () => {
		it('renders the Description label', () => {
			render(EntityForm, { data: createData } as any);
			expect(screen.getByText('Description')).toBeInTheDocument();
		});

		it('renders the description textarea', () => {
			const { container } = render(EntityForm, { data: createData } as any);
			expect(container.querySelector('textarea[name="description"]')).toBeInTheDocument();
		});

		it('description textarea has correct placeholder', () => {
			render(EntityForm, { data: createData } as any);
			expect(
				screen.getByPlaceholderText('Brief description of this entity...')
			).toBeInTheDocument();
		});

		it('description textarea is empty in add mode', () => {
			const { container } = render(EntityForm, { data: createData } as any);
			const textarea = container.querySelector(
				'textarea[name="description"]'
			) as HTMLTextAreaElement;
			expect(textarea.value).toBe('');
		});

		it('description textarea is pre-filled in edit mode', () => {
			const { container } = render(EntityForm, { data: editData } as any);
			const textarea = container.querySelector(
				'textarea[name="description"]'
			) as HTMLTextAreaElement;
			expect(textarea.value).toBe('Community Level Federation');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Save button', () => {
		it('renders the Save button with label "Save Entity"', () => {
			render(EntityForm, { data: createData } as any);
			expect(screen.getByRole('button', { name: /save entity/i })).toBeInTheDocument();
		});

		it('Save button is DISABLED when name is empty', () => {
			render(EntityForm, { data: createData } as any);
			expect(screen.getByRole('button', { name: /save entity/i })).toBeDisabled();
		});

		it('Save button is DISABLED when name is only whitespace', () => {
			render(EntityForm, {
				data: { ...createData, form: makeForm({ name: '   ' }) }
			} as any);
			expect(screen.getByRole('button', { name: /save entity/i })).toBeDisabled();
		});

		it('Save button is ENABLED when name has a value in edit mode', () => {
			render(EntityForm, { data: editData } as any);
			expect(screen.getByRole('button', { name: /save entity/i })).toBeEnabled();
		});

		it('Save button becomes ENABLED after the user types a name', async () => {
			const { container } = render(EntityForm, { data: createData } as any);
			const input = container.querySelector('input[name="name"]') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: 'New Entity' } });
			await tick();

			expect(screen.getByRole('button', { name: /save entity/i })).toBeEnabled();
		});

		it('Save button becomes DISABLED again when name is cleared', async () => {
			const { container } = render(EntityForm, { data: editData } as any);
			const input = container.querySelector('input[name="name"]') as HTMLInputElement;

			await fireEvent.input(input, { target: { value: '' } });
			await tick();

			expect(screen.getByRole('button', { name: /save entity/i })).toBeDisabled();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('Validation error display', () => {
		it('does NOT show a name error message when there are no errors', () => {
			render(EntityForm, { data: createData } as any);
			expect(screen.queryByText('Entity name is required')).not.toBeInTheDocument();
		});

		it('shows the name error message when $errors.name is set', async () => {
			render(EntityForm, { data: createData } as any);

			superFormRef.errors!.set({ name: ['Entity name is required'] });
			await tick();

			expect(screen.getByText('Entity name is required')).toBeInTheDocument();
		});

		it('clears the name error message when $errors.name is removed', async () => {
			render(EntityForm, { data: createData } as any);

			superFormRef.errors!.set({ name: ['Entity name is required'] });
			await tick();
			superFormRef.errors!.set({});
			await tick();

			expect(screen.queryByText('Entity name is required')).not.toBeInTheDocument();
		});
	});
});
