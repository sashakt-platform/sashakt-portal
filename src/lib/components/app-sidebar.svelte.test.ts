import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import AppSidebar from './app-sidebar.svelte';

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$lib/utils/permissions.js', () => ({
	canRead: vi.fn(() => false),
	hasPermission: vi.fn(() => false),
	PERMISSIONS: {}
}));

vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
	useSidebar: vi.fn(() => ({
		isMobile: false,
		setOpenMobile: vi.fn()
	}))
}));

const baseData = {
	user: { id: 1, permissions: [] },
	organization: null
};

describe('AppSidebar - Organization Branding', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show "Sashakt" fallback when no organization is set', () => {
		render(AppSidebar, { data: { ...baseData, organization: null } });

		expect(screen.getByText('Sashakt')).toBeInTheDocument();
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});

	it('should show org name when organization has no logo', () => {
		render(AppSidebar, {
			data: {
				...baseData,
				organization: { name: 'Acme Corp', logo: '', shortcode: 'acme' }
			}
		});

		expect(screen.getByText('Acme Corp')).toBeInTheDocument();
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});

	it('should show logo when organization has a logo', () => {
		render(AppSidebar, {
			data: {
				...baseData,
				organization: {
					name: 'Acme Corp',
					logo: 'https://example.com/logo.png',
					shortcode: 'acme'
				}
			}
		});

		const img = screen.getByRole('img');
		expect(img).toHaveAttribute('src', 'https://example.com/logo.png');
		expect(img).toHaveAttribute('alt', 'Acme Corp');
	});

	it('should show both logo and org name when organization has a logo', () => {
		render(AppSidebar, {
			data: {
				...baseData,
				organization: {
					name: 'Acme Corp',
					logo: 'https://example.com/logo.png',
					shortcode: 'acme'
				}
			}
		});

		expect(screen.getByRole('img')).toBeInTheDocument();
		expect(screen.getByText('Acme Corp')).toBeInTheDocument();
	});
});
