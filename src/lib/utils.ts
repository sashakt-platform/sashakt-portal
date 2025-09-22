import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createQrPngDataUrl } from '@svelte-put/qr';
import { page } from '$app/state';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Formats a date string to a human-readable format
 *
 * @param dateString - The date string to format
 *
 * @returns Formatted date string (e.g., "Jan 15, 25, 3:45 PM")
 */
export const formatDate = (dateString: string): string => {
	return new Date(dateString).toLocaleDateString('en-US', {
		year: '2-digit',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric'
	});
};

/**
 * Generates QR code and downloads it as a PNG image
 *
 * @param url - The URL to encode in the QR code
 * @param filename - The filename for the downloaded image
 */
export const downloadQRCode = async (url: string, filename: string = 'qr-code'): Promise<void> => {
	try {
		// generates QR code as PNG data URL
		const pngDataUrl = await createQrPngDataUrl({
			data: url,
			width: 256,
			height: 256,
			margin: 4,
			backgroundFill: '#fff'
		});

		// create download link and trigger download
		const a = document.createElement('a');
		a.href = pngDataUrl;
		a.download = `${filename}.png`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	} catch (error) {
		console.error('Failed to generate QR code:', error);
		throw error;
	}
};

export const hasPermission = (...permissions: string[]): boolean => {
	const userPermissions = page.data.user.permissions || '[]';
	return permissions.some((permission) => userPermissions.includes(permission));
};
