import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

const createPageData = (overrides: { organizationData?: any; message?: string } = {}) => ({
	form: {
		id: 'forgotPasswordForm',
		valid: false,
		posted: false,
		errors: {},
		data: { email: '' },
		...(overrides.message ? { message: overrides.message } : {})
	},
	organizationData: overrides.organizationData ?? null
});

describe('Forgot Password Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render the page', () => {
			const { container } = render(Page, { data: createPageData() });
			expect(container).toBeTruthy();
		});

		it('should render the Forgot Password title', () => {
			render(Page, { data: createPageData() });
			expect(screen.getByText('Forgot Password')).toBeInTheDocument();
		});

		it('should render the description text', () => {
			render(Page, { data: createPageData() });
			expect(screen.getByText('Please enter your registered email.')).toBeInTheDocument();
		});

		it('should render the Continue button', () => {
			render(Page, { data: createPageData() });
			expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
		});

		it('should render the Email label', () => {
			render(Page, { data: createPageData() });
			expect(screen.getByText('Email')).toBeInTheDocument();
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
		it('should render SASHAKT heading when no organization', () => {
			render(Page, { data: createPageData() });
			const heading = screen.getByText('SASHAKT');
			expect(heading.tagName).toBe('H1');
			expect(heading).toHaveClass('font-extrabold');
		});

		it('should render organization logo when organizationData has logo', () => {
			const { container } = render(Page, {
				data: createPageData({
					organizationData: { logo: 'https://example.com/logo.png', name: 'Acme Org', shortcode: 'acme' }
				})
			});
			const img = container.querySelector('img') as HTMLImageElement;
			expect(img).toBeInTheDocument();
			expect(img.src).toBe('https://example.com/logo.png');
			expect(img.alt).toBe('Acme Org');
		});

		it('should not render SASHAKT heading when organization logo exists', () => {
			render(Page, {
				data: createPageData({
					organizationData: { logo: 'https://example.com/logo.png', name: 'Acme Org', shortcode: 'acme' }
				})
			});
			expect(screen.queryByText('SASHAKT')).not.toBeInTheDocument();
		});
	});

	describe('Card Structure', () => {
		it('should render a card with shadow', () => {
			const { container } = render(Page, { data: createPageData() });
			const card = container.querySelector('.shadow-xl');
			expect(card).toBeInTheDocument();
		});
	});

	describe('Form', () => {
		it('should have a form with POST method', () => {
			const { container } = render(Page, { data: createPageData() });
			const form = container.querySelector('form');
			expect(form).toHaveAttribute('method', 'POST');
		});

		it('should have an email input', () => {
			const { container } = render(Page, { data: createPageData() });
			const input = container.querySelector('input[type="email"]');
			expect(input).toBeInTheDocument();
		});

		it('should have autocomplete email on the input', () => {
			const { container } = render(Page, { data: createPageData() });
			const input = container.querySelector('input[type="email"]');
			expect(input).toHaveAttribute('autocomplete', 'email');
		});

		it('should render Continue as a submit button', () => {
			render(Page, { data: createPageData() });
			const button = screen.getByRole('button', { name: 'Continue' });
			expect(button).toHaveAttribute('type', 'submit');
		});
	});

	describe('Back to Login Link', () => {
		it('should render a Back to Login link', () => {
			render(Page, { data: createPageData() });
			const link = screen.getByRole('link', { name: 'Back to Login' });
			expect(link).toBeInTheDocument();
		});

		it('should link to /login when no organization', () => {
			render(Page, { data: createPageData() });
			const link = screen.getByRole('link', { name: 'Back to Login' });
			expect(link).toHaveAttribute('href', '/login');
		});

		it('should link to /login with organization param when organization exists', () => {
			render(Page, {
				data: createPageData({
					organizationData: { logo: 'https://example.com/logo.png', name: 'Acme', shortcode: 'acme' }
				})
			});
			const link = screen.getByRole('link', { name: 'Back to Login' });
			expect(link).toHaveAttribute('href', '/login?organization=acme');
		});
	});
});
