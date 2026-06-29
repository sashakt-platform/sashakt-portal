import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagChip from './TagChip.svelte';

vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => ({ destroy: vi.fn() }))
}));

const defaultTag = { id: 10, name: 'Easy' };

function renderChip(
	props: {
		tag?: { id: number | string; name: string };
		isEditing?: boolean;
		editName?: string;
		canEdit?: boolean;
		canDelete?: boolean;
		onEdit?: (id: number | string, name: string) => void;
		onDelete?: (id: number | string, name: string) => void;
		onCancelEdit?: () => void;
	} = {}
) {
	return render(TagChip, {
		props: { tag: defaultTag, ...props }
	});
}

describe('TagChip', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('View mode (isEditing=false)', () => {
		describe('default rendering', () => {
			it('displays the tag name', () => {
				renderChip();
				expect(screen.getByText('Easy')).toBeInTheDocument();
			});

			it('does not render the edit form', () => {
				renderChip();
				expect(screen.queryByRole('form')).not.toBeInTheDocument();
			});

			it('does not show the text input', () => {
				renderChip();
				expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
			});

			it('does not show the Check/Save button initially', () => {
				renderChip({ canEdit: true });
				expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
			});
		});

		describe('hover behaviour', () => {
			it('shows the edit button on mouseenter when canEdit is true', async () => {
				renderChip({ canEdit: true });
				const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
				await fireEvent.mouseEnter(chip);
				expect(screen.getByRole('button')).toBeInTheDocument();
			});

			it('shows the delete button on mouseenter when canDelete is true', async () => {
				renderChip({ canDelete: true });
				const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
				await fireEvent.mouseEnter(chip);
				expect(screen.getByRole('button')).toBeInTheDocument();
			});

			it('shows both edit and delete buttons on mouseenter when both permissions granted', async () => {
				renderChip({ canEdit: true, canDelete: true });
				const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
				await fireEvent.mouseEnter(chip);
				expect(screen.getAllByRole('button')).toHaveLength(2);
			});

			it('hides buttons again on mouseleave', async () => {
				renderChip({ canEdit: true, canDelete: true });
				const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
				await fireEvent.mouseEnter(chip);
				expect(screen.getAllByRole('button')).toHaveLength(2);
				await fireEvent.mouseLeave(chip);
				// buttons remain in DOM (CSS group-hover controls visibility, not JS mount/unmount)
				screen.getAllByRole('button').forEach((b) => expect(b).toHaveClass('invisible'));
			});

			it('does not show edit button on hover when canEdit is false', async () => {
				renderChip({ canEdit: false, canDelete: false });
				const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
				await fireEvent.mouseEnter(chip);
				expect(screen.queryByRole('button')).not.toBeInTheDocument();
			});

			it('does not show delete button on hover when canDelete is false', async () => {
				renderChip({ canEdit: false, canDelete: false });
				const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
				await fireEvent.mouseEnter(chip);
				expect(screen.queryByRole('button')).not.toBeInTheDocument();
			});

			it('shows only edit button when canEdit=true but canDelete=false', async () => {
				renderChip({ canEdit: true, canDelete: false });
				const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
				await fireEvent.mouseEnter(chip);
				expect(screen.getAllByRole('button')).toHaveLength(1);
			});

			it('shows only delete button when canDelete=true but canEdit=false', async () => {
				renderChip({ canEdit: false, canDelete: true });
				const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
				await fireEvent.mouseEnter(chip);
				expect(screen.getAllByRole('button')).toHaveLength(1);
			});
		});

		describe('callback firing', () => {
			it('calls onEdit with tag id and name when edit button is clicked', async () => {
				const onEdit = vi.fn();
				renderChip({ canEdit: true, onEdit });
				const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
				await fireEvent.mouseEnter(chip);
				await fireEvent.click(screen.getByRole('button'));
				expect(onEdit).toHaveBeenCalledOnce();
				expect(onEdit).toHaveBeenCalledWith(10, 'Easy');
			});

			it('calls onDelete with tag id and name when delete button is clicked', async () => {
				const onDelete = vi.fn();
				renderChip({ canDelete: true, onDelete });
				const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
				await fireEvent.mouseEnter(chip);
				await fireEvent.click(screen.getByRole('button'));
				expect(onDelete).toHaveBeenCalledOnce();
				expect(onDelete).toHaveBeenCalledWith(10, 'Easy');
			});

			it('calls onEdit with string id when tag has a string id', async () => {
				const onEdit = vi.fn();
				renderChip({ tag: { id: 'abc-99', name: 'Hard' }, canEdit: true, onEdit });
				const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
				await fireEvent.mouseEnter(chip);
				await fireEvent.click(screen.getByRole('button'));
				expect(onEdit).toHaveBeenCalledWith('abc-99', 'Hard');
			});

			it('does not call onEdit when edit button is not clicked', async () => {
				const onEdit = vi.fn();
				renderChip({ canEdit: true, onEdit });
				expect(onEdit).not.toHaveBeenCalled();
			});

			it('does not call onDelete when delete button is not clicked', async () => {
				const onDelete = vi.fn();
				renderChip({ canDelete: true, onDelete });
				expect(onDelete).not.toHaveBeenCalled();
			});
		});
	});

	describe('Edit mode (isEditing=true)', () => {
		describe('rendering', () => {
			it('shows the text input', () => {
				renderChip({ isEditing: true, editName: 'Easy' });
				expect(screen.getByRole('textbox')).toBeInTheDocument();
			});

			it('text input is pre-filled with editName', () => {
				renderChip({ isEditing: true, editName: 'Easy' });
				expect(screen.getByRole('textbox')).toHaveValue('Easy');
			});

			it('form has method POST and action ?/updateTag', () => {
				renderChip({ isEditing: true, editName: 'Easy' });
				const form = document.querySelector('form')!;
				expect(form).toHaveAttribute('method', 'POST');
				expect(form).toHaveAttribute('action', '?/updateTag');
			});

			it('renders a hidden id input with tag.id', () => {
				renderChip({ isEditing: true, editName: 'Easy' });
				const form = document.querySelector('form')!;
				const idInput = form.querySelector('input[name="id"]') as HTMLInputElement;
				expect(idInput).toBeInTheDocument();
				expect(idInput.type).toBe('hidden');
				expect(idInput.value).toBe('10');
			});

			it('renders a submit (check) button', () => {
				renderChip({ isEditing: true, editName: 'Easy' });
				const submitBtn = screen.getAllByRole('button').find(
					(b) => (b as HTMLButtonElement).type === 'submit'
				);
				expect(submitBtn).toBeInTheDocument();
			});

			it('renders a cancel (X) button', () => {
				renderChip({ isEditing: true, editName: 'Easy' });
				const cancelBtn = screen.getAllByRole('button').find(
					(b) => (b as HTMLButtonElement).type === 'button'
				);
				expect(cancelBtn).toBeInTheDocument();
			});

			it('does not show the tag chip span in edit mode', () => {
				renderChip({ isEditing: true, editName: 'Easy' });
				expect(document.querySelector('[data-slot="tag-chip"]')).not.toBeInTheDocument();
			});

			it('text input has name="name" attribute', () => {
				renderChip({ isEditing: true, editName: 'Easy' });
				expect(screen.getByRole('textbox')).toHaveAttribute('name', 'name');
			});
		});

		describe('submit button disabled state', () => {
			it('is disabled when editName is empty', () => {
				renderChip({ isEditing: true, editName: '' });
				const submitBtn = screen.getAllByRole('button').find(
					(b) => (b as HTMLButtonElement).type === 'submit'
				) as HTMLButtonElement;
				expect(submitBtn).toBeDisabled();
			});

			it('is disabled when editName is only whitespace', () => {
				renderChip({ isEditing: true, editName: '   ' });
				const submitBtn = screen.getAllByRole('button').find(
					(b) => (b as HTMLButtonElement).type === 'submit'
				) as HTMLButtonElement;
				expect(submitBtn).toBeDisabled();
			});

			it('is enabled when editName has a non-empty trimmed value', () => {
				renderChip({ isEditing: true, editName: 'Medium' });
				const submitBtn = screen.getAllByRole('button').find(
					(b) => (b as HTMLButtonElement).type === 'submit'
				) as HTMLButtonElement;
				expect(submitBtn).toBeEnabled();
			});
		});

		describe('cancel behaviour', () => {
			it('calls onCancelEdit when cancel button is clicked', async () => {
				const onCancelEdit = vi.fn();
				renderChip({ isEditing: true, editName: 'Easy', onCancelEdit });
				const cancelBtn = screen.getAllByRole('button').find(
					(b) => (b as HTMLButtonElement).type === 'button'
				)!;
				await fireEvent.click(cancelBtn);
				expect(onCancelEdit).toHaveBeenCalledOnce();
			});

			it('calls onCancelEdit when Escape is pressed in the text input', async () => {
				const onCancelEdit = vi.fn();
				renderChip({ isEditing: true, editName: 'Easy', onCancelEdit });
				await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
				expect(onCancelEdit).toHaveBeenCalledOnce();
			});

			it('does not call onCancelEdit when other keys are pressed', async () => {
				const onCancelEdit = vi.fn();
				renderChip({ isEditing: true, editName: 'Easy', onCancelEdit });
				await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
				expect(onCancelEdit).not.toHaveBeenCalled();
			});
		});
	});

	describe('Tag name display', () => {
		it('shows a different tag name when the prop changes', async () => {
			const { rerender } = renderChip({ tag: { id: 1, name: 'Easy' } });
			expect(screen.getByText('Easy')).toBeInTheDocument();
			await rerender({ tag: { id: 2, name: 'Hard' } });
			expect(screen.getByText('Hard')).toBeInTheDocument();
			expect(screen.queryByText('Easy')).not.toBeInTheDocument();
		});
	});
});
