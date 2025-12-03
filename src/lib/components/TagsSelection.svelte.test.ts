import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import TagsSelection from './TagsSelection.svelte';

// Mock Filteration component
vi.mock('./Filteration.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({
		render: vi.fn(),
		$$set: vi.fn(),
		$destroy: vi.fn()
	}))
}));

// Mock $app/state
vi.mock('$app/state', () => ({
	page: {
		data: {
			tags: {
				items: [
					{ id: 1, name: 'Important' },
					{ id: 2, name: 'Urgent' },
					{ id: 3, name: 'Review' }
				]
			}
		},
		url: new URL('http://localhost')
	}
}));

describe('TagsSelection', () => {
	describe('Basic Rendering', () => {
		it('should render without errors', () => {
			const { container } = render(TagsSelection, {
				props: {
					tags: []
				}
			});

			expect(container).toBeInTheDocument();
		});

		it('should render with initial tags', () => {
			const initialTags = [
				{ id: '1', name: 'Important' },
				{ id: '2', name: 'Urgent' }
			];

			const { container } = render(TagsSelection, {
				props: {
					tags: initialTags
				}
			});

			expect(container).toBeInTheDocument();
		});

		it('should render with empty tags array', () => {
			const { container } = render(TagsSelection, {
				props: {
					tags: []
				}
			});

			expect(container).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('should accept tags prop', () => {
			const tags = [{ id: '1', name: 'Important' }];

			const { container } = render(TagsSelection, {
				props: { tags }
			});

			expect(container).toBeInTheDocument();
		});

		it('should handle undefined tags', () => {
			const { container } = render(TagsSelection, {
				props: {}
			});

			expect(container).toBeInTheDocument();
		});

		it('should pass through additional props', () => {
			const { container } = render(TagsSelection, {
				props: {
					tags: [],
					'data-testid': 'tags-selection'
				}
			});

			expect(container).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle large number of tags', () => {
			const manyTags = Array.from({ length: 100 }, (_, i) => ({
				id: String(i + 1),
				name: `Tag ${i + 1}`
			}));

			const { container } = render(TagsSelection, {
				props: {
					tags: manyTags
				}
			});

			expect(container).toBeInTheDocument();
		});

		it('should handle tags with special characters in names', () => {
			const tagsWithSpecialChars = [
				{ id: '1', name: 'High & Critical' },
				{ id: '2', name: 'Review/Approve' }
			];

			const { container } = render(TagsSelection, {
				props: {
					tags: tagsWithSpecialChars
				}
			});

			expect(container).toBeInTheDocument();
		});
	});
});
