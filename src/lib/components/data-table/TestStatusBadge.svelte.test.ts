import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import TestStatusBadge from './TestStatusBadge.svelte';
import type { TestStatus } from '$lib/types/test.js';

describe('TestStatusBadge', () => {
	describe('Rendering', () => {
		it('should render nothing when status is null', () => {
			const { container } = render(TestStatusBadge, { props: { status: null } });
			expect(container.querySelector('span')).not.toBeInTheDocument();
		});

		it('should render "In Progress" status text', () => {
			render(TestStatusBadge, { props: { status: 'In Progress' } });
			expect(screen.getByText('In Progress')).toBeInTheDocument();
		});

		it('should render "Completed" status text', () => {
			render(TestStatusBadge, { props: { status: 'Completed' } });
			expect(screen.getByText('Completed')).toBeInTheDocument();
		});

		it('should render "Scheduled" status text', () => {
			render(TestStatusBadge, { props: { status: 'Scheduled' } });
			expect(screen.getByText('Scheduled')).toBeInTheDocument();
		});
	});

	describe('Styling', () => {
		const cases: { status: TestStatus; bg: string; text: string }[] = [
			{ status: 'In Progress', bg: 'bg-warning-subtle', text: 'text-warning' },
			{ status: 'Completed', bg: 'bg-success-subtle', text: 'text-success' },
			{ status: 'Scheduled', bg: 'bg-muted', text: 'text-muted-foreground' }
		];

		for (const { status, bg, text } of cases) {
			it(`should apply correct classes for "${status}"`, () => {
				render(TestStatusBadge, { props: { status } });
				const span = screen.getByText(status).closest('span');
				expect(span).toHaveClass(bg);
				expect(span).toHaveClass(text);
			});
		}
	});

	describe('Icon', () => {
		it('should render an svg icon for each status', () => {
			const statuses: TestStatus[] = ['In Progress', 'Completed', 'Scheduled'];
			for (const status of statuses) {
				const { container, unmount } = render(TestStatusBadge, { props: { status } });
				expect(container.querySelector('svg')).toBeInTheDocument();
				unmount();
			}
		});
	});
});
