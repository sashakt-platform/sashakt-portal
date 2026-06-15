/* eslint-disable @typescript-eslint/no-explicit-any */
import { writable } from 'svelte/store';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import Page from './+page.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path) => path)
}));

vi.mock('$app/forms', () => ({
	deserialize: vi.fn((text) => JSON.parse(text))
}));

vi.mock('$app/navigation', () => ({
	invalidateAll: vi.fn(),
	goto: vi.fn()
}));

vi.mock('svelte-sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn()
	}
}));

vi.mock('svelte-dnd-action', () => ({
	dragHandleZone: vi.fn(() => ({ destroy: () => {} })),
	dragHandle: vi.fn(() => ({ destroy: () => {} }))
}));

vi.mock('$lib/nomenclature', () => ({
	useTerms: () => (key: string) => key
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn()
}));

const mockFormStore = writable({
	name: '',
	description: '',
	is_active: true
});

const mockSubmit = vi.fn();
const mockEnhance = vi.fn();

vi.mock('sveltekit-superforms', () => ({
	superForm: vi.fn(() => ({
		form: mockFormStore,
		enhance: mockEnhance,
		submit: mockSubmit
	}))
}));

const makeDefaultData = (action: 'add' | 'edit' = 'add', fields: any[] = []) => {
	return {
		form: {
			id: 'mock-form-id',
			valid: true,
			data: {},
			errors: {},
			constraints: {}
		},
		action,
		formData:
			action === 'edit'
				? {
						id: 42,
						name: 'My Form',
						description: 'Description',
						is_active: true,
						fields
					}
				: null,
		entityTypes: [{ id: 1, name: 'Type 1' }],
		currentUser: { organization_id: 123 }
	};
};

