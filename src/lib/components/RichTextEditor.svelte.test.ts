import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RichTextEditor from './RichTextEditor.svelte';

// ── Hoisted mock infrastructure ────────────────────────────────────────────────
// vi.hoisted ensures these are available inside the vi.mock factory (which is
// lifted above imports at transform time).

const MockEditor = vi.hoisted(() => vi.fn());

const { mockChain, mockEditorInstance, editorCallbacks } = vi.hoisted(() => {
	const chain = {
		focus: vi.fn().mockReturnThis(),
		toggleBold: vi.fn().mockReturnThis(),
		toggleItalic: vi.fn().mockReturnThis(),
		toggleUnderline: vi.fn().mockReturnThis(),
		toggleBulletList: vi.fn().mockReturnThis(),
		toggleOrderedList: vi.fn().mockReturnThis(),
		setColor: vi.fn().mockReturnThis(),
		setHighlight: vi.fn().mockReturnThis(),
		setLink: vi.fn().mockReturnThis(),
		unsetLink: vi.fn().mockReturnThis(),
		setHeading: vi.fn().mockReturnThis(),
		setParagraph: vi.fn().mockReturnThis(),
		run: vi.fn()
	};

	const editor = {
		getHTML: vi.fn(() => '<p></p>'),
		getAttributes: vi.fn(() => ({})),
		isActive: vi.fn(() => false),
		commands: { setContent: vi.fn() },
		chain: vi.fn(() => chain),
		destroy: vi.fn()
	};

	const callbacks = {
		onTransaction: undefined as ((args: { editor: typeof editor }) => void) | undefined
	};

	return { mockChain: chain, mockEditorInstance: editor, editorCallbacks: callbacks };
});

