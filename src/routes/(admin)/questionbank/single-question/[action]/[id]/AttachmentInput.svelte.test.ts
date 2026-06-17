import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AttachmentInput from './AttachmentInput.svelte';
import type { TMedia } from '$lib/types/media';

const toastErrorMock = vi.fn();
vi.mock('svelte-sonner', () => ({
	toast: { error: (...args: any[]) => toastErrorMock(...args) }
}));

function makeImageMedia(url = 'https://example.com/img.png'): TMedia {
	return {
		image: {
			gcs_path: 'bucket/img.png',
			url,
			alt_text: 'Test Image',
			content_type: 'image/png',
			size_bytes: 1024,
			uploaded_at: '2024-01-01T00:00:00Z'
		}
	};
}

function makeExternalMedia(url = 'https://example.com/video.mp4'): TMedia {
	return {
		external_media: { type: 'video', provider: 'generic', url, embed_url: null }
	};
}

function makeFile(name: string, type: string, sizeBytes = 1024): File {
	return new File([new Uint8Array(sizeBytes)], name, { type });
}

async function selectFile(container: HTMLElement, file: File) {
	const input = container.querySelector('input[type="file"]') as HTMLInputElement;
	Object.defineProperty(input, 'files', { value: [file], configurable: true });
	await fireEvent.change(input);
}

