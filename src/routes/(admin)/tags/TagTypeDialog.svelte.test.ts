import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import TagTypeDialog from './TagTypeDialog.svelte';

vi.mock('$lib/nomenclature', () => ({
	useTerms: () => (key: string) => {
		const map: Record<string, string> = { tag_type: 'Tag Type' };
		return map[key] ?? key;
	}
}));

vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => ({ destroy: vi.fn() }))
}));

const defaultTagType = { id: 42, name: 'Difficulty Level', description: 'How hard the question is' };

function renderDialog(
	props: { open?: boolean; mode?: 'create' | 'edit'; tagType?: typeof defaultTagType | null } = {}
) {
	return render(TagTypeDialog, {
		props: { open: true, mode: 'create', tagType: null, ...props }
	});
}

describe('TagTypeDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Dialog visibility', () => {
		it('does not render dialog content when open is false', () => {
			render(TagTypeDialog, { props: { open: false, mode: 'create', tagType: null } });
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('renders dialog content when open is true', async () => {
			renderDialog();
			expect(await screen.findByRole('dialog')).toBeInTheDocument();
		});
	});

	describe('Create mode', () => {
		it('shows "Create Tag Type" as the dialog title', async () => {
			renderDialog({ mode: 'create' });
			const dialog = await screen.findByRole('dialog');
			expect(within(dialog).getByText('Create Tag Type')).toBeInTheDocument();
		});

		it('renders an empty name input', async () => {
			renderDialog({ mode: 'create' });
			await screen.findByRole('dialog');
			expect(screen.getByLabelText('Name')).toHaveValue('');
		});

		it('renders an empty description textarea', async () => {
			renderDialog({ mode: 'create' });
			await screen.findByRole('dialog');
			expect(screen.getByLabelText('Description')).toHaveValue('');
		});

		it('shows "Save" as the submit button text', async () => {
			renderDialog({ mode: 'create' });
			await screen.findByRole('dialog');
			expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
		});

		it('sets form action to ?/createTagType', async () => {
			renderDialog({ mode: 'create' });
			await screen.findByRole('dialog');
			const form = screen.getByRole('dialog').querySelector('form');
			expect(form).toHaveAttribute('action', '?/createTagType');
		});

		it('does not render a hidden id input in create mode', async () => {
			renderDialog({ mode: 'create' });
			await screen.findByRole('dialog');
			const form = screen.getByRole('dialog').querySelector('form');
			expect(form!.querySelector('input[name="id"]')).not.toBeInTheDocument();
		});

		it('disables the Save button when name is empty', async () => {
			renderDialog({ mode: 'create' });
			await screen.findByRole('dialog');
			expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
		});

		it('disables the Save button when name is only whitespace', async () => {
			renderDialog({ mode: 'create' });
			await screen.findByRole('dialog');
			await fireEvent.input(screen.getByLabelText('Name'), { target: { value: '   ' } });
			expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
		});

		it('enables the Save button when name has a non-empty value', async () => {
			renderDialog({ mode: 'create' });
			await screen.findByRole('dialog');
			await fireEvent.input(screen.getByLabelText('Name'), {
				target: { value: 'Difficulty Level' }
			});
			expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
		});
	});

	describe('Edit mode', () => {
		it('shows "Edit Tag Type" as the dialog title', async () => {
			renderDialog({ mode: 'edit', tagType: defaultTagType });
			const dialog = await screen.findByRole('dialog');
			expect(within(dialog).getByText('Edit Tag Type')).toBeInTheDocument();
		});

		it('pre-fills the name input with tagType.name', async () => {
			renderDialog({ mode: 'edit', tagType: defaultTagType });
			await screen.findByRole('dialog');
			expect(screen.getByLabelText('Name')).toHaveValue('Difficulty Level');
		});

		it('pre-fills the description textarea with tagType.description', async () => {
			renderDialog({ mode: 'edit', tagType: defaultTagType });
			await screen.findByRole('dialog');
			expect(screen.getByLabelText('Description')).toHaveValue('How hard the question is');
		});

		it('shows "Save changes" as the submit button text', async () => {
			renderDialog({ mode: 'edit', tagType: defaultTagType });
			await screen.findByRole('dialog');
			expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
		});

		it('sets form action to ?/updateTagType', async () => {
			renderDialog({ mode: 'edit', tagType: defaultTagType });
			await screen.findByRole('dialog');
			const form = screen.getByRole('dialog').querySelector('form');
			expect(form).toHaveAttribute('action', '?/updateTagType');
		});

		it('renders a hidden id input with tagType.id in edit mode', async () => {
			renderDialog({ mode: 'edit', tagType: defaultTagType });
			await screen.findByRole('dialog');
			const form = screen.getByRole('dialog').querySelector('form');
			const idInput = form!.querySelector('input[name="id"]') as HTMLInputElement;
			expect(idInput).toBeInTheDocument();
			expect(idInput.value).toBe('42');
		});

		it('enables Save changes when tagType name is pre-filled', async () => {
			renderDialog({ mode: 'edit', tagType: defaultTagType });
			await screen.findByRole('dialog');
			expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
		});

		it('disables Save changes when name is cleared', async () => {
			renderDialog({ mode: 'edit', tagType: defaultTagType });
			await screen.findByRole('dialog');
			await fireEvent.input(screen.getByLabelText('Name'), { target: { value: '' } });
			expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
		});

		it('renders empty description when tagType.description is null', async () => {
			renderDialog({ mode: 'edit', tagType: { id: 1, name: 'Subject', description: null } });
			await screen.findByRole('dialog');
			expect(screen.getByLabelText('Description')).toHaveValue('');
		});

		it('renders empty description when tagType.description is undefined', async () => {
			renderDialog({ mode: 'edit', tagType: { id: 1, name: 'Subject', description: undefined } });
			await screen.findByRole('dialog');
			expect(screen.getByLabelText('Description')).toHaveValue('');
		});
	});

	describe('Form fields', () => {
		it('renders a Name label', async () => {
			renderDialog();
			await screen.findByRole('dialog');
			expect(screen.getByText('Name')).toBeInTheDocument();
		});

		it('renders a Description label', async () => {
			renderDialog();
			await screen.findByRole('dialog');
			expect(screen.getByText('Description')).toBeInTheDocument();
		});

		it('renders name input with correct placeholder', async () => {
			renderDialog();
			await screen.findByRole('dialog');
			expect(screen.getByPlaceholderText('E.g., Difficulty Level')).toBeInTheDocument();
		});

		it('renders description textarea with correct placeholder', async () => {
			renderDialog();
			await screen.findByRole('dialog');
			expect(
				screen.getByPlaceholderText('Optional — helps others understand what this tag type is for')
			).toBeInTheDocument();
		});

		it('name input has name="name" attribute', async () => {
			renderDialog();
			await screen.findByRole('dialog');
			expect(screen.getByLabelText('Name')).toHaveAttribute('name', 'name');
		});

		it('description textarea has name="description" attribute', async () => {
			renderDialog();
			await screen.findByRole('dialog');
			expect(screen.getByLabelText('Description')).toHaveAttribute('name', 'description');
		});

		it('updates name field value as user types', async () => {
			renderDialog();
			await screen.findByRole('dialog');
			const nameInput = screen.getByLabelText('Name');
			await fireEvent.input(nameInput, { target: { value: 'Topic' } });
			expect(nameInput).toHaveValue('Topic');
		});

		it('updates description field value as user types', async () => {
			renderDialog();
			await screen.findByRole('dialog');
			const descInput = screen.getByLabelText('Description');
			await fireEvent.input(descInput, { target: { value: 'A helpful description' } });
			expect(descInput).toHaveValue('A helpful description');
		});

		it('name input has required attribute', async () => {
			renderDialog();
			await screen.findByRole('dialog');
			expect(screen.getByLabelText('Name')).toBeRequired();
		});
	});

	describe('Form structure', () => {
		it('form uses POST method', async () => {
			renderDialog();
			await screen.findByRole('dialog');
			const form = screen.getByRole('dialog').querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
		});

		it('the submit button is inside the form', async () => {
			renderDialog({ mode: 'create' });
			await screen.findByRole('dialog');
			const form = screen.getByRole('dialog').querySelector('form');
			expect(within(form as HTMLElement).getByRole('button', { name: 'Save' })).toBeInTheDocument();
		});

		it('submit button has type="submit"', async () => {
			renderDialog({ mode: 'create' });
			await screen.findByRole('dialog');
			expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'submit');
		});
	});

	describe('Dialog resets on reopen', () => {
		it('resets name and description to empty when reopening in create mode', async () => {
			const { rerender } = renderDialog({ mode: 'create', open: false });
			await rerender({ open: true, mode: 'create', tagType: null });
			await screen.findByRole('dialog');
			expect(screen.getByLabelText('Name')).toHaveValue('');
			expect(screen.getByLabelText('Description')).toHaveValue('');
		});

		it('populates fields from tagType when reopening in edit mode', async () => {
			const { rerender } = renderDialog({ mode: 'edit', tagType: defaultTagType, open: false });
			await rerender({ open: true, mode: 'edit', tagType: defaultTagType });
			await screen.findByRole('dialog');
			expect(screen.getByLabelText('Name')).toHaveValue('Difficulty Level');
			expect(screen.getByLabelText('Description')).toHaveValue('How hard the question is');
		});
	});

	describe('Save button enabled/disabled transitions', () => {
		it('becomes enabled once the first character is typed', async () => {
			renderDialog({ mode: 'create' });
			await screen.findByRole('dialog');
			const saveBtn = screen.getByRole('button', { name: 'Save' });
			expect(saveBtn).toBeDisabled();
			await fireEvent.input(screen.getByLabelText('Name'), { target: { value: 'X' } });
			expect(saveBtn).toBeEnabled();
		});

		it('becomes disabled again when name is cleared after typing', async () => {
			renderDialog({ mode: 'create' });
			await screen.findByRole('dialog');
			const nameInput = screen.getByLabelText('Name');
			await fireEvent.input(nameInput, { target: { value: 'Something' } });
			await fireEvent.input(nameInput, { target: { value: '' } });
			expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
		});
	});
});
