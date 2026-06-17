import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TagTypeCell from './TagTypeCell.svelte';

vi.mock('$lib/nomenclature', () => ({
	useTerms: () => (key: string, modifier?: string) => {
		const map: Record<string, string> = { tag_type: 'Tag Type', tag: 'Tag' };
		const val = map[key] ?? key;
		return modifier === 'lower' ? val.toLowerCase() : val;
	}
}));

const defaultTagType = {
	id: 1,
	name: 'Difficulty',
	description: 'Indicates how hard the question is',
	tags: [
		{ id: 10, name: 'Easy' },
		{ id: 11, name: 'Medium' },
		{ id: 12, name: 'Hard' }
	]
};

function renderCell(
	props: {
		tagType?: { id: number | string; name: string; description?: string; tags?: { id: number | string; name: string }[] };
		canEdit?: boolean;
		canDelete?: boolean;
		onEdit?: (tagType: { id: number | string; name: string; description?: string }) => void;
		onDelete?: (tagType: { id: number | string; name: string }) => void;
	} = {}
) {
	return render(TagTypeCell, {
		props: { tagType: defaultTagType, ...props }
	});
}

describe('TagTypeCell', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Name display', () => {
		it('shows the tag type name', () => {
			renderCell();
			expect(screen.getByText('Difficulty')).toBeInTheDocument();
		});

		it('name is inside a semibold container', () => {
			renderCell();
			expect(screen.getByText('Difficulty').closest('.font-semibold')).toBeInTheDocument();
		});

		it('updates the displayed name when tagType prop changes', async () => {
			const { rerender } = renderCell({ tagType: { id: 1, name: 'Difficulty' } });
			expect(screen.getByText('Difficulty')).toBeInTheDocument();
			await rerender({ tagType: { id: 2, name: 'Topic' } });
			expect(screen.getByText('Topic')).toBeInTheDocument();
			expect(screen.queryByText('Difficulty')).not.toBeInTheDocument();
		});
	});

	describe('Tags count', () => {
		it('shows the tag count in parentheses when tags are provided', () => {
			renderCell({ tagType: { ...defaultTagType, tags: [{ id: 1, name: 'Easy' }, { id: 2, name: 'Hard' }] } });
			expect(screen.getByText('(2)')).toBeInTheDocument();
		});

		it('shows (0) when tags array is empty', () => {
			renderCell({ tagType: { ...defaultTagType, tags: [] } });
			expect(screen.getByText('(0)')).toBeInTheDocument();
		});

		it('shows the correct count for three tags', () => {
			renderCell();
			expect(screen.getByText('(3)')).toBeInTheDocument();
		});

		it('does not show a count when tags prop is undefined', () => {
			renderCell({ tagType: { id: 1, name: 'Difficulty' } });
			expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
		});
	});

	describe('Description display', () => {
		it('shows the description when provided', () => {
			renderCell();
			expect(screen.getByText('Indicates how hard the question is')).toBeInTheDocument();
		});

		it('does not show description when tagType has no description property', () => {
			renderCell({ tagType: { id: 1, name: 'Difficulty' } });
			expect(document.querySelector('.text-sm')).toBeNull();
		});

		it('does not render a description element when description is an empty string', () => {
			renderCell({ tagType: { id: 1, name: 'Difficulty', description: '' } });
			expect(document.querySelector('.text-sm')).toBeNull();
		});
	});

	describe('Edit button', () => {
		it('renders the edit button when canEdit is true', () => {
			renderCell({ canEdit: true });
			expect(screen.getByTitle('Edit tag type')).toBeInTheDocument();
		});

		it('does not render the edit button when canEdit is false', () => {
			renderCell({ canEdit: false });
			expect(screen.queryByTitle('Edit tag type')).not.toBeInTheDocument();
		});

		it('edit button has type="button"', () => {
			renderCell({ canEdit: true });
			const btn = screen.getByTitle('Edit tag type') as HTMLButtonElement;
			expect(btn.type).toBe('button');
		});

		it('calls onEdit with the full tagType object when clicked', async () => {
			const onEdit = vi.fn();
			renderCell({ canEdit: true, onEdit });
			await fireEvent.click(screen.getByTitle('Edit tag type'));
			expect(onEdit).toHaveBeenCalledOnce();
			expect(onEdit).toHaveBeenCalledWith(defaultTagType);
		});

		it('calls onEdit including description in the passed object', async () => {
			const onEdit = vi.fn();
			const tagType = { id: 5, name: 'Topic', description: 'Subject area' };
			renderCell({ tagType, canEdit: true, onEdit });
			await fireEvent.click(screen.getByTitle('Edit tag type'));
			expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ description: 'Subject area' }));
		});

		it('does not call onEdit when the button is not clicked', () => {
			const onEdit = vi.fn();
			renderCell({ canEdit: true, onEdit });
			expect(onEdit).not.toHaveBeenCalled();
		});
	});

	describe('Delete button', () => {
		it('renders the delete button when canDelete is true', () => {
			renderCell({ canDelete: true });
			expect(screen.getByTitle('Delete tag type')).toBeInTheDocument();
		});

		it('does not render the delete button when canDelete is false', () => {
			renderCell({ canDelete: false });
			expect(screen.queryByTitle('Delete tag type')).not.toBeInTheDocument();
		});

		it('delete button has type="button"', () => {
			renderCell({ canDelete: true });
			const btn = screen.getByTitle('Delete tag type') as HTMLButtonElement;
			expect(btn.type).toBe('button');
		});

		it('calls onDelete with the tagType object when clicked', async () => {
			const onDelete = vi.fn();
			renderCell({ canDelete: true, onDelete });
			await fireEvent.click(screen.getByTitle('Delete tag type'));
			expect(onDelete).toHaveBeenCalledOnce();
			expect(onDelete).toHaveBeenCalledWith(defaultTagType);
		});

		it('does not call onDelete when the button is not clicked', () => {
			const onDelete = vi.fn();
			renderCell({ canDelete: true, onDelete });
			expect(onDelete).not.toHaveBeenCalled();
		});
	});

	describe('Button visibility rules', () => {
		it('shows both edit and delete buttons when both permissions are true', () => {
			renderCell({ canEdit: true, canDelete: true });
			expect(screen.getByTitle('Edit tag type')).toBeInTheDocument();
			expect(screen.getByTitle('Delete tag type')).toBeInTheDocument();
		});

		it('shows only the edit button when canEdit=true and canDelete=false', () => {
			renderCell({ canEdit: true, canDelete: false });
			expect(screen.getByTitle('Edit tag type')).toBeInTheDocument();
			expect(screen.queryByTitle('Delete tag type')).not.toBeInTheDocument();
		});

		it('shows only the delete button when canDelete=true and canEdit=false', () => {
			renderCell({ canEdit: false, canDelete: true });
			expect(screen.queryByTitle('Edit tag type')).not.toBeInTheDocument();
			expect(screen.getByTitle('Delete tag type')).toBeInTheDocument();
		});

		it('renders no action buttons when both canEdit and canDelete are false', () => {
			renderCell({ canEdit: false, canDelete: false });
			expect(screen.queryByRole('button')).not.toBeInTheDocument();
		});

		it('renders no action buttons by default (both props default to false)', () => {
			renderCell();
			expect(screen.queryByRole('button')).not.toBeInTheDocument();
		});
	});

	describe('ID types', () => {
		it('passes the numeric id to onEdit correctly', async () => {
			const onEdit = vi.fn();
			renderCell({ tagType: { id: 42, name: 'Region' }, canEdit: true, onEdit });
			await fireEvent.click(screen.getByTitle('Edit tag type'));
			expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }));
		});

		it('passes a string id to onDelete correctly', async () => {
			const onDelete = vi.fn();
			renderCell({ tagType: { id: 'uuid-abc', name: 'Region' }, canDelete: true, onDelete });
			await fireEvent.click(screen.getByTitle('Delete tag type'));
			expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'uuid-abc' }));
		});
	});
});
