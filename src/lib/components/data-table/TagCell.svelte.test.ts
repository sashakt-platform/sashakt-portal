import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import TruncatedCell from './TruncatedCell.svelte';
import { formatTags } from './column-helpers';

describe('formatTags', () => {
	it('should return empty string for empty array', () => {
		expect(formatTags([])).toBe('');
	});

	it('should format a single tag name', () => {
		expect(formatTags([{ name: 'Math' }])).toBe('Math');
	});

	it('should format tag with tag_type in parentheses', () => {
		expect(formatTags([{ name: 'Math', tag_type: { name: 'Subject' } }])).toBe('Math (Subject)');
	});

	it('should format multiple tags separated by commas', () => {
		expect(formatTags([{ name: 'Math' }, { name: 'Science' }, { name: 'English' }])).toBe(
			'Math, Science, English'
		);
	});

	it('should format mix of tags with and without tag_type', () => {
		expect(
			formatTags([
				{ name: 'Math', tag_type: { name: 'Subject' } },
				{ name: 'Easy' },
				{ name: 'Grade 5', tag_type: { name: 'Level' } }
			])
		).toBe('Math (Subject), Easy, Grade 5 (Level)');
	});

	it('should handle tag with undefined tag_type', () => {
		expect(formatTags([{ name: 'Math', tag_type: undefined }])).toBe('Math');
	});

	it('should handle tag with tag_type but empty name', () => {
		expect(formatTags([{ name: 'Math', tag_type: { name: '' } }])).toBe('Math');
	});
});

describe('TruncatedCell', () => {
	describe('Rendering', () => {
		it('should render nothing when text is empty', () => {
			const { container } = render(TruncatedCell, { props: { text: '' } });
			expect(container.querySelector('span')).not.toBeInTheDocument();
		});

		it('should render text content', () => {
			render(TruncatedCell, { props: { text: 'Math' } });
			expect(screen.getByText('Math')).toBeInTheDocument();
		});
	});

	describe('Truncation', () => {
		it('should apply truncate class to the span', () => {
			render(TruncatedCell, { props: { text: 'Math' } });

			const span = screen.getByText('Math');
			expect(span).toHaveClass('truncate');
			expect(span).toHaveClass('block');
		});

		it('should handle long text', () => {
			const longText = 'A'.repeat(300);
			render(TruncatedCell, { props: { text: longText } });

			const span = screen.getByText(longText);
			expect(span).toBeInTheDocument();
			expect(span).toHaveClass('truncate');
		});
	});

	describe('Tooltip', () => {
		it('should render tooltip trigger when text exists', () => {
			const { container } = render(TruncatedCell, { props: { text: 'Math' } });

			const trigger = container.querySelector('[data-slot="tooltip-trigger"]');
			expect(trigger).toBeInTheDocument();
		});

		it('should not render tooltip when text is empty', () => {
			const { container } = render(TruncatedCell, { props: { text: '' } });

			const trigger = container.querySelector('[data-slot="tooltip-trigger"]');
			expect(trigger).not.toBeInTheDocument();
		});
	});
});
