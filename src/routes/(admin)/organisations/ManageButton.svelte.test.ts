import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import ManageButton from './ManageButton.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

describe('ManageButton', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render a Manage button', () => {
			render(ManageButton, { props: { id: 1 } });

			expect(screen.getByRole('button', { name: /manage/i })).toBeInTheDocument();
		});

		it('should render an anchor tag', () => {
			const { container } = render(ManageButton, { props: { id: 1 } });

			expect(container.querySelector('a')).toBeInTheDocument();
		});

		it('should display "Manage" as button text', () => {
			render(ManageButton, { props: { id: 1 } });

			expect(screen.getByText('Manage')).toBeInTheDocument();
		});
	});

	describe('Link href', () => {
		it('should generate correct href for a given id', () => {
			const { container } = render(ManageButton, { props: { id: 42 } });

			const anchor = container.querySelector('a');
			expect(anchor).toHaveAttribute('href', '/organisations/edit/42');
		});

		it('should use the id prop in the URL', () => {
			const { container } = render(ManageButton, { props: { id: 99 } });

			const anchor = container.querySelector('a');
			expect(anchor).toHaveAttribute('href', '/organisations/edit/99');
		});

		it('should generate different hrefs for different ids', () => {
			const { container: container1 } = render(ManageButton, { props: { id: 1 } });
			const { container: container2 } = render(ManageButton, { props: { id: 2 } });

			expect(container1.querySelector('a')).toHaveAttribute('href', '/organisations/edit/1');
			expect(container2.querySelector('a')).toHaveAttribute('href', '/organisations/edit/2');
		});

		it('should handle id of 0', () => {
			const { container } = render(ManageButton, { props: { id: 0 } });

			const anchor = container.querySelector('a');
			expect(anchor).toHaveAttribute('href', '/organisations/edit/0');
		});
	});

	describe('Button styling', () => {
		it('should render button with outline variant classes', () => {
			const { container } = render(ManageButton, { props: { id: 1 } });

			const button = container.querySelector('button');
			expect(button).toHaveClass('border');
		});

		it('should render the chevron icon inside the button', () => {
			const { container } = render(ManageButton, { props: { id: 1 } });

			const svg = container.querySelector('button svg');
			expect(svg).toBeInTheDocument();
		});
	});
});
