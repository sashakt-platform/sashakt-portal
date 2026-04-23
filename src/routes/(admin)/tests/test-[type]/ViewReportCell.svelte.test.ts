import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ViewReportCell from './ViewReportCell.svelte';

describe('ViewReportCell', () => {
	it('renders a button with the label "View Report"', () => {
		render(ViewReportCell, { props: { onClick: vi.fn() } });
		expect(screen.getByRole('button', { name: 'View Report' })).toBeInTheDocument();
	});

	it('calls onClick exactly once when the button is clicked', async () => {
		const onClick = vi.fn();
		render(ViewReportCell, { props: { onClick } });

		await fireEvent.click(screen.getByRole('button', { name: 'View Report' }));

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('does not call onClick before any interaction', () => {
		const onClick = vi.fn();
		render(ViewReportCell, { props: { onClick } });

		expect(onClick).not.toHaveBeenCalled();
	});

	it('calls onClick again on a second click', async () => {
		const onClick = vi.fn();
		render(ViewReportCell, { props: { onClick } });
		const button = screen.getByRole('button', { name: 'View Report' });

		await fireEvent.click(button);
		await fireEvent.click(button);

		expect(onClick).toHaveBeenCalledTimes(2);
	});
});
