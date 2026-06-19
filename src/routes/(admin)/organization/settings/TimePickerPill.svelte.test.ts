import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import TimePickerPill from './TimePickerPill.svelte';

describe('TimePickerPill', () => {
	describe('Display', () => {
		it('should show placeholder when value is null', () => {
			render(TimePickerPill, { value: null });
			expect(screen.getByText('Select time')).toBeInTheDocument();
		});

		it('should show custom placeholder', () => {
			render(TimePickerPill, { value: null, placeholder: 'Pick a time' });
			expect(screen.getByText('Pick a time')).toBeInTheDocument();
		});

		it('should display formatted AM time', () => {
			render(TimePickerPill, { value: '09:30' });
			expect(screen.getByText('09:30 AM')).toBeInTheDocument();
		});

		it('should display formatted PM time', () => {
			render(TimePickerPill, { value: '14:00' });
			expect(screen.getByText('02:00 PM')).toBeInTheDocument();
		});

		it('should display 12:00 PM for noon', () => {
			render(TimePickerPill, { value: '12:00' });
			expect(screen.getByText('12:00 PM')).toBeInTheDocument();
		});

		it('should display 12:00 AM for midnight', () => {
			render(TimePickerPill, { value: '00:00' });
			expect(screen.getByText('12:00 AM')).toBeInTheDocument();
		});
	});

	describe('Clear Button', () => {
		it('should show clear button when value is set', () => {
			render(TimePickerPill, { value: '09:00' });
			expect(screen.getByRole('button', { name: 'Clear time' })).toBeInTheDocument();
		});

		it('should not show clear button when value is null', () => {
			render(TimePickerPill, { value: null });
			expect(screen.queryByRole('button', { name: 'Clear time' })).not.toBeInTheDocument();
		});
	});

	describe('Trigger Button', () => {
		it('should render the trigger as type="button"', () => {
			const { container } = render(TimePickerPill, { value: null });
			const triggerBtn = container.querySelector('button[type="button"]');
			expect(triggerBtn).toBeInTheDocument();
		});
	});
});
