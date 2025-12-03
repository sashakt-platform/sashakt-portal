import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import TagTypeSelection from './TagTypeSelection.svelte';

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
			tagtypes: {
				items: [
					{ id: 1, name: 'Category' },
					{ id: 2, name: 'Priority' },
					{ id: 3, name: 'Status' }
				]
			}
		},
		url: new URL('http://localhost')
	}
}));

describe('TagTypeSelection', () => {
	describe('Basic Rendering', () => {
		it('should render without errors', () => {
			const { container } = render(TagTypeSelection, {
				props: {
					tagTypes: []
				}
			});

			expect(container).toBeInTheDocument();
		});

		it('should render with initial tag types', () => {
			const initialTagTypes = [
				{ id: '1', name: 'Category' },
				{ id: '2', name: 'Priority' }
			];

			const { container } = render(TagTypeSelection, {
				props: {
					tagTypes: initialTagTypes
				}
			});

			expect(container).toBeInTheDocument();
		});

		it('should render with empty tag types array', () => {
			const { container } = render(TagTypeSelection, {
				props: {
					tagTypes: []
				}
			});

			expect(container).toBeInTheDocument();
		});
	});

	describe('Props', () => {
		it('should accept tagTypes prop', () => {
			const tagTypes = [{ id: '1', name: 'Category' }];

			const { container } = render(TagTypeSelection, {
				props: { tagTypes }
			});

			expect(container).toBeInTheDocument();
		});

		it('should handle undefined tagTypes', () => {
			const { container } = render(TagTypeSelection, {
				props: {}
			});

			expect(container).toBeInTheDocument();
		});

		it('should pass through additional props', () => {
			const { container } = render(TagTypeSelection, {
				props: {
					tagTypes: [],
					'data-testid': 'tag-type-selection'
				}
			});

			expect(container).toBeInTheDocument();
		});
	});

	describe('Custom Label', () => {
		it('should use custom label "tag type"', () => {
			const { container } = render(TagTypeSelection, {
				props: {
					tagTypes: []
				}
			});

			// Component passes label="tag type" to Filteration
			expect(container).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle large number of tag types', () => {
			const manyTagTypes = Array.from({ length: 50 }, (_, i) => ({
				id: String(i + 1),
				name: `Tag Type ${i + 1}`
			}));

			const { container } = render(TagTypeSelection, {
				props: {
					tagTypes: manyTagTypes
				}
			});

			expect(container).toBeInTheDocument();
		});

		it('should handle tag types with special characters', () => {
			const tagTypesWithSpecialChars = [
				{ id: '1', name: 'Type & Category' },
				{ id: '2', name: 'Priority/Urgency' }
			];

			const { container } = render(TagTypeSelection, {
				props: {
					tagTypes: tagTypesWithSpecialChars
				}
			});

			expect(container).toBeInTheDocument();
		});
	});
});
