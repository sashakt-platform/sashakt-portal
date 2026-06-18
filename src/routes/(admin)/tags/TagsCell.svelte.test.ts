import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagsCell from './TagsCell.svelte';

vi.mock('$lib/nomenclature', () => ({
	useTerms: () => (key: string) => {
		const map: Record<string, string> = { tag: 'tag', tag_type: 'Tag Type' };
		return map[key] ?? key;
	}
}));

vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => ({ destroy: vi.fn() }))
}));

const sampleTags = [
	{ id: 1, name: 'Easy' },
	{ id: 2, name: 'Medium' },
	{ id: 3, name: 'Hard' }
];

function renderCell(
	props: {
		tags?: { id: number | string; name: string }[];
		tagTypeId?: number | string;
		canCreate?: boolean;
		canEdit?: boolean;
		canDelete?: boolean;
		editingTagId?: number | string | null;
		editingTagName?: string;
		onStartEdit?: (id: number | string, name: string) => void;
		onCancelEdit?: () => void;
		onDeleteTag?: (id: number | string, name: string) => void;
	} = {}
) {
	return render(TagsCell, {
		props: { tags: [], tagTypeId: 5, ...props }
	});
}

describe('TagsCell', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Tags list rendering', () => {
		it('renders nothing when tags is empty', () => {
			renderCell({ tags: [] });
			expect(screen.queryByText(/Easy|Medium|Hard/)).not.toBeInTheDocument();
		});

		it('renders the tag name for a single tag', () => {
			renderCell({ tags: [{ id: 1, name: 'Easy' }] });
			expect(screen.getByText('Easy')).toBeInTheDocument();
		});

		it('renders all tag names for multiple tags', () => {
			renderCell({ tags: sampleTags });
			expect(screen.getByText('Easy')).toBeInTheDocument();
			expect(screen.getByText('Medium')).toBeInTheDocument();
			expect(screen.getByText('Hard')).toBeInTheDocument();
		});

		it('renders the correct number of tag chips', () => {
			renderCell({ tags: sampleTags });
			expect(screen.getAllByText(/Easy|Medium|Hard/)).toHaveLength(3);
		});

		it('renders tags with string ids', () => {
			renderCell({ tags: [{ id: 'abc-1', name: 'Geography' }] });
			expect(screen.getByText('Geography')).toBeInTheDocument();
		});
	});

	describe('"Add tag" button', () => {
		it('shows "Add tag" button when canCreate is true', () => {
			renderCell({ canCreate: true });
			expect(screen.getByRole('button', { name: /add tag/i })).toBeInTheDocument();
		});

		it('does not show "Add tag" button when canCreate is false', () => {
			renderCell({ canCreate: false });
			expect(screen.queryByRole('button', { name: /add tag/i })).not.toBeInTheDocument();
		});

		it('"Add tag" button is hidden after it is clicked', async () => {
			renderCell({ canCreate: true });
			await fireEvent.click(screen.getByRole('button', { name: /add tag/i }));
			expect(screen.queryByRole('button', { name: /add tag/i })).not.toBeInTheDocument();
		});
	});

	describe('Add tag form', () => {
		async function openAddForm() {
			renderCell({ canCreate: true, tagTypeId: 7 });
			await fireEvent.click(screen.getByRole('button', { name: /add tag/i }));
		}

		it('shows the add form after clicking "Add tag"', async () => {
			await openAddForm();
			expect(screen.getByRole('textbox')).toBeInTheDocument();
		});

		it('form has method POST', async () => {
			await openAddForm();
			const form = document.querySelector('form')!;
			expect(form).toHaveAttribute('method', 'POST');
		});

		it('form has action ?/createTag', async () => {
			await openAddForm();
			const form = document.querySelector('form')!;
			expect(form).toHaveAttribute('action', '?/createTag');
		});

		it('renders a hidden tag_type_id input with the correct value', async () => {
			await openAddForm();
			const form = document.querySelector('form')!;
			const hiddenInput = form.querySelector('input[name="tag_type_id"]') as HTMLInputElement;
			expect(hiddenInput).toBeInTheDocument();
			expect(hiddenInput.type).toBe('hidden');
			expect(hiddenInput.value).toBe('7');
		});

		it('text input has name="name"', async () => {
			await openAddForm();
			expect(screen.getByRole('textbox')).toHaveAttribute('name', 'name');
		});

		it('text input shows the correct placeholder', async () => {
			await openAddForm();
			expect(screen.getByPlaceholderText('tag name...')).toBeInTheDocument();
		});

		it('renders a submit button', async () => {
			await openAddForm();
			const submitBtn = screen
				.getAllByRole('button')
				.find((b) => (b as HTMLButtonElement).type === 'submit');
			expect(submitBtn).toBeInTheDocument();
		});

		it('renders a cancel button', async () => {
			await openAddForm();
			const cancelBtn = screen
				.getAllByRole('button')
				.find((b) => (b as HTMLButtonElement).type === 'button');
			expect(cancelBtn).toBeInTheDocument();
		});

		it('hides the form and restores "Add tag" button when cancel is clicked', async () => {
			await openAddForm();
			const cancelBtn = screen
				.getAllByRole('button')
				.find((b) => (b as HTMLButtonElement).type === 'button')!;
			await fireEvent.click(cancelBtn);
			expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
			expect(screen.getByRole('button', { name: /add tag/i })).toBeInTheDocument();
		});

		it('hides the form when Escape is pressed in the text input', async () => {
			await openAddForm();
			await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
			expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
		});

		it('restores "Add tag" button after Escape closes the form', async () => {
			await openAddForm();
			await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
			expect(screen.getByRole('button', { name: /add tag/i })).toBeInTheDocument();
		});

		it('does not close the form on non-Escape key presses', async () => {
			await openAddForm();
			await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
			expect(screen.getByRole('textbox')).toBeInTheDocument();
		});
	});

	describe('Edit mode via editingTagId', () => {
		it('puts the matching tag chip into edit mode when editingTagId is set', () => {
			renderCell({ tags: sampleTags, editingTagId: 2, editingTagName: 'Medium' });
			// Edit mode shows a textbox inside the TagChip's inline form
			expect(screen.getByRole('textbox')).toBeInTheDocument();
			expect(screen.getByRole('textbox')).toHaveValue('Medium');
		});

		it('keeps other tags in view mode when only one editingTagId is set', () => {
			renderCell({ tags: sampleTags, editingTagId: 2, editingTagName: 'Medium' });
			// Tags not being edited still show their name as plain text
			expect(screen.getByText('Easy')).toBeInTheDocument();
			expect(screen.getByText('Hard')).toBeInTheDocument();
		});

		it('keeps all tags in view mode when editingTagId is null', () => {
			renderCell({ tags: sampleTags, editingTagId: null });
			expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
		});

		it('keeps all tags in view mode when editingTagId does not match any tag', () => {
			renderCell({ tags: sampleTags, editingTagId: 999 });
			expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
		});

		it('edit input has the hidden id input with tag.id value', () => {
			renderCell({ tags: sampleTags, editingTagId: 2, editingTagName: 'Medium' });
			const idInput = document.querySelector('input[name="id"]') as HTMLInputElement;
			expect(idInput).toBeInTheDocument();
			expect(idInput.value).toBe('2');
		});
	});

	describe('Prop passthrough to TagChip', () => {
		it('passes onCancelEdit through so Escape on edited chip calls it', async () => {
			const onCancelEdit = vi.fn();
			renderCell({ tags: sampleTags, editingTagId: 1, editingTagName: 'Easy', onCancelEdit });
			await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
			expect(onCancelEdit).toHaveBeenCalledOnce();
		});

		it('passes canEdit down so edit buttons appear on hover', async () => {
			renderCell({ tags: [{ id: 1, name: 'Easy' }], canEdit: true });
			const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
			await fireEvent.mouseEnter(chip);
			expect(screen.getByRole('button')).toBeInTheDocument();
		});

		it('passes canDelete down so delete buttons appear on hover', async () => {
			renderCell({ tags: [{ id: 1, name: 'Easy' }], canDelete: true });
			const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
			await fireEvent.mouseEnter(chip);
			expect(screen.getByRole('button')).toBeInTheDocument();
		});

		it('calls onStartEdit with tag id and name when edit is triggered', async () => {
			const onStartEdit = vi.fn();
			renderCell({ tags: [{ id: 1, name: 'Easy' }], canEdit: true, onStartEdit });
			const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
			await fireEvent.mouseEnter(chip);
			await fireEvent.click(screen.getByRole('button'));
			expect(onStartEdit).toHaveBeenCalledWith(1, 'Easy');
		});

		it('calls onDeleteTag with tag id and name when delete is triggered', async () => {
			const onDeleteTag = vi.fn();
			renderCell({ tags: [{ id: 1, name: 'Easy' }], canDelete: true, onDeleteTag });
			const chip = document.querySelector('[data-slot="tag-chip"]') as HTMLElement;
			await fireEvent.mouseEnter(chip);
			await fireEvent.click(screen.getByRole('button'));
			expect(onDeleteTag).toHaveBeenCalledWith(1, 'Easy');
		});
	});

	describe('tagTypeId in add form', () => {
		it('uses the tagTypeId prop as the hidden tag_type_id value', async () => {
			renderCell({ canCreate: true, tagTypeId: 42 });
			await fireEvent.click(screen.getByRole('button', { name: /add tag/i }));
			const hiddenInput = document.querySelector(
				'input[name="tag_type_id"]'
			) as HTMLInputElement;
			expect(hiddenInput.value).toBe('42');
		});

		it('works with string tagTypeId values', async () => {
			renderCell({ canCreate: true, tagTypeId: 'type-abc' });
			await fireEvent.click(screen.getByRole('button', { name: /add tag/i }));
			const hiddenInput = document.querySelector(
				'input[name="tag_type_id"]'
			) as HTMLInputElement;
			expect(hiddenInput.value).toBe('type-abc');
		});
	});
});
