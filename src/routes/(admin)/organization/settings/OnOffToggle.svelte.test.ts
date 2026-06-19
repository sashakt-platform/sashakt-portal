import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import OnOffToggle from './OnOffToggle.svelte';

describe('OnOffToggle', () => {
	it('should render On and Off buttons', () => {
		render(OnOffToggle, { value: false });
		expect(screen.getByRole('button', { name: 'On' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Off' })).toBeInTheDocument();
	});

	it('should highlight On button when value is true', () => {
		render(OnOffToggle, { value: true });
		const onBtn = screen.getByRole('button', { name: 'On' });
		expect(onBtn.className).toContain('font-semibold');
	});

	it('should highlight Off button when value is false', () => {
		render(OnOffToggle, { value: false });
		const offBtn = screen.getByRole('button', { name: 'Off' });
		expect(offBtn.className).toContain('font-semibold');
	});

	it('should not highlight On button when value is false', () => {
		render(OnOffToggle, { value: false });
		const onBtn = screen.getByRole('button', { name: 'On' });
		expect(onBtn.className).not.toContain('shadow-sm');
	});

	it('should set both buttons as type="button"', () => {
		render(OnOffToggle, { value: false });
		expect(screen.getByRole('button', { name: 'On' })).toHaveAttribute('type', 'button');
		expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('type', 'button');
	});
});
