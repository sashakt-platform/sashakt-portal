import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createQrPngDataUrl } from '@svelte-put/qr';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Utility types for shadcn-svelte components
export type WithElementRef<T extends Record<string, any>> = T & {
	ref?: HTMLElement | null;
};

export type WithoutChild<T> = Omit<T, 'child'>;

export type WithoutChildren<T> = Omit<T, 'children'>;

export type WithoutChildrenOrChild<T> = Omit<T, 'children' | 'child'>;

/**
 * Formats a date string to a human-readable format
 *
 * @param dateString - The date string to format
 *
 * @returns Formatted date string (e.g., "Jan 15, 25, 3:45 PM")
 */
export const formatDatePart = (dateString: string): string => {
	return new Date(dateString).toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
};

export const formatTimePart = (dateString: string): string => {
	return new Date(dateString).toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	});
};

export const formatDate = (dateString: string): string => {
	return `${formatDatePart(dateString)} ${formatTimePart(dateString)}`;
};

/**
 * Generates QR code and downloads it as a PNG image, optionally with a
 * labelled footer (e.g. test name, district) rendered below the QR.
 *
 * @param url - The URL to encode in the QR code
 * @param filename - The filename for the downloaded image
 * @param footerLines - Optional `{ label, value }` pairs shown as
 *   "Label: Value" lines beneath the QR
 */
export const downloadQRCode = async (
	url: string,
	filename: string = 'qr-code',
	footerLines?: Array<{ label: string; value: string }>
): Promise<void> => {
	try {
		const pngDataUrl = await createQrPngDataUrl({
			data: url,
			width: 256,
			height: 256,
			margin: 4,
			backgroundFill: '#fff'
		});

		const visibleLines = (footerLines ?? []).filter((l) => l.value);
		const finalDataUrl = visibleLines.length
			? await composeQrWithFooter(pngDataUrl, visibleLines)
			: pngDataUrl;

		const a = document.createElement('a');
		a.href = finalDataUrl;
		a.download = `${filename}.png`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	} catch (error) {
		console.error('Failed to generate QR code:', error);
		throw error;
	}
};

const composeQrWithFooter = async (
	qrDataUrl: string,
	lines: Array<{ label: string; value: string }>
): Promise<string> => {
	const qrSize = 256;
	const canvasWidth = 360;
	const sidePadding = 16;
	const qrOffsetX = (canvasWidth - qrSize) / 2;
	const fontSize = 14;
	const lineHeight = 20;
	const footerTopPadding = 12;
	const footerBottomPadding = 16;
	const maxLinesPerEntry = 2;
	const fontStack = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

	const qrImage = await loadImage(qrDataUrl);

	// First pass: measure with an offscreen context to determine total footer height.
	const measureCanvas = document.createElement('canvas');
	const measureCtx = measureCanvas.getContext('2d');
	if (!measureCtx) throw new Error('Canvas 2D context unavailable');
	measureCtx.font = `${fontSize}px ${fontStack}`;

	const wrappedLines: string[][] = lines.map(({ label, value }) =>
		wrapText(measureCtx, `${label}: ${value}`, canvasWidth - sidePadding * 2, maxLinesPerEntry)
	);
	const totalTextLines = wrappedLines.reduce((sum, l) => sum + l.length, 0);
	const footerHeight = footerTopPadding + totalTextLines * lineHeight + footerBottomPadding;

	const canvas = document.createElement('canvas');
	canvas.width = canvasWidth;
	canvas.height = qrSize + footerHeight;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2D context unavailable');

	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(qrImage, qrOffsetX, 0, qrSize, qrSize);

	ctx.fillStyle = '#000';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	ctx.font = `${fontSize}px ${fontStack}`;

	let y = qrSize + footerTopPadding;
	for (const entryLines of wrappedLines) {
		for (const line of entryLines) {
			ctx.fillText(line, canvasWidth / 2, y);
			y += lineHeight;
		}
	}

	return canvas.toDataURL('image/png');
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});

const wrapText = (
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
	maxLines: number
): string[] => {
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let current = '';

	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word;
		if (ctx.measureText(candidate).width <= maxWidth) {
			current = candidate;
		} else {
			if (current) lines.push(current);
			current = word;
			if (lines.length === maxLines - 1) break;
		}
	}
	if (current && lines.length < maxLines) lines.push(current);

	// If we ran out of room, truncate the last line with ellipsis.
	if (lines.length === maxLines) {
		const remainingIndex = words.indexOf(lines[lines.length - 1].split(' ').pop() ?? '');
		const hasOverflow = remainingIndex >= 0 && remainingIndex < words.length - 1;
		if (hasOverflow) {
			let last = lines[lines.length - 1];
			while (last.length > 0 && ctx.measureText(`${last}…`).width > maxWidth) {
				last = last.slice(0, -1);
			}
			lines[lines.length - 1] = `${last}…`;
		}
	}

	return lines.length ? lines : [text];
};