vi.mock('@tiptap/core', () => ({
	Editor: MockEditor
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RichTextEditor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		editorCallbacks.onTransaction = undefined;
		// Restore return values reset by clearAllMocks
		mockEditorInstance.getHTML.mockImplementation(() => '<p></p>');
		mockEditorInstance.getAttributes.mockImplementation(() => ({}));
		mockEditorInstance.isActive.mockImplementation(() => false);
		mockEditorInstance.chain.mockImplementation(() => mockChain);
		mockChain.focus.mockReturnThis();
		mockChain.toggleBold.mockReturnThis();
		mockChain.toggleItalic.mockReturnThis();
		mockChain.toggleUnderline.mockReturnThis();
		mockChain.toggleBulletList.mockReturnThis();
		mockChain.toggleOrderedList.mockReturnThis();
		mockChain.setColor.mockReturnThis();
		mockChain.setHighlight.mockReturnThis();
		mockChain.setLink.mockReturnThis();
		mockChain.unsetLink.mockReturnThis();
		mockChain.setHeading.mockReturnThis();
		mockChain.setParagraph.mockReturnThis();
		MockEditor.mockImplementation(function (opts: Record<string, unknown>) {
			editorCallbacks.onTransaction = opts.onTransaction as typeof editorCallbacks.onTransaction;
			return mockEditorInstance;
		});
	});

	// 1. Rendering ──────────────────────────────────────────────────────────────

	describe('rendering', () => {
		it('renders the Bold toolbar button', () => {
			render(RichTextEditor);
			expect(screen.getByTitle('Bold')).toBeInTheDocument();
		});

		it('renders the Italic toolbar button', () => {
			render(RichTextEditor);
			expect(screen.getByTitle('Italic')).toBeInTheDocument();
		});

		it('renders the Bullet List toolbar button', () => {
			render(RichTextEditor);
			expect(screen.getByTitle('Bullet List')).toBeInTheDocument();
		});

		it('renders the Underline toolbar button', () => {
			render(RichTextEditor);
			expect(screen.getByTitle('Underline')).toBeInTheDocument();
		});

		it('renders the Ordered List toolbar button', () => {
			render(RichTextEditor);
			expect(screen.getByTitle('Ordered List')).toBeInTheDocument();
		});

		it('renders one color picker input (highlight)', () => {
			const { container } = render(RichTextEditor);
			expect(container.querySelectorAll('input[type="color"]')).toHaveLength(1);
		});

		it('renders the Highlight Color label', () => {
			render(RichTextEditor);
			expect(screen.getByTitle('Highlight Color')).toBeInTheDocument();
		});
	});

	// 2. Editor initialization ─────────────────────────────────────────────────

	describe('editor initialization', () => {
		it('initializes Editor with empty string when value is null', () => {
			render(RichTextEditor, { value: null });
			expect(MockEditor).toHaveBeenCalledWith(expect.objectContaining({ content: '' }));
		});

		it('initializes Editor with provided HTML when value is a string', () => {
			render(RichTextEditor, { value: '<p>Hello world</p>' });
			expect(MockEditor).toHaveBeenCalledWith(
				expect.objectContaining({ content: '<p>Hello world</p>' })
			);
		});
	});

	// 3. Toolbar interactions ──────────────────────────────────────────────────

	describe('toolbar interactions', () => {
		it('calls toggleBold when Bold button is clicked', async () => {
			render(RichTextEditor);
			await fireEvent.click(screen.getByTitle('Bold'));
			expect(mockChain.toggleBold).toHaveBeenCalled();
			expect(mockChain.run).toHaveBeenCalled();
		});

		it('calls toggleItalic when Italic button is clicked', async () => {
			render(RichTextEditor);
			await fireEvent.click(screen.getByTitle('Italic'));
			expect(mockChain.toggleItalic).toHaveBeenCalled();
			expect(mockChain.run).toHaveBeenCalled();
		});

		it('calls toggleUnderline when Underline button is clicked', async () => {
			render(RichTextEditor);
			await fireEvent.click(screen.getByTitle('Underline'));
			expect(mockChain.toggleUnderline).toHaveBeenCalled();
			expect(mockChain.run).toHaveBeenCalled();
		});

		it('calls toggleBulletList when Bullet List button is clicked', async () => {
			render(RichTextEditor);
			await fireEvent.click(screen.getByTitle('Bullet List'));
			expect(mockChain.toggleBulletList).toHaveBeenCalled();
			expect(mockChain.run).toHaveBeenCalled();
		});

		it('calls toggleOrderedList when Ordered List button is clicked', async () => {
			render(RichTextEditor);
			await fireEvent.click(screen.getByTitle('Ordered List'));
			expect(mockChain.toggleOrderedList).toHaveBeenCalled();
			expect(mockChain.run).toHaveBeenCalled();
		});
	});

	// 4. Toolbar active state ──────────────────────────────────────────────────

	describe('toolbar active state', () => {
		it('applies active styles to Bold button when bold is toggled on', async () => {
			render(RichTextEditor);

			mockEditorInstance.isActive.mockImplementation((name: string) => name === 'bold');
			editorCallbacks.onTransaction?.({ editor: mockEditorInstance });

			await waitFor(() => {
				expect(screen.getByTitle('Bold')).toHaveClass('bg-accent');
			});
		});

		it('applies inactive styles to Bold button by default', () => {
			render(RichTextEditor);
			expect(screen.getByTitle('Bold')).toHaveClass('text-muted-foreground');
		});
	});

	// 5. External value sync ───────────────────────────────────────────────────

	describe('external value sync', () => {
		it('calls setContent when value prop changes to different content', async () => {
			mockEditorInstance.getHTML.mockReturnValue('<p>Initial</p>');
			const { rerender } = render(RichTextEditor, { value: '<p>Initial</p>' });
			mockEditorInstance.commands.setContent.mockClear();

			await rerender({ value: '<p>Updated</p>' });

			expect(mockEditorInstance.commands.setContent).toHaveBeenCalledWith(
				'<p>Updated</p>',
				expect.objectContaining({ emitUpdate: false })
			);
		});

		it('does not call setContent when null value matches empty editor state', () => {
			// getHTML returns '<p></p>' by default, which normalizes to '' — same as null → ''
			render(RichTextEditor, { value: null });
			expect(mockEditorInstance.commands.setContent).not.toHaveBeenCalled();
		});
	});

	// 6. Link ─────────────────────────────────────────────────────────────────

	describe('link', () => {
		it('renders the Link toolbar button', () => {
			render(RichTextEditor);
			expect(screen.getByTitle('Link')).toBeInTheDocument();
		});

		it('shows the URL input bar when Link button is clicked and no link is active', async () => {
			render(RichTextEditor);
			await fireEvent.click(screen.getByTitle('Link'));
			expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
		});

		it('hides the URL input bar by default', () => {
			render(RichTextEditor);
			expect(screen.queryByPlaceholderText('https://example.com')).not.toBeInTheDocument();
		});

		it('calls setLink with the entered href when Apply is clicked', async () => {
			render(RichTextEditor);
			await fireEvent.click(screen.getByTitle('Link'));

			await fireEvent.input(screen.getByPlaceholderText('https://example.com'), {
				target: { value: 'https://example.com' }
			});
			await fireEvent.click(screen.getByText('Apply'));

			expect(mockChain.setLink).toHaveBeenCalledWith({ href: 'https://example.com' });
			expect(mockChain.run).toHaveBeenCalled();
		});

		it('calls setLink and hides input bar when Enter is pressed in the URL input', async () => {
			render(RichTextEditor);
			await fireEvent.click(screen.getByTitle('Link'));

			const input = screen.getByPlaceholderText('https://example.com');
			await fireEvent.input(input, { target: { value: 'https://example.com' } });
			await fireEvent.keyDown(input, { key: 'Enter' });

			expect(mockChain.setLink).toHaveBeenCalledWith({ href: 'https://example.com' });
			expect(screen.queryByPlaceholderText('https://example.com')).not.toBeInTheDocument();
		});

		it('hides the URL input bar without calling setLink when Cancel is clicked', async () => {
			render(RichTextEditor);
			await fireEvent.click(screen.getByTitle('Link'));
			await fireEvent.click(screen.getByText('Cancel'));

			expect(mockChain.setLink).not.toHaveBeenCalled();
			expect(screen.queryByPlaceholderText('https://example.com')).not.toBeInTheDocument();
		});

		it('hides the URL input bar without calling setLink when Escape is pressed', async () => {
			render(RichTextEditor);
			await fireEvent.click(screen.getByTitle('Link'));

			const input = screen.getByPlaceholderText('https://example.com');
			await fireEvent.keyDown(input, { key: 'Escape' });

			expect(mockChain.setLink).not.toHaveBeenCalled();
			expect(screen.queryByPlaceholderText('https://example.com')).not.toBeInTheDocument();
		});

		it('calls unsetLink when Link button is clicked and a link is active', async () => {
			render(RichTextEditor);

			mockEditorInstance.isActive.mockImplementation((name: string) => name === 'link');
			editorCallbacks.onTransaction?.({ editor: mockEditorInstance });

			await waitFor(() => expect(screen.getByTitle('Link')).toHaveClass('bg-accent'));

			await fireEvent.click(screen.getByTitle('Link'));
			expect(mockChain.unsetLink).toHaveBeenCalled();
			expect(mockChain.run).toHaveBeenCalled();
		});

		it('does not call setLink when Apply is clicked with an empty URL', async () => {
			render(RichTextEditor);
			await fireEvent.click(screen.getByTitle('Link'));
			await fireEvent.click(screen.getByText('Apply'));

			expect(mockChain.setLink).not.toHaveBeenCalled();
		});
	});

	// 7. Heading ──────────────────────────────────────────────────────────────

	describe('heading', () => {
		it('renders the heading select dropdown', () => {
			render(RichTextEditor);
			expect(screen.getByTitle('Heading')).toBeInTheDocument();
		});

		it('calls setHeading with level 1 when H1 is selected', async () => {
			render(RichTextEditor);
			await fireEvent.change(screen.getByTitle('Heading'), { target: { value: '1' } });
			expect(mockChain.setHeading).toHaveBeenCalledWith({ level: 1 });
			expect(mockChain.run).toHaveBeenCalled();
		});

		it('calls setParagraph when Normal (0) is selected', async () => {
			render(RichTextEditor);
			await fireEvent.change(screen.getByTitle('Heading'), { target: { value: '0' } });
			expect(mockChain.setParagraph).toHaveBeenCalled();
			expect(mockChain.run).toHaveBeenCalled();
		});

		it('reflects active heading level 2 in dropdown value via onTransaction', async () => {
			render(RichTextEditor);

			(mockEditorInstance.isActive as any).mockImplementation(
				(name: string, attrs?: { level?: number }) =>
					name === 'heading' && attrs?.level === 2
			);
			editorCallbacks.onTransaction?.({ editor: mockEditorInstance });

			await waitFor(() => {
				expect((screen.getByTitle('Heading') as HTMLSelectElement).value).toBe('2');
			});
		});
	});

	// 9. View source ──────────────────────────────────────────────────────────

	describe('view source', () => {
		it('renders the View source button', () => {
			render(RichTextEditor);
			expect(screen.getByTitle('View source')).toBeInTheDocument();
		});

		it('shows a pre element with raw HTML when View source is clicked', async () => {
			mockEditorInstance.getHTML.mockReturnValue('<p>Hello</p>');
			render(RichTextEditor, { value: '<p>Hello</p>' });

			await fireEvent.click(screen.getByTitle('View source'));

			const pre = document.querySelector('pre');
			expect(pre).toBeInTheDocument();
			expect(pre?.textContent).toBe('<p>Hello</p>');
		});

		it('shows empty string in pre when value is null', async () => {
			render(RichTextEditor, { value: null });

			await fireEvent.click(screen.getByTitle('View source'));

			expect(document.querySelector('pre')?.textContent).toBe('');
		});

		it('hides the pre element when View source is clicked again', async () => {
			render(RichTextEditor, { value: '<p>Hello</p>' });

			await fireEvent.click(screen.getByTitle('View source'));
			expect(document.querySelector('pre')).toBeInTheDocument();

			await fireEvent.click(screen.getByTitle('View source'));
			expect(document.querySelector('pre')).not.toBeInTheDocument();
		});
	});

	// 10. Cleanup ──────────────────────────────────────────────────────────────

	describe('cleanup', () => {
		it('destroys the editor instance when the component is unmounted', () => {
			const { unmount } = render(RichTextEditor);
			unmount();
			expect(mockEditorInstance.destroy).toHaveBeenCalled();
		});
	});
});