describe('Edit/Create Form Page component', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
		mockFormStore.set({ name: '', description: '', is_active: true });
	});

	it('renders in create mode and displays "Create form"', () => {
		const data = makeDefaultData('add');
		render(Page, { data });

		expect(screen.getByText('Create form')).toBeInTheDocument();
		expect(screen.queryByText('Edit form')).not.toBeInTheDocument();
	});

	it('shows toast error when Add Field is clicked and form name is empty', async () => {
		const data = makeDefaultData('add');
		render(Page, { data });

		const addFieldButton = screen.getByRole('button', { name: /Add Field/i });
		await fireEvent.click(addFieldButton);

		const { toast } = await import('svelte-sonner');
		expect(toast.error).toHaveBeenCalledWith('Please enter a form name first');
		expect(mockSubmit).not.toHaveBeenCalled();
	});

	it('submits form and sets openFieldChooser flag when Add Field is clicked and form name is filled', async () => {
		const data = makeDefaultData('add');
		render(Page, { data });

		mockFormStore.set({ name: 'Test Form Name', description: '', is_active: true });

		const addFieldButton = screen.getByRole('button', { name: /Add Field/i });
		await fireEvent.click(addFieldButton);

		expect(localStorage.getItem('openFieldChooser')).toBe('true');
		expect(mockSubmit).toHaveBeenCalled();
	});

	it('renders in edit mode, shows "Edit form", and auto-opens chooser if flag is in localStorage', async () => {
		localStorage.setItem('openFieldChooser', 'true');
		const data = makeDefaultData('edit', []);
		render(Page, { data });

		expect(screen.getByText('Edit form')).toBeInTheDocument();
		expect(localStorage.getItem('openFieldChooser')).toBeNull();

		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('opens dialog when Add Field is clicked in edit mode', async () => {
		const data = makeDefaultData('edit', []);
		render(Page, { data });

		const addFieldButton = screen.getByRole('button', { name: /Add Field/i });
		await fireEvent.click(addFieldButton);

		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('sends POST fetch to addField and appends new field when dialog selects a type', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			text: async () => JSON.stringify({ type: 'success', data: { id: 101 } })
		});
		global.fetch = mockFetch;

		const data = makeDefaultData('edit', []);
		render(Page, { data });

		// Open dialog
		const addFieldButton = screen.getByRole('button', { name: /Add Field/i });
		await fireEvent.click(addFieldButton);

		// Click "Short Text" button in dialog
		const shortTextButton = screen.getByRole('button', { name: 'Short Text' });
		await fireEvent.click(shortTextButton);

		// Fetch should be called
		expect(mockFetch).toHaveBeenCalledWith(
			'?/addField',
			expect.objectContaining({
				method: 'POST',
				body: expect.any(FormData)
			})
		);

		const body = mockFetch.mock.calls[0][1].body as FormData;
		const parsedField = JSON.parse(body.get('field') as string);
		expect(parsedField.field_type).toBe('text');
		expect(parsedField.label).toBe('Short Text');

		// Wait for the new field card to be added to DOM
		await waitFor(() => {
			expect(screen.getByText('Short Text')).toBeInTheDocument();
		});
	});

	it('shows toast error when addField fetch fails', async () => {
		const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
		global.fetch = mockFetch;

		const data = makeDefaultData('edit', []);
		render(Page, { data });

		// Open dialog
		const addFieldButton = screen.getByRole('button', { name: /Add Field/i });
		await fireEvent.click(addFieldButton);

		const shortTextButton = screen.getByRole('button', { name: 'Short Text' });
		await fireEvent.click(shortTextButton);

		const { toast } = await import('svelte-sonner');
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('Failed to add field');
		});
	});

	it('removes field when deleted', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			text: async () => JSON.stringify({ type: 'success' })
		});
		global.fetch = mockFetch;

		const fields = [
			{
				id: 50,
				field_type: 'text',
				label: 'Field 50',
				name: 'field_50',
				is_required: false,
				order: 0
			}
		];
		const data = makeDefaultData('edit', fields as any);
		render(Page, { data });

		const fieldInput = await screen.findByDisplayValue('Field 50');
		expect(fieldInput).toBeInTheDocument();

		const deleteButton = screen.getByRole('button', { name: 'Delete field' });
		await fireEvent.click(deleteButton);

		// AlertDialog confirm button
		const confirmButton = screen.getByRole('button', { name: 'Delete' });
		await fireEvent.click(confirmButton);

		await waitFor(() => {
			expect(screen.queryByDisplayValue('Field 50')).not.toBeInTheDocument();
		});
	});

	it('duplicates field on duplicate action success', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			text: async () => JSON.stringify({ type: 'success', data: { id: 102 } })
		});
		global.fetch = mockFetch;

		const fields = [
			{
				id: 50,
				field_type: 'text',
				label: 'Field 50',
				name: 'field_50',
				is_required: false,
				order: 0
			}
		];
		const data = makeDefaultData('edit', fields as any);
		render(Page, { data });

		const duplicateButton = await screen.findByRole('button', { name: 'Duplicate field' });
		await fireEvent.click(duplicateButton);

		expect(mockFetch).toHaveBeenCalledWith(
			'?/addField',
			expect.objectContaining({
				method: 'POST',
				body: expect.any(FormData)
			})
		);

		const body = mockFetch.mock.calls[0][1].body as FormData;
		const parsedField = JSON.parse(body.get('field') as string);
		expect(parsedField.label).toBe('Field 50 (Copy)');
		expect(parsedField.name).toBe('field_50_copy');

		const { toast } = await import('svelte-sonner');
		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith('Field duplicated');
			expect(screen.getByDisplayValue('Field 50 (Copy)')).toBeInTheDocument();
		});
	});

	it('changes field type successfully on change type action', async () => {
		const mockFetch = vi
			.fn()
			.mockResolvedValueOnce({
				text: async () => JSON.stringify({ type: 'success' })
			})
			.mockResolvedValueOnce({
				text: async () => JSON.stringify({ type: 'success', data: { id: 103 } })
			});
		global.fetch = mockFetch;

		const fields = [
			{
				id: 50,
				field_type: 'text',
				label: 'Field 50',
				name: 'field_50',
				is_required: false,
				order: 0
			}
		];
		const data = makeDefaultData('edit', fields as any);
		render(Page, { data });

		const popoverTrigger = await screen.findByRole('button', { name: 'Short Text' });
		await fireEvent.click(popoverTrigger);

		const numberOption = screen.getByRole('button', { name: 'Number' });
		await fireEvent.click(numberOption);

		expect(mockFetch).toHaveBeenCalledWith(
			'?/deleteField',
			expect.objectContaining({
				method: 'POST',
				body: expect.any(FormData)
			})
		);

		await waitFor(() => {
			expect(mockFetch).toHaveBeenLastCalledWith(
				'?/addField',
				expect.objectContaining({
					method: 'POST',
					body: expect.any(FormData)
				})
			);
		});

		const body = mockFetch.mock.calls[1][1].body as FormData;
		const parsedField = JSON.parse(body.get('field') as string);
		expect(parsedField.field_type).toBe('number');

		const { toast } = await import('svelte-sonner');
		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith('Field type changed');
		});
	});
});
