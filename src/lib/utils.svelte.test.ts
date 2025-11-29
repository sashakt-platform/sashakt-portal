import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock the QR code library
vi.mock('@svelte-put/qr', () => ({
	createQrPngDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,mockedQRCodeData')
}));

import { formatDate, downloadQRCode } from './utils';
import { createQrPngDataUrl } from '@svelte-put/qr';

describe('utils', () => {
	describe('formatDate()', () => {
		it('should format date string correctly', () => {
			const dateString = '2025-01-15T15:45:00Z';
			const formatted = formatDate(dateString);

			// The output will vary based on timezone
			// so we just check it's a string with expected parts
			expect(formatted).toContain('Jan');
			expect(formatted).toContain('15');
		});

		it('should format ISO date string', () => {
			const dateString = '2025-03-20T10:30:00.000Z';
			const formatted = formatDate(dateString);

			expect(typeof formatted).toBe('string');
			expect(formatted.length).toBeGreaterThan(0);
		});

		it('should handle different date formats', () => {
			const dateString = '2024-12-25T00:00:00Z';
			const formatted = formatDate(dateString);

			expect(formatted).toContain('Dec');
			expect(formatted).toContain('25');
		});
	});

	describe('downloadQRCode()', () => {
		let createElementSpy: ReturnType<typeof vi.spyOn>;
		let appendChildSpy: ReturnType<typeof vi.fn>;
		let removeChildSpy: ReturnType<typeof vi.fn>;
		let clickSpy: ReturnType<typeof vi.fn>;
		let mockAnchor: any;

		beforeEach(() => {
			// Reset the mock
			vi.mocked(createQrPngDataUrl).mockResolvedValue('data:image/png;base64,mockedQRCodeData');

			// Mock document.createElement for anchor element
			clickSpy = vi.fn();
			mockAnchor = {
				href: '',
				download: '',
				click: clickSpy
			};

			createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
			appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor);
			removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor);
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it('should create and download QR code with default filename', async () => {
			const url = 'https://example.com';

			await downloadQRCode(url);

			expect(createQrPngDataUrl).toHaveBeenCalledWith({
				data: url,
				width: 256,
				height: 256,
				margin: 4,
				backgroundFill: '#fff'
			});
			expect(createElementSpy).toHaveBeenCalledWith('a');
			expect(mockAnchor.href).toContain('data:image/png;base64');
			expect(mockAnchor.download).toBe('qr-code.png');
			expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
			expect(clickSpy).toHaveBeenCalled();
			expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
		});

		it('should create and download QR code with custom filename', async () => {
			const url = 'https://example.com/test';
			const filename = 'my-custom-qr';

			await downloadQRCode(url, filename);

			expect(mockAnchor.download).toBe('my-custom-qr.png');
			expect(clickSpy).toHaveBeenCalled();
		});

		it('should handle errors gracefully', async () => {
			// Mock createQrPngDataUrl to throw an error
			vi.mocked(createQrPngDataUrl).mockRejectedValue(new Error('QR generation failed'));

			const url = 'https://example.com';

			await expect(downloadQRCode(url)).rejects.toThrow('QR generation failed');
		});
	});
});
