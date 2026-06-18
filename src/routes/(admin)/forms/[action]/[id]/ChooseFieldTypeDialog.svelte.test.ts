/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ChooseFieldTypeDialog from './ChooseFieldTypeDialog.svelte';

describe('ChooseFieldTypeDialog Component', () => {
	let onSelect: any;
	let onClose: any;

	beforeEach(() => {
		vi.clearAllMocks();
		onSelect = vi.fn();
		onClose = vi.fn();
	});

	it('renders correctly when open is true', () => {
		render(ChooseFieldTypeDialog, {
			open: true,
			onSelect,
			onClose
		});

		expect(screen.getByText('Choose Field Type')).toBeInTheDocument();
		expect(screen.getByText('Commonly Used')).toBeInTheDocument();
		expect(screen.getByText('General')).toBeInTheDocument();
		expect(screen.getByText('Choice List')).toBeInTheDocument();
	});

	it('does not render content when open is false', () => {
		render(ChooseFieldTypeDialog, {
			open: false,
			onSelect,
			onClose
		});

		expect(screen.queryByText('Choose Field Type')).not.toBeInTheDocument();
	});

	it('triggers onSelect with correct type when a field type option is clicked', async () => {
		render(ChooseFieldTypeDialog, {
			open: true,
			onSelect,
			onClose
		});

		const textButton = screen.getByRole('button', { name: 'Short Text' });
		await fireEvent.click(textButton);

		expect(onSelect).toHaveBeenCalledWith('text');
	});
	it('calls onClose when dialog closes', async () => {
		render(ChooseFieldTypeDialog, {
			open: true,
			onSelect,
			onClose
		});

		const closeButton = screen.getByRole('button', { name: /close/i });
		await fireEvent.click(closeButton);

		expect(onClose).toHaveBeenCalled();
	});
});
