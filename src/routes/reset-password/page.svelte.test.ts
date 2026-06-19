import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

const createPageData = (
	overrides: { password?: string; confirm_password?: string; token?: string } = {}
) => ({
	form: {
		id: 'updatePasswordForm',
		valid: false,
		posted: false,
		errors: {},
		data: {
			password: '',
			confirm_password: '',
			token: 'test-reset-token',
			...overrides
		}
	}
});

describe('Reset Password Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render the page', () => {
			const { container } = render(Page, { data: createPageData() });
			expect(container).toBeTruthy();
		});

		it('should render the SASHAKT heading', () => {
			render(Page, { data: createPageData() });
			expect(screen.getByText('SASHAKT')).toBeInTheDocument();
		});

		it('should render the Update Password title', () => {
			render(Page, { data: createPageData() });
			expect(screen.getByText('Update Password')).toBeInTheDocument();
		});

		it('should render the description text', () => {
			render(Page, { data: createPageData() });
			expect(screen.getByText('Enter your new password below.')).toBeInTheDocument();
		});
	});

	describe('Layout', () => {
		it('should have a full-screen centered layout', () => {
			const { container } = render(Page, { data: createPageData() });
			const outerDiv = container.firstElementChild as HTMLElement;
			expect(outerDiv).toHaveClass('h-screen');
			expect(outerDiv).toHaveClass('flex');
			expect(outerDiv).toHaveClass('items-center');
			expect(outerDiv).toHaveClass('justify-center');
		});

		it('should have a max-width container', () => {
			const { container } = render(Page, { data: createPageData() });
			const wrapper = container.querySelector('.max-w-md');
			expect(wrapper).toBeInTheDocument();
		});
	});

	describe('Branding', () => {
		it('should render SASHAKT as an h1 element', () => {
			render(Page, { data: createPageData() });
			const heading = screen.getByText('SASHAKT');
			expect(heading.tagName).toBe('H1');
		});

		it('should have bold styling on the heading', () => {
			render(Page, { data: createPageData() });
			const heading = screen.getByText('SASHAKT');
			expect(heading).toHaveClass('font-extrabold');
		});
	});

	describe('Card Structure', () => {
		it('should render a card with shadow', () => {
			const { container } = render(Page, { data: createPageData() });
			const card = container.querySelector('.shadow-xl');
			expect(card).toBeInTheDocument();
		});

		it('should render the card title as a heading', () => {
			render(Page, { data: createPageData() });
			const title = screen.getByText('Update Password');
			expect(title).toBeInTheDocument();
		});

		it('should render the card description', () => {
			render(Page, { data: createPageData() });
			const description = screen.getByText('Enter your new password below.');
			expect(description).toBeInTheDocument();
		});
	});

	describe('UpdatePassword Component Integration', () => {
		it('should render the Update button from UpdatePassword component', () => {
			render(Page, { data: createPageData() });
			expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
		});

		it('should render password input fields', () => {
			const { container } = render(Page, { data: createPageData() });
			const passwordInputs = container.querySelectorAll('input[type="password"]');
			expect(passwordInputs.length).toBe(2);
		});

		it('should render the form with POST method', () => {
			const { container } = render(Page, { data: createPageData() });
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
		});

		it('should pass token to the hidden input', () => {
			const { container } = render(Page, {
				data: createPageData({ token: 'my-token-123' })
			});
			const hiddenInput = container.querySelector(
				'input[type="hidden"][name="token"]'
			) as HTMLInputElement;
			expect(hiddenInput.value).toBe('my-token-123');
		});

		it('should render the New Password label', () => {
			render(Page, { data: createPageData() });
			expect(screen.getByText('New Password')).toBeInTheDocument();
		});

		it('should render the Confirm Password label', () => {
			render(Page, { data: createPageData() });
			expect(screen.getByText('Confirm Password')).toBeInTheDocument();
		});
	});
});
