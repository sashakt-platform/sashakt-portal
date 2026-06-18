import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import TagDeleteDialog from './TagDeleteDialog.svelte';

vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => ({ destroy: vi.fn() }))
}));

function renderDialog(
	props: {
		open?: boolean;
		elementName?: string;
		elementId?: number | string | null;
		elementType?: 'tag' | 'tag type';
	} = {}
) {
	return render(TagDeleteDialog, {
		props: { open: true, elementName: 'Easy', elementId: 10, elementType: 'tag', ...props }
	});
}

describe('TagDeleteDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Dialog visibility', () => {
		it('does not render dialog content when open is false', () => {
			renderDialog({ open: false });
			expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
		});

		it('renders dialog content when open is true', async () => {
			renderDialog({ open: true });
			expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
		});
	});

	describe('Tag mode (elementType="tag")', () => {
		it('shows "Delete tag?" as the title', async () => {
			renderDialog({ elementType: 'tag' });
			const dialog = await screen.findByRole('alertdialog');
			expect(within(dialog).getByText('Delete tag?')).toBeInTheDocument();
		});

		it('shows description mentioning the tag name', async () => {
			renderDialog({ elementType: 'tag', elementName: 'Easy' });
			await screen.findByRole('alertdialog');
			expect(
				screen.getByText(
					'Are you sure you want to delete the tag "Easy"? Questions using this tag will be untagged.'
				)
			).toBeInTheDocument();
		});

		it('includes the element name in the description', async () => {
			renderDialog({ elementType: 'tag', elementName: 'Hard' });
			await screen.findByRole('alertdialog');
			expect(screen.getByText(/delete the tag "Hard"/)).toBeInTheDocument();
		});

		it('description mentions untagging of questions', async () => {
			renderDialog({ elementType: 'tag', elementName: 'Easy' });
			await screen.findByRole('alertdialog');
			expect(screen.getByText(/Questions using this tag will be untagged/)).toBeInTheDocument();
		});

		it('sets form action to ?/deleteTag', async () => {
			renderDialog({ elementType: 'tag' });
			await screen.findByRole('alertdialog');
			const form = screen.getByRole('alertdialog').querySelector('form');
			expect(form).toHaveAttribute('action', '?/deleteTag');
		});
	});

	describe('Tag type mode (elementType="tag type")', () => {
		it('shows "Delete tag type?" as the title', async () => {
			renderDialog({ elementType: 'tag type' });
			const dialog = await screen.findByRole('alertdialog');
			expect(within(dialog).getByText('Delete tag type?')).toBeInTheDocument();
		});

		it('shows description mentioning the tag type name', async () => {
			renderDialog({ elementType: 'tag type', elementName: 'Difficulty Level' });
			await screen.findByRole('alertdialog');
			expect(
				screen.getByText(
					'Are you sure you want to delete the tag type "Difficulty Level"?'
				)
			).toBeInTheDocument();
		});

		it('includes the element name in the tag type description', async () => {
			renderDialog({ elementType: 'tag type', elementName: 'Subject' });
			await screen.findByRole('alertdialog');
			expect(screen.getByText(/delete the tag type "Subject"/)).toBeInTheDocument();
		});

		it('tag type description does not mention untagging questions', async () => {
			renderDialog({ elementType: 'tag type', elementName: 'Difficulty Level' });
			await screen.findByRole('alertdialog');
			expect(screen.queryByText(/Questions using this tag will be untagged/)).not.toBeInTheDocument();
		});

		it('sets form action to ?/deleteTagType', async () => {
			renderDialog({ elementType: 'tag type' });
			await screen.findByRole('alertdialog');
			const form = screen.getByRole('alertdialog').querySelector('form');
			expect(form).toHaveAttribute('action', '?/deleteTagType');
		});
	});

	describe('Default prop values', () => {
		it('defaults elementType to "tag" when not specified', () => {
			render(TagDeleteDialog, {
				props: { open: true, elementName: 'Easy', elementId: 10 }
			});
			expect(screen.getByText('Delete tag?')).toBeInTheDocument();
		});
	});

	describe('Hidden id input', () => {
		it('renders a hidden input with name="id"', async () => {
			renderDialog({ elementId: 42 });
			await screen.findByRole('alertdialog');
			const form = screen.getByRole('alertdialog').querySelector('form');
			const idInput = form!.querySelector('input[name="id"]') as HTMLInputElement;
			expect(idInput).toBeInTheDocument();
			expect(idInput.type).toBe('hidden');
		});

		it('sets the hidden input value to the numeric elementId', async () => {
			renderDialog({ elementId: 42 });
			await screen.findByRole('alertdialog');
			const idInput = screen
				.getByRole('alertdialog')
				.querySelector('input[name="id"]') as HTMLInputElement;
			expect(idInput.value).toBe('42');
		});

		it('sets the hidden input value to a string elementId', async () => {
			renderDialog({ elementId: 'abc-123' });
			await screen.findByRole('alertdialog');
			const idInput = screen
				.getByRole('alertdialog')
				.querySelector('input[name="id"]') as HTMLInputElement;
			expect(idInput.value).toBe('abc-123');
		});

		it('sets the hidden input value to empty string when elementId is null', async () => {
			renderDialog({ elementId: null });
			await screen.findByRole('alertdialog');
			const idInput = screen
				.getByRole('alertdialog')
				.querySelector('input[name="id"]') as HTMLInputElement;
			expect(idInput.value).toBe('');
		});
	});

	describe('Buttons', () => {
		it('renders a Cancel button', async () => {
			renderDialog();
			await screen.findByRole('alertdialog');
			expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
		});

		it('renders a Delete button', async () => {
			renderDialog();
			await screen.findByRole('alertdialog');
			expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
		});

		it('Delete button has type="submit"', async () => {
			renderDialog();
			await screen.findByRole('alertdialog');
			expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('type', 'submit');
		});

		it('renders an X close button', async () => {
			renderDialog();
			const dialog = await screen.findByRole('alertdialog');
			const buttons = within(dialog).getAllByRole('button');
			const xButton = buttons.find((b) => !b.textContent?.trim());
			expect(xButton).toBeInTheDocument();
		});
	});

	describe('Close behaviour', () => {
		it('closes dialog when X button is clicked', async () => {
			const { rerender } = renderDialog({ open: true });
			await screen.findByRole('alertdialog');
			const dialog = screen.getByRole('alertdialog');
			const buttons = within(dialog).getAllByRole('button');
			const xButton = buttons.find((b) => !b.textContent?.trim())!;
			await fireEvent.click(xButton);
			await rerender({ open: false, elementName: 'Easy', elementId: 10, elementType: 'tag' });
			expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
		});

		it('closes dialog when Cancel button is clicked', async () => {
			const { rerender } = renderDialog({ open: true });
			await screen.findByRole('alertdialog');
			await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
			await rerender({ open: false, elementName: 'Easy', elementId: 10, elementType: 'tag' });
			expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
		});
	});

	describe('Form structure', () => {
		it('form uses POST method', async () => {
			renderDialog();
			await screen.findByRole('alertdialog');
			const form = screen.getByRole('alertdialog').querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
		});

		it('Delete button is inside the form', async () => {
			renderDialog();
			await screen.findByRole('alertdialog');
			const form = screen.getByRole('alertdialog').querySelector('form');
			expect(within(form as HTMLElement).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
		});
	});

	describe('Element name in title', () => {
		it('reflects the elementName update in tag description when prop changes', async () => {
			const { rerender } = renderDialog({ elementName: 'Easy', elementType: 'tag' });
			await screen.findByRole('alertdialog');
			expect(screen.getByText(/delete the tag "Easy"/)).toBeInTheDocument();
			await rerender({ open: true, elementName: 'Hard', elementId: 10, elementType: 'tag' });
			expect(screen.getByText(/delete the tag "Hard"/)).toBeInTheDocument();
		});

		it('reflects the elementName update in tag type description when prop changes', async () => {
			const { rerender } = renderDialog({
				elementName: 'Difficulty',
				elementType: 'tag type'
			});
			await screen.findByRole('alertdialog');
			await rerender({
				open: true,
				elementName: 'Subject',
				elementId: 10,
				elementType: 'tag type'
			});
			expect(screen.getByText(/delete the tag type "Subject"/)).toBeInTheDocument();
		});
	});
});
