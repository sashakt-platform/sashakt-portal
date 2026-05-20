import '@testing-library/jest-dom/vitest';
import { render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import RichText from './RichText.svelte';

vi.mock('$app/environment', () => ({ browser: true }));

describe('RichText', () => {
	let typesetClear: Mock;
	let typesetPromise: Mock;

	beforeEach(() => {
		typesetClear = vi.fn();
		typesetPromise = vi.fn().mockResolvedValue(undefined);
		(window as Window & { MathJax?: unknown }).MathJax = {
			startup: { promise: Promise.resolve() },
			typesetClear,
			typesetPromise
		};
	});

	afterEach(() => {
		delete (window as Window & { MathJax?: unknown }).MathJax;
		document.getElementById('MathJax-script')?.remove();
	});

	describe('rendering', () => {
		it('renders HTML markup from the content prop', () => {
			const { container } = render(RichText, { content: '<strong>Bold text</strong>' });
			expect(container.querySelector('strong')).toBeInTheDocument();
			expect(container.querySelector('strong')).toHaveTextContent('Bold text');
		});

		it('renders as a div by default', () => {
			const { container } = render(RichText, { content: 'text' });
			expect(container.querySelector('div.rich-text')).toBeInTheDocument();
		});

		it('renders as a span when as="span"', () => {
			const { container } = render(RichText, { content: 'text', as: 'span' });
			expect(container.querySelector('span.rich-text')).toBeInTheDocument();
			expect(container.querySelector('div.rich-text')).not.toBeInTheDocument();
		});

		it('always applies the rich-text class', () => {
			const { container } = render(RichText, { content: 'text' });
			expect(container.firstElementChild).toHaveClass('rich-text');
		});

		it('appends additional class names alongside rich-text', () => {
			const { container } = render(RichText, { content: 'text', class: 'prose text-sm' });
			expect(container.firstElementChild).toHaveClass('rich-text', 'prose', 'text-sm');
		});

		it('renders empty when content is null', () => {
			const { container } = render(RichText, { content: null });
			// Svelte 5 {@html ''} emits a <!---> marker but no actual elements or text
			expect(container.querySelector('.rich-text')?.textContent).toBe('');
			expect(container.querySelector('.rich-text')?.children.length).toBe(0);
		});

		it('renders empty when content is not provided', () => {
			const { container } = render(RichText);
			expect(container.querySelector('.rich-text')?.textContent).toBe('');
			expect(container.querySelector('.rich-text')?.children.length).toBe(0);
		});

		it('preserves HTML structure and LaTeX delimiters in imported question content', () => {
			const { container } = render(RichText, {
				content: '<p>The moment is \\(Ni^{2+}\\)</p>'
			});

			expect(container.querySelector('p')).toBeInTheDocument();

			expect(container.querySelector('.rich-text')?.textContent).toContain('The moment is');

			expect(container.querySelector('.rich-text')?.innerHTML).toContain('\\(Ni^{2+}\\)');
		});
	});

	describe('MathJax typesetting', () => {
		it('calls typesetClear and typesetPromise with the element after mount', async () => {
			const { container } = render(RichText, { content: '<p>\\(x^2 + y^2\\)</p>' });
			const element = container.querySelector('.rich-text') as HTMLElement;

			await waitFor(() => {
				expect(typesetClear).toHaveBeenCalledWith([element]);
				expect(typesetPromise).toHaveBeenCalledWith([element]);
			});
		});

		it('calls typesetClear before typesetPromise', async () => {
			const callOrder: string[] = [];
			typesetClear.mockImplementation(() => callOrder.push('clear'));
			typesetPromise.mockImplementation(() => {
				callOrder.push('typeset');
				return Promise.resolve();
			});

			render(RichText, { content: '<p>\\(\\frac{1}{2}\\)</p>' });

			await waitFor(() => expect(callOrder).toContain('typeset'));
			expect(callOrder.indexOf('clear')).toBeLessThan(callOrder.indexOf('typeset'));
		});

		it('waits for startup.promise to resolve before calling typesetPromise', async () => {
			let resolveStartup!: () => void;
			const startupPromise = new Promise<void>((resolve) => {
				resolveStartup = resolve;
			});
			(window as Window & { MathJax?: unknown }).MathJax = {
				startup: { promise: startupPromise },
				typesetClear,
				typesetPromise
			};

			render(RichText, { content: '<p>formula</p>' });

			await new Promise((r) => setTimeout(r, 30));
			expect(typesetPromise).not.toHaveBeenCalled();

			resolveStartup();
			await waitFor(() => expect(typesetPromise).toHaveBeenCalled());
		});

		it('re-typesets when content prop changes', async () => {
			const { rerender } = render(RichText, { content: '<p>\\(a\\)</p>' });

			await waitFor(() => expect(typesetPromise).toHaveBeenCalled());
			typesetClear.mockClear();
			typesetPromise.mockClear();

			await rerender({ content: '<p>\\(b\\)</p>' });

			await waitFor(() => {
				expect(typesetClear).toHaveBeenCalled();
				expect(typesetPromise).toHaveBeenCalled();
			});
		});

		it('skips typesetting when window.MathJax is not available', async () => {
			delete (window as Window & { MathJax?: unknown }).MathJax;

			render(RichText, { content: '<p>formula</p>' });

			await new Promise((r) => setTimeout(r, 50));
			expect(typesetClear).not.toHaveBeenCalled();
			expect(typesetPromise).not.toHaveBeenCalled();
		});

		it('does not crash when typesetPromise rejects', async () => {
			typesetPromise.mockRejectedValue(new Error('MathJax typeset failed'));

			expect(() => render(RichText, { content: '<p>formula</p>' })).not.toThrow();
			await new Promise((r) => setTimeout(r, 50));
		});

		it('does not crash when startup.promise rejects', async () => {
			const startupError = new Promise<void>((_, reject) =>
				setTimeout(() => reject(new Error('MathJax startup failed')), 0)
			);
			(window as Window & { MathJax?: unknown }).MathJax = {
				startup: { promise: startupError },
				typesetClear,
				typesetPromise
			};

			expect(() => render(RichText, { content: '<p>formula</p>' })).not.toThrow();
			await new Promise((r) => setTimeout(r, 50));
		});
	});
});
