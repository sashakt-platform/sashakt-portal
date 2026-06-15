/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import FieldList from './FieldList.svelte';

vi.mock('$app/forms', () => ({
	enhance: vi.fn((node, submitFunction) => {
		node.addEventListener('submit', async (e: Event) => {
			e.preventDefault();
			if (submitFunction) {
				const onSubmitCallback = submitFunction({
					action: new URL(node.action),
					formData: new FormData(node),
					formElement: node,
					controller: new AbortController(),
					submitter: null,
					cancel: () => {}
				} as any);
				if (onSubmitCallback) {
					await onSubmitCallback({ result: { type: 'success' } } as any);
				}
			}
		});
		return {
			destroy() {}
		};
	})
}));

vi.mock('svelte-sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn()
	}
}));

const mockFields = [
	{
		id: 10,
		field_type: 'text',
		label: 'First Field',
		name: 'first_field',
		is_required: true,
		order: 0,
		help_text: 'Help 1'
	},
	{
		id: 20,
		field_type: 'number',
		label: 'Second Field',
		name: 'second_field',
		is_required: false,
		order: 1
	}
];

describe('FieldList Component', () => {
	let onEdit: any;
	let onDelete: any;
	let onReorder: any;

	beforeEach(() => {
		vi.clearAllMocks();
		onEdit = vi.fn();
		onDelete = vi.fn();
		onReorder = vi.fn();
	});

	it('renders fields and details correctly', () => {
		render(FieldList, {
			fields: mockFields as any,
			formId: 42,
			onEdit,
			onDelete,
			onReorder
		});

		expect(screen.getByText('First Field')).toBeInTheDocument();
		expect(screen.getByText('Second Field')).toBeInTheDocument();
		expect(screen.getByText('Required')).toBeInTheDocument();
		expect(screen.getByText('Help 1')).toBeInTheDocument();
	});

	it('disables up button on the first field and down button on the last field', () => {
		render(FieldList, {
			fields: mockFields as any,
			formId: 42,
			onEdit,
			onDelete,
			onReorder
		});

		const upButtons = screen.getAllByRole('button').filter((btn) => {
			const firstChild = btn.firstElementChild;
			return firstChild && firstChild.classList.contains('lucide-chevron-up');
		});
		const downButtons = screen.getAllByRole('button').filter((btn) => {
			const firstChild = btn.firstElementChild;
			return firstChild && firstChild.classList.contains('lucide-chevron-down');
		});

		expect(upButtons[0]).toBeDisabled();
		expect(upButtons[1]).not.toBeDisabled();

		expect(downButtons[0]).not.toBeDisabled();
		expect(downButtons[1]).toBeDisabled();
	});

	it('calls onReorder and sends POST fetch when moveField is called', async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: true });
		global.fetch = mockFetch;

		render(FieldList, {
			fields: mockFields as any,
			formId: 42,
			onEdit,
			onDelete,
			onReorder
		});

		const downButtons = screen.getAllByRole('button').filter((btn) => {
			const firstChild = btn.firstElementChild;
			return firstChild && firstChild.classList.contains('lucide-chevron-down');
		});

		// Click down button on the first field (swaps index 0 and 1)
		await fireEvent.click(downButtons[0]);

		expect(onReorder).toHaveBeenCalledWith([
			expect.objectContaining({ id: 20, order: 0 }),
			expect.objectContaining({ id: 10, order: 1 })
		]);

		expect(mockFetch).toHaveBeenCalledWith(
			'?/reorderFields',
			expect.objectContaining({
				method: 'POST',
				body: expect.any(FormData)
			})
		);

		const body = mockFetch.mock.calls[0][1].body as FormData;
		expect(JSON.parse(body.get('fieldIds') as string)).toEqual([20, 10]);
	});

	it('rolls back onReorder and shows toast error on fetch fail', async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: false });
		global.fetch = mockFetch;

		render(FieldList, {
			fields: mockFields as any,
			formId: 42,
			onEdit,
			onDelete,
			onReorder
		});

		const downButtons = screen.getAllByRole('button').filter((btn) => {
			const firstChild = btn.firstElementChild;
			return firstChild && firstChild.classList.contains('lucide-chevron-down');
		});

		await fireEvent.click(downButtons[0]);

		const { toast } = await import('svelte-sonner');
		await waitFor(() => {
			expect(onReorder).toHaveBeenLastCalledWith(mockFields);
			expect(toast.error).toHaveBeenCalledWith('Failed to reorder fields');
		});
	});

	it('rolls back onReorder and shows network toast error on fetch network failure', async () => {
		const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
		global.fetch = mockFetch;

		render(FieldList, {
			fields: mockFields as any,
			formId: 42,
			onEdit,
			onDelete,
			onReorder
		});

		const downButtons = screen.getAllByRole('button').filter((btn) => {
			const firstChild = btn.firstElementChild;
			return firstChild && firstChild.classList.contains('lucide-chevron-down');
		});

		await fireEvent.click(downButtons[0]);

		const { toast } = await import('svelte-sonner');
		await waitFor(() => {
			expect(onReorder).toHaveBeenLastCalledWith(mockFields);
			expect(toast.error).toHaveBeenCalledWith(
				'Failed to reorder fields. Please check your connection.'
			);
		});
	});

	it('triggers onEdit callback when edit button is clicked', async () => {
		render(FieldList, {
			fields: mockFields as any,
			formId: 42,
			onEdit,
			onDelete,
			onReorder
		});

		const editButtons = screen.getAllByRole('button').filter((btn) => {
			const firstChild = btn.firstElementChild;
			return firstChild && firstChild.classList.contains('lucide-pencil');
		});

		await fireEvent.click(editButtons[0]);

		expect(onEdit).toHaveBeenCalledWith(mockFields[0]);
	});

	it('shows confirmation dialog and calls onDelete when field is deleted', async () => {
		render(FieldList, {
			fields: mockFields as any,
			formId: 42,
			onEdit,
			onDelete,
			onReorder
		});

		const deleteButtons = screen.getAllByRole('button').filter((btn) => {
			const firstChild = btn.firstElementChild;
			return firstChild && firstChild.classList.contains('lucide-trash-2');
		});

		await fireEvent.click(deleteButtons[0]);

		expect(screen.getByText('Delete Field?')).toBeInTheDocument();
		expect(
			screen.getByText(/Are you sure you want to delete the field "First Field"?/i)
		).toBeInTheDocument();

		const confirmButton = screen.getByRole('button', { name: 'Delete' });
		await fireEvent.click(confirmButton);

		expect(onDelete).toHaveBeenCalledWith(10);
	});
});
