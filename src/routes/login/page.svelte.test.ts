import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import LoginPage from './+page.svelte';

vi.mock('$app/state', () => ({
	page: {
		data: { flash: null },
		url: new URL('http://localhost/login')
	}
}));

vi.mock('$app/paths', () => ({
	resolve: vi.fn((path: string) => path)
}));

vi.mock('sveltekit-flash-message', () => ({
	getFlash: () => ({
		subscribe: (fn: (v: unknown) => void) => {
			fn(undefined);
			return () => {};
		}
	})
}));

vi.mock('svelte-sonner', () => ({
	toast: { error: vi.fn(), success: vi.fn() }
}));

vi.mock('$lib/components/ui/sonner/index.js', () => ({
	Toaster: vi.fn(() => ({ $$set: vi.fn(), $destroy: vi.fn(), $on: vi.fn() }))
}));

const createPageData = (organizationData: { logo?: string; name?: string; shortcode?: string } | null = null) => ({
	loginForm: {
		id: 'loginForm',
		valid: false,
		posted: false,
		errors: {},
		data: {
			username: '',
			password: ''
		}
	},
	organizationData
});

describe('Login Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render the page', () => {
			const { container } = render(LoginPage, { data: createPageData() });
			expect(container).toBeInTheDocument();
		});

		it('should render card title "Login to Sashakt"', () => {
			render(LoginPage, { data: createPageData() });
			expect(screen.getByText('Login to Sashakt')).toBeInTheDocument();
		});

		it('should render card description', () => {
			render(LoginPage, { data: createPageData() });
			expect(
				screen.getByText('Please enter your email and password to login')
			).toBeInTheDocument();
		});

		it('should render the login form', () => {
			const { container } = render(LoginPage, { data: createPageData() });
			const form = container.querySelector('form');
			expect(form).toBeInTheDocument();
		});
	});

	describe('Branding', () => {
		it('should show SASHAKT heading when no organization logo', () => {
			render(LoginPage, { data: createPageData() });
			expect(screen.getByText('SASHAKT')).toBeInTheDocument();
		});

		it('should show SASHAKT heading when organizationData is null', () => {
			render(LoginPage, { data: createPageData(null) });
			expect(screen.getByText('SASHAKT')).toBeInTheDocument();
		});

		it('should show SASHAKT heading when organization has no logo', () => {
			render(LoginPage, { data: createPageData({ name: 'Acme', shortcode: 'acme' }) });
			expect(screen.getByText('SASHAKT')).toBeInTheDocument();
		});

		it('should show organization logo when logo is provided', () => {
			render(LoginPage, {
				data: createPageData({ logo: 'https://cdn.example.com/logo.png', name: 'Acme' })
			});
			const img = screen.getByAltText('Acme');
			expect(img).toBeInTheDocument();
			expect(img).toHaveAttribute('src', 'https://cdn.example.com/logo.png');
		});

		it('should not show SASHAKT heading when logo is provided', () => {
			render(LoginPage, {
				data: createPageData({ logo: 'https://cdn.example.com/logo.png', name: 'Acme' })
			});
			expect(screen.queryByText('SASHAKT')).not.toBeInTheDocument();
		});

		it('should set logo alt text to organization name', () => {
			render(LoginPage, {
				data: createPageData({ logo: 'https://cdn.example.com/logo.png', name: 'Tech4Dev' })
			});
			expect(screen.getByAltText('Tech4Dev')).toBeInTheDocument();
		});

		it('should show logo when organization has both shortcode and logo configured', () => {
			render(LoginPage, {
				data: createPageData({
					name: 'XYZ Org',
					logo: 'https://cdn.example.com/xyz-logo.png',
					shortcode: 'xyz'
				})
			});
			const img = screen.getByRole('img');
			expect(img).toBeInTheDocument();
			expect(img).toHaveAttribute('src', 'https://cdn.example.com/xyz-logo.png');
			expect(img).toHaveAttribute('alt', 'XYZ Org');
		});

		it('should not show SASHAKT heading when org has shortcode and logo configured', () => {
			render(LoginPage, {
				data: createPageData({
					name: 'XYZ Org',
					logo: 'https://cdn.example.com/xyz-logo.png',
					shortcode: 'xyz'
				})
			});
			expect(screen.queryByText('SASHAKT')).not.toBeInTheDocument();
		});

		it('should fall back to SASHAKT when org has shortcode but no logo', () => {
			render(LoginPage, {
				data: createPageData({ name: 'XYZ Org', logo: '', shortcode: 'xyz' })
			});
			expect(screen.getByText('SASHAKT')).toBeInTheDocument();
			expect(screen.queryByRole('img')).not.toBeInTheDocument();
		});
	});

	describe('Forgot Password Link', () => {
		it('should render "Forgot your password?" link', () => {
			render(LoginPage, { data: createPageData() });
			expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
		});

		it('should link to /forgot-password when no organization', () => {
			render(LoginPage, { data: createPageData() });
			const link = screen.getByText('Forgot your password?');
			expect(link).toHaveAttribute('href', '/forgot-password');
		});

		it('should include organization param when shortcode is present', () => {
			render(LoginPage, {
				data: createPageData({ logo: 'x', name: 'Acme', shortcode: 'acme' })
			});
			const link = screen.getByText('Forgot your password?');
			expect(link).toHaveAttribute('href', '/forgot-password?organization=acme');
		});
	});

	describe('Login Form Integration', () => {
		it('should render email and password inputs', () => {
			const { container } = render(LoginPage, { data: createPageData() });
			const inputs = container.querySelectorAll('input');
			expect(inputs.length).toBe(2);
		});

		it('should render the Login button', () => {
			render(LoginPage, { data: createPageData() });
			expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
		});

		it('should render email input with autocomplete', () => {
			const { container } = render(LoginPage, { data: createPageData() });
			expect(container.querySelector('input[autocomplete="email"]')).toBeInTheDocument();
		});

		it('should render password input', () => {
			const { container } = render(LoginPage, { data: createPageData() });
			expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
		});
	});
});