describe('AttachmentInput', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
		global.URL.revokeObjectURL = vi.fn();
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('initial render — no media, no mode', () => {
		it('renders a hidden file input', () => {
			const { container } = render(AttachmentInput, { props: { media: null } });
			const input = container.querySelector('input[type="file"]');
			expect(input).toBeInTheDocument();
			expect(input).not.toBeVisible();
		});

		it('shows "Add attachment" button when hideTrigger is false and no media', () => {
			render(AttachmentInput, { props: { media: null, hideTrigger: false } });
			expect(screen.getByRole('button', { name: /add attachment/i })).toBeInTheDocument();
		});

		it('does not show "Add attachment" button when hideTrigger is true', () => {
			render(AttachmentInput, { props: { media: null, hideTrigger: true } });
			expect(screen.queryByRole('button', { name: /add attachment/i })).not.toBeInTheDocument();
		});

		it('does not show dropdown initially', () => {
			render(AttachmentInput, { props: { media: null } });
			expect(screen.queryByRole('button', { name: /image/i })).not.toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('dropdown', () => {
		it('opens dropdown when "Add attachment" is clicked', async () => {
			render(AttachmentInput, { props: { media: null } });
			await fireEvent.click(screen.getByRole('button', { name: /add attachment/i }));
			expect(screen.getByRole('button', { name: /image/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /video/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /audio/i })).toBeInTheDocument();
		});

		it('closes dropdown when mouse leaves the dropdown panel', async () => {
			const { container } = render(AttachmentInput, { props: { media: null } });
			await fireEvent.click(screen.getByRole('button', { name: /add attachment/i }));
			const dropdown = container.querySelector('.bg-popover') as HTMLElement;
			await fireEvent.mouseLeave(dropdown);
			expect(screen.queryByRole('button', { name: /image/i })).not.toBeInTheDocument();
		});

		it('toggles dropdown closed on second click of "Add attachment"', async () => {
			render(AttachmentInput, { props: { media: null } });
			await fireEvent.click(screen.getByRole('button', { name: /add attachment/i }));
			await fireEvent.click(screen.getByRole('button', { name: /add attachment/i }));
			expect(screen.queryByRole('button', { name: /image/i })).not.toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('mode selection from dropdown', () => {
		async function openDropdown() {
			await fireEvent.click(screen.getByRole('button', { name: /add attachment/i }));
		}

		it('clicking Video shows video URL input and closes dropdown', async () => {
			render(AttachmentInput, { props: { media: null } });
			await openDropdown();
			await fireEvent.click(screen.getByRole('button', { name: /video/i }));
			expect(screen.getByPlaceholderText('Paste video URL')).toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /video/i })).not.toBeInTheDocument();
		});

		it('clicking Audio shows audio URL input and closes dropdown', async () => {
			render(AttachmentInput, { props: { media: null } });
			await openDropdown();
			await fireEvent.click(screen.getByRole('button', { name: /audio/i }));
			expect(screen.getByPlaceholderText('Paste audio URL')).toBeInTheDocument();
		});

		it('clicking Image closes dropdown and calls onModeChange with "image"', async () => {
			const onModeChange = vi.fn();
			render(AttachmentInput, { props: { media: null, onModeChange } });
			await openDropdown();
			await fireEvent.click(screen.getByRole('button', { name: /image/i }));
			expect(onModeChange).toHaveBeenCalledWith('image');
			expect(screen.queryByRole('button', { name: /image/i })).not.toBeInTheDocument();
		});

		it('clicking Video calls onModeChange with "video"', async () => {
			const onModeChange = vi.fn();
			render(AttachmentInput, { props: { media: null, onModeChange } });
			await openDropdown();
			await fireEvent.click(screen.getByRole('button', { name: /video/i }));
			expect(onModeChange).toHaveBeenCalledWith('video');
		});

		it('clicking Audio calls onModeChange with "audio"', async () => {
			const onModeChange = vi.fn();
			render(AttachmentInput, { props: { media: null, onModeChange } });
			await openDropdown();
			await fireEvent.click(screen.getByRole('button', { name: /audio/i }));
			expect(onModeChange).toHaveBeenCalledWith('audio');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('image mode — browse files zone', () => {
		it('shows "Browse files" zone when mode is "image" via hideTrigger', () => {
			render(AttachmentInput, { props: { media: null, hideTrigger: true, mode: 'image' } });
			expect(screen.getByText('Browse files')).toBeInTheDocument();
		});

		it('clicking X in browse zone calls onModeChange with "none"', async () => {
			const onModeChange = vi.fn();
			render(AttachmentInput, {
				props: { media: null, hideTrigger: true, mode: 'image', onModeChange }
			});
			// getAllByRole returns [browse-zone-div (role=button), inner X <button>]
			await fireEvent.click(screen.getAllByRole('button').at(-1)!);
			expect(onModeChange).toHaveBeenCalledWith('none');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('file selection', () => {
		it('shows staged file name and preview after valid file is selected', async () => {
			const { container } = render(AttachmentInput, { props: { media: null, hideTrigger: true, mode: 'image' } });
			await selectFile(container, makeFile('photo.png', 'image/png'));
			expect(screen.getByText('photo.png')).toBeInTheDocument();
			expect(screen.getByRole('img', { name: 'Preview' })).toBeInTheDocument();
		});

		it('calls onStagedFileChange with the file when a valid file is selected', async () => {
			const onStagedFileChange = vi.fn();
			const { container } = render(AttachmentInput, {
				props: { media: null, hideTrigger: true, mode: 'image', onStagedFileChange }
			});
			const file = makeFile('photo.png', 'image/png');
			await selectFile(container, file);
			expect(onStagedFileChange).toHaveBeenCalledWith(file);
		});

		it('creates an object URL for the preview', async () => {
			const { container } = render(AttachmentInput, { props: { media: null, hideTrigger: true, mode: 'image' } });
			await selectFile(container, makeFile('photo.png', 'image/png'));
			expect(URL.createObjectURL).toHaveBeenCalledOnce();
			const img = screen.getByRole('img', { name: 'Preview' });
			expect(img).toHaveAttribute('src', 'blob:mock-url');
		});

		it('shows toast error and does not call onStagedFileChange for oversized file', async () => {
			const onStagedFileChange = vi.fn();
			const { container } = render(AttachmentInput, {
				props: { media: null, hideTrigger: true, mode: 'image', onStagedFileChange }
			});
			const bigFile = makeFile('big.png', 'image/png', 6 * 1024 * 1024);
			await selectFile(container, bigFile);
			expect(toastErrorMock).toHaveBeenCalledWith(expect.stringContaining('File too large'));
			expect(onStagedFileChange).not.toHaveBeenCalled();
		});

		it('shows toast error and does not call onStagedFileChange for invalid file type', async () => {
			const onStagedFileChange = vi.fn();
			const { container } = render(AttachmentInput, {
				props: { media: null, hideTrigger: true, mode: 'image', onStagedFileChange }
			});
			await selectFile(container, makeFile('doc.pdf', 'application/pdf'));
			expect(toastErrorMock).toHaveBeenCalledWith(expect.stringContaining('Invalid file type'));
			expect(onStagedFileChange).not.toHaveBeenCalled();
		});

		it('accepts jpeg files as valid', async () => {
			const onStagedFileChange = vi.fn();
			const { container } = render(AttachmentInput, {
				props: { media: null, hideTrigger: true, mode: 'image', onStagedFileChange }
			});
			await selectFile(container, makeFile('photo.jpg', 'image/jpeg'));
			expect(onStagedFileChange).toHaveBeenCalled();
			expect(toastErrorMock).not.toHaveBeenCalled();
		});

		it('accepts webp files as valid', async () => {
			const onStagedFileChange = vi.fn();
			const { container } = render(AttachmentInput, {
				props: { media: null, hideTrigger: true, mode: 'image', onStagedFileChange }
			});
			await selectFile(container, makeFile('photo.webp', 'image/webp'));
			expect(onStagedFileChange).toHaveBeenCalled();
			expect(toastErrorMock).not.toHaveBeenCalled();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('clearing a staged file', () => {
		async function renderWithStagedFile() {
			const onStagedFileChange = vi.fn();
			const { container } = render(AttachmentInput, {
				props: { media: null, hideTrigger: true, mode: 'image', onStagedFileChange }
			});
			await selectFile(container, makeFile('photo.png', 'image/png'));
			return { container, onStagedFileChange };
		}

		it('removes the preview and filename after clearing', async () => {
			await renderWithStagedFile();
			await fireEvent.click(screen.getByRole('button'));
			expect(screen.queryByText('photo.png')).not.toBeInTheDocument();
			expect(screen.queryByRole('img', { name: 'Preview' })).not.toBeInTheDocument();
		});

		it('calls onStagedFileChange(null) when file is cleared', async () => {
			const { onStagedFileChange } = await renderWithStagedFile();
			await fireEvent.click(screen.getByRole('button'));
			expect(onStagedFileChange).toHaveBeenLastCalledWith(null);
		});

		it('revokes the object URL when file is cleared', async () => {
			await renderWithStagedFile();
			await fireEvent.click(screen.getByRole('button'));
			expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('video URL input', () => {
		it('shows video URL input when mode is "video"', () => {
			render(AttachmentInput, { props: { media: null, hideTrigger: true, mode: 'video' } });
			expect(screen.getByPlaceholderText('Paste video URL')).toBeInTheDocument();
		});

		it('calls onStagedUrlChange as the user types', async () => {
			const onStagedUrlChange = vi.fn();
			render(AttachmentInput, {
				props: { media: null, hideTrigger: true, mode: 'video', onStagedUrlChange }
			});
			const input = screen.getByPlaceholderText('Paste video URL');
			await fireEvent.input(input, { target: { value: 'https://example.com/video.mp4' } });
			expect(onStagedUrlChange).toHaveBeenCalledWith('https://example.com/video.mp4');
		});

		it('shows "Invalid URL" when the typed URL is not valid', async () => {
			render(AttachmentInput, { props: { media: null, hideTrigger: true, mode: 'video' } });
			const input = screen.getByPlaceholderText('Paste video URL');
			await fireEvent.input(input, { target: { value: 'not a url' } });
			expect(screen.getByText('Invalid URL')).toBeInTheDocument();
		});

		it('does not show "Invalid URL" for a valid https URL', async () => {
			render(AttachmentInput, { props: { media: null, hideTrigger: true, mode: 'video' } });
			const input = screen.getByPlaceholderText('Paste video URL');
			await fireEvent.input(input, { target: { value: 'https://example.com/video.mp4' } });
			expect(screen.queryByText('Invalid URL')).not.toBeInTheDocument();
		});

		it('does not show "Invalid URL" for a valid http URL', async () => {
			render(AttachmentInput, { props: { media: null, hideTrigger: true, mode: 'video' } });
			const input = screen.getByPlaceholderText('Paste video URL');
			await fireEvent.input(input, { target: { value: 'http://example.com/video.mp4' } });
			expect(screen.queryByText('Invalid URL')).not.toBeInTheDocument();
		});

		it('clears URL input and calls onStagedUrlChange("") when X is clicked', async () => {
			const onStagedUrlChange = vi.fn();
			render(AttachmentInput, {
				props: { media: null, hideTrigger: true, mode: 'video', onStagedUrlChange }
			});
			const input = screen.getByPlaceholderText('Paste video URL');
			await fireEvent.input(input, { target: { value: 'https://example.com' } });
			await fireEvent.click(screen.getByRole('button'));
			expect(onStagedUrlChange).toHaveBeenLastCalledWith('');
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('audio URL input', () => {
		it('shows audio URL input when mode is "audio"', () => {
			render(AttachmentInput, { props: { media: null, hideTrigger: true, mode: 'audio' } });
			expect(screen.getByPlaceholderText('Paste audio URL')).toBeInTheDocument();
		});

		it('calls onStagedUrlChange as the user types', async () => {
			const onStagedUrlChange = vi.fn();
			render(AttachmentInput, {
				props: { media: null, hideTrigger: true, mode: 'audio', onStagedUrlChange }
			});
			const input = screen.getByPlaceholderText('Paste audio URL');
			await fireEvent.input(input, { target: { value: 'https://example.com/audio.mp3' } });
			expect(onStagedUrlChange).toHaveBeenCalledWith('https://example.com/audio.mp3');
		});

		it('shows "Invalid URL" for invalid audio URL', async () => {
			render(AttachmentInput, { props: { media: null, hideTrigger: true, mode: 'audio' } });
			const input = screen.getByPlaceholderText('Paste audio URL');
			await fireEvent.input(input, { target: { value: 'bad input' } });
			expect(screen.getByText('Invalid URL')).toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('existing image media', () => {
		it('shows alt_text as the image label', () => {
			render(AttachmentInput, { props: { media: makeImageMedia() } });
			expect(screen.getByText('Test Image')).toBeInTheDocument();
		});

		it('falls back to content_type when alt_text is absent', () => {
			const media: TMedia = {
				image: { gcs_path: 'x', url: null, alt_text: null, content_type: 'image/jpeg', size_bytes: 1, uploaded_at: '' }
			};
			render(AttachmentInput, { props: { media } });
			expect(screen.getByText('image/jpeg')).toBeInTheDocument();
		});

		it('shows the image preview when url is present', () => {
			render(AttachmentInput, { props: { media: makeImageMedia('https://example.com/img.png') } });
			const img = screen.getByRole('img', { name: 'Test Image' });
			expect(img).toHaveAttribute('src', 'https://example.com/img.png');
		});

		it('does not show the image preview when url is absent', () => {
			const media: TMedia = {
				image: { gcs_path: 'x', url: null, alt_text: 'No URL', content_type: 'image/png', size_bytes: 1, uploaded_at: '' }
			};
			render(AttachmentInput, { props: { media } });
			expect(screen.queryByRole('img')).not.toBeInTheDocument();
		});

		it('shows delete button when onDeleteImage is provided', () => {
			render(AttachmentInput, { props: { media: makeImageMedia(), onDeleteImage: vi.fn() } });
			expect(screen.getByRole('button')).toBeInTheDocument();
		});

		it('does not show delete button when onDeleteImage is not provided', () => {
			render(AttachmentInput, { props: { media: makeImageMedia() } });
			expect(screen.queryByRole('button')).not.toBeInTheDocument();
		});

		it('calls onDeleteImage when delete button is clicked', async () => {
			const onDeleteImage = vi.fn().mockResolvedValue(undefined);
			render(AttachmentInput, { props: { media: makeImageMedia(), onDeleteImage } });
			await fireEvent.click(screen.getByRole('button'));
			expect(onDeleteImage).toHaveBeenCalledOnce();
		});

		it('does not show "Add attachment" button when image media exists', () => {
			render(AttachmentInput, { props: { media: makeImageMedia() } });
			expect(screen.queryByRole('button', { name: /add attachment/i })).not.toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('existing external media', () => {
		it('shows the external media URL', () => {
			render(AttachmentInput, { props: { media: makeExternalMedia('https://example.com/video.mp4') } });
			expect(screen.getByText('https://example.com/video.mp4')).toBeInTheDocument();
		});

		it('shows delete button when onDeleteExternal is provided', () => {
			render(AttachmentInput, { props: { media: makeExternalMedia(), onDeleteExternal: vi.fn() } });
			expect(screen.getByRole('button')).toBeInTheDocument();
		});

		it('does not show delete button when onDeleteExternal is not provided', () => {
			render(AttachmentInput, { props: { media: makeExternalMedia() } });
			expect(screen.queryByRole('button')).not.toBeInTheDocument();
		});

		it('calls onDeleteExternal when delete button is clicked', async () => {
			const onDeleteExternal = vi.fn().mockResolvedValue(undefined);
			render(AttachmentInput, { props: { media: makeExternalMedia(), onDeleteExternal } });
			await fireEvent.click(screen.getByRole('button'));
			expect(onDeleteExternal).toHaveBeenCalledOnce();
		});

		it('does not show "Add attachment" button when external media exists', () => {
			render(AttachmentInput, { props: { media: makeExternalMedia() } });
			expect(screen.queryByRole('button', { name: /add attachment/i })).not.toBeInTheDocument();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('delete loading states', () => {
		it('disables delete button while image deletion is in progress', async () => {
			let resolveDelete!: () => void;
			const onDeleteImage = vi.fn(
				() => new Promise<void>((res) => { resolveDelete = res; })
			);
			render(AttachmentInput, { props: { media: makeImageMedia(), onDeleteImage } });
			await fireEvent.click(screen.getByRole('button'));
			await waitFor(() => {
				expect(screen.getByRole('button')).toBeDisabled();
			});
			resolveDelete();
		});

		it('disables delete button while external media deletion is in progress', async () => {
			let resolveDelete!: () => void;
			const onDeleteExternal = vi.fn(
				() => new Promise<void>((res) => { resolveDelete = res; })
			);
			render(AttachmentInput, { props: { media: makeExternalMedia(), onDeleteExternal } });
			await fireEvent.click(screen.getByRole('button'));
			await waitFor(() => {
				expect(screen.getByRole('button')).toBeDisabled();
			});
			resolveDelete();
		});
	});

	// ─────────────────────────────────────────────────────────────────────────
	describe('"Add attachment" visibility rules', () => {
		it('hides "Add attachment" when hideTrigger is true', () => {
			render(AttachmentInput, { props: { media: null, hideTrigger: true } });
			expect(screen.queryByRole('button', { name: /add attachment/i })).not.toBeInTheDocument();
		});

		it('hides "Add attachment" when video mode is active', async () => {
			render(AttachmentInput, { props: { media: null } });
			await fireEvent.click(screen.getByRole('button', { name: /add attachment/i }));
			await fireEvent.click(screen.getByRole('button', { name: /video/i }));
			expect(screen.queryByRole('button', { name: /add attachment/i })).not.toBeInTheDocument();
		});

		it('hides "Add attachment" after a file is staged', async () => {
			const { container } = render(AttachmentInput, {
				props: { media: null, hideTrigger: true, mode: 'image' }
			});
			await selectFile(container, makeFile('photo.png', 'image/png'));
			expect(screen.queryByRole('button', { name: /add attachment/i })).not.toBeInTheDocument();
		});
	});
});
