import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import QuestionTextCell from './QuestionTextCell.svelte';

describe('QuestionTextCell', () => {
	describe('Rendering', () => {
		it('should render plain text', () => {
			render(QuestionTextCell, { props: { value: 'What is 2 + 2?' } });
			expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
		});

		it('should render HTML bold tag', () => {
			const { container } = render(QuestionTextCell, {
				props: { value: '<p><strong>Bold question</strong></p>' }
			});
			expect(container.querySelector('strong')).toBeInTheDocument();
			expect(container.querySelector('strong')?.textContent).toBe('Bold question');
		});

		it('should render HTML italic tag', () => {
			const { container } = render(QuestionTextCell, {
				props: { value: '<p><em>Italic question</em></p>' }
			});
			expect(container.querySelector('em')).toBeInTheDocument();
		});

		it('should render list items inline', () => {
			const { container } = render(QuestionTextCell, {
				props: { value: '<ul><li>Option A</li><li>Option B</li></ul>' }
			});
			const items = container.querySelectorAll('li');
			expect(items).toHaveLength(2);
			expect(items[0].textContent).toBe('Option A');
			expect(items[1].textContent).toBe('Option B');
		});

		it('should render nothing visible for empty string', () => {
			const { container } = render(QuestionTextCell, { props: { value: '' } });
			expect(container.querySelector('.rich-text')?.textContent?.trim()).toBe('');
		});

		it('should render with default value when no prop is passed', () => {
			const { container } = render(QuestionTextCell);
			expect(container.querySelector('.rich-text')).toBeInTheDocument();
		});
	});

	describe('HTML structure', () => {
		it('should wrap content in a rich-text element', () => {
			const { container } = render(QuestionTextCell, { props: { value: 'Test' } });
			expect(container.querySelector('.rich-text')).toBeInTheDocument();
		});

		it('should apply overflow-hidden class to the wrapper', () => {
			const { container } = render(QuestionTextCell, { props: { value: 'Test' } });
			const wrapper = container.firstElementChild;
			expect(wrapper).toHaveClass('overflow-hidden');
		});
	});
});
