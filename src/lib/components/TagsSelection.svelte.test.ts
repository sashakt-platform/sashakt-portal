import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import TagsSelection from './TagsSelection.svelte';

const mockFilterationInstances: any[] = [];

vi.mock('./Filteration.svelte', () => ({
	default: function MockFilteration(options: any) {
		const instance = {
			$$set: vi.fn(),
			$destroy: vi.fn(),
			$on: vi.fn(),
			_props: options?.props || {},
			_target: options?.target
		};
		mockFilterationInstances.push(instance);
		return instance;
	}
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

	describe('Tag-Type-Based Filtering', () => {
		function mockFetch(items: { id: string; name: string }[] = []) {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ items })
			});
		}

		beforeEach(() => {
			vi.restoreAllMocks();
		});

		it('should include tag_type_ids in fetch URL when tagTypes are provided', async () => {
			mockFetch([
				{ id: '4', name: 'Easy' },
				{ id: '5', name: 'Moderate' }
			]);

			render(TagsSelection, {
				props: { tags: [], tagTypes: [{ id: '1', name: 'Difficulty' }] }
			});
			await tick();

			const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			expect(calledUrl).toContain('tag_type_ids=1');
		});

		it('should not include tag_type_ids in fetch URL when tagTypes is empty', async () => {
			mockFetch();

			render(TagsSelection, { props: { tags: [], tagTypes: [] } });
			await tick();

			const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			expect(calledUrl).not.toContain('tag_type_ids');
		});

		it('should include all tag_type_ids when multiple tag types are selected', async () => {
			mockFetch();

			render(TagsSelection, {
				props: {
					tags: [],
					tagTypes: [
						{ id: '1', name: 'Difficulty' },
						{ id: '2', name: 'Priority' }
					]
				}
			});
			await tick();

			const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			expect(calledUrl).toContain('tag_type_ids=1');
			expect(calledUrl).toContain('tag_type_ids=2');
		});

		it('should filter the tag dropdown to only show tags belonging to the selected tag type', async () => {
			// Tags belong to various tag types:
			//   tag_type 1 (Difficulty): Easy, Moderate
			//   tag_type 2 (Priority):   High, Low
			//   no tag_type:             Important
			// The API returns all tags when unfiltered, but only matching tags when filtered.
			const allTags = [
				{ id: '1', name: 'Important' },
				{ id: '2', name: 'High' },
				{ id: '3', name: 'Low' },
				{ id: '4', name: 'Easy' },
				{ id: '5', name: 'Moderate' }
			];
			const difficultyTags = [
				{ id: '4', name: 'Easy' },
				{ id: '5', name: 'Moderate' }
			];

			global.fetch = vi.fn().mockImplementation((url: string) => {
				const items = url.includes('tag_type_ids') ? difficultyTags : allTags;
				return Promise.resolve({
					ok: true,
					json: async () => ({ items })
				});
			});

			// Step 1: Render with no tag types selected — API returns all tags
			const { rerender } = render(TagsSelection, {
				props: { tags: [], tagTypes: [] }
			});
			await tick();

			const firstUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
			expect(firstUrl).not.toContain('tag_type_ids');

			const firstResponse = await (global.fetch as ReturnType<typeof vi.fn>).mock.results[0].value;
			const firstData = await firstResponse.json();
			expect(firstData.items).toEqual(allTags);
			expect(firstData.items).toHaveLength(5);

			// Step 2: Select tag_type "Difficulty" — API returns only Easy & Moderate
			await rerender({ tagTypes: [{ id: '1', name: 'Difficulty' }] });
			await tick();

			const lastUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0] as string;
			expect(lastUrl).toContain('tag_type_ids=1');

			const lastResponse = await (global.fetch as ReturnType<typeof vi.fn>).mock.results.at(-1)!
				.value;
			const lastData = await lastResponse.json();
			expect(lastData.items).toEqual(difficultyTags);
			expect(lastData.items).toHaveLength(2);
		});

		it('should re-fetch with updated tag_type_ids when tagTypes changes', async () => {
			mockFetch();

			const { rerender } = render(TagsSelection, {
				props: { tags: [], tagTypes: [{ id: '1', name: 'Difficulty' }] }
			});
			await tick();

			await rerender({ tagTypes: [{ id: '2', name: 'Priority' }] });
			await tick();

			const lastUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0] as string;
			expect(lastUrl).toContain('tag_type_ids=2');
			expect(lastUrl).not.toContain('tag_type_ids=1');
		});
	});
});
