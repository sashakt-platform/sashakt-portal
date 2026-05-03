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
		toggleBulletList: vi.fn().mockReturnThis(),
		toggleOrderedList: vi.fn().mockReturnThis(),
		setColor: vi.fn().mockReturnThis(),
		setHighlight: vi.fn().mockReturnThis(),
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
		mockChain.toggleBulletList.mockReturnThis();
		mockChain.toggleOrderedList.mockReturnThis();
		mockChain.setColor.mockReturnThis();
		mockChain.setHighlight.mockReturnThis();
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

		it('renders the Ordered List toolbar button', () => {
			render(RichTextEditor);
			expect(screen.getByTitle('Ordered List')).toBeInTheDocument();
		});

		it('renders two color picker inputs (text color and highlight)', () => {
			const { container } = render(RichTextEditor);
			expect(container.querySelectorAll('input[type="color"]')).toHaveLength(2);
		});

		it('renders the Text Color label', () => {
			render(RichTextEditor);
			expect(screen.getByTitle('Text Color')).toBeInTheDocument();
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

	// 6. Cleanup ───────────────────────────────────────────────────────────────

	describe('cleanup', () => {
		it('destroys the editor instance when the component is unmounted', () => {
			const { unmount } = render(RichTextEditor);
			unmount();
			expect(mockEditorInstance.destroy).toHaveBeenCalled();
		});
	});
});
