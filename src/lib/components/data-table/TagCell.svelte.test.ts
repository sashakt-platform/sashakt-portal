import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import TagCell from './TagCell.svelte';

describe('TagCell', () => {
	describe('Rendering', () => {
		it('should render nothing when tags is empty', () => {
			const { container } = render(TagCell, { props: { tags: [] } });
			expect(container.querySelector('[data-slot="badge"]')).not.toBeInTheDocument();
		});

		it('should render a single tag name', () => {
			render(TagCell, {
				props: {
					tags: [{ name: 'Math' }]
				}
			});

			expect(screen.getByText('Math')).toBeInTheDocument();
		});

		it('should render tag with tag_type in parentheses', () => {
			render(TagCell, {
				props: {
					tags: [{ name: 'Math', tag_type: { name: 'Subject' } }]
				}
			});

			expect(screen.getByText('Math (Subject)')).toBeInTheDocument();
		});

		it('should render first 2 tags as individual badges', () => {
			render(TagCell, {
				props: {
					tags: [{ name: 'Math' }, { name: 'Science' }, { name: 'English' }]
				}
			});

			expect(screen.getByText('Math')).toBeInTheDocument();
			expect(screen.getByText('Science')).toBeInTheDocument();
			expect(screen.queryByText('English')).not.toBeInTheDocument();
			expect(screen.getByText('+1')).toBeInTheDocument();
		});

		it('should render mix of tags with and without tag_type', () => {
			render(TagCell, {
				props: {
					tags: [
						{ name: 'Math', tag_type: { name: 'Subject' } },
						{ name: 'Easy' },
						{ name: 'Grade 5', tag_type: { name: 'Level' } }
					]
				}
			});

			expect(screen.getByText('Math (Subject)')).toBeInTheDocument();
			expect(screen.getByText('Easy')).toBeInTheDocument();
			expect(screen.queryByText('Grade 5 (Level)')).not.toBeInTheDocument();
			expect(screen.getByText('+1')).toBeInTheDocument();
		});

		it('should not show overflow badge when 2 or fewer tags', () => {
			const { container } = render(TagCell, {
				props: {
					tags: [{ name: 'Math' }, { name: 'Science' }]
				}
			});

			expect(screen.getByText('Math')).toBeInTheDocument();
			expect(screen.getByText('Science')).toBeInTheDocument();
			const badges = container.querySelectorAll('[data-slot="badge"]');
			expect(badges).toHaveLength(2);
		});

		it('should show correct overflow count with many tags', () => {
			render(TagCell, {
				props: {
					tags: [
						{ name: 'Math' },
						{ name: 'Science' },
						{ name: 'English' },
						{ name: 'History' },
						{ name: 'Geography' }
					]
				}
			});

			expect(screen.getByText('Math')).toBeInTheDocument();
			expect(screen.getByText('Science')).toBeInTheDocument();
			expect(screen.getByText('+3')).toBeInTheDocument();
		});
	});

	describe('Badge rendering', () => {
		it('should render tags as badge elements', () => {
			const { container } = render(TagCell, {
				props: {
					tags: [{ name: 'Math' }]
				}
			});

			const badge = container.querySelector('[data-slot="badge"]');
			expect(badge).toBeInTheDocument();
		});

		it('should apply truncate class to tag text', () => {
			render(TagCell, {
				props: {
					tags: [{ name: 'Math' }]
				}
			});

			const span = screen.getByText('Math');
			expect(span).toHaveClass('truncate');
		});
	});

	describe('Tooltip', () => {
		it('should render tooltip trigger when tags exist', () => {
			const { container } = render(TagCell, {
				props: {
					tags: [{ name: 'Math' }]
				}
			});

			const trigger = container.querySelector('[data-slot="tooltip-trigger"]');
			expect(trigger).toBeInTheDocument();
		});

		it('should not render tooltip when tags is empty', () => {
			const { container } = render(TagCell, {
				props: { tags: [] }
			});

			const trigger = container.querySelector('[data-slot="tooltip-trigger"]');
			expect(trigger).not.toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle tag with undefined tag_type', () => {
			render(TagCell, {
				props: {
					tags: [{ name: 'Math', tag_type: undefined }]
				}
			});

			expect(screen.getByText('Math')).toBeInTheDocument();
		});

		it('should handle tag with tag_type but empty name', () => {
			render(TagCell, {
				props: {
					tags: [{ name: 'Math', tag_type: { name: '' } }]
				}
			});

			expect(screen.getByText('Math')).toBeInTheDocument();
		});

		it('should handle single tag with long text', () => {
			const longTag = 'A'.repeat(300);
			render(TagCell, {
				props: {
					tags: [{ name: longTag }]
				}
			});

			const span = screen.getByText(longTag);
			expect(span).toBeInTheDocument();
			expect(span).toHaveClass('truncate');
		});
	});
});
