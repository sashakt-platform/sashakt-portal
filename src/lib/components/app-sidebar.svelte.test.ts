import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import AppSidebar from './app-sidebar.svelte';
import { setCustomNomenclature, resetNomenclature } from '$lib/test-utils/nomenclature-mock';

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$lib/utils/permissions.js', () => ({
	canRead: vi.fn(() => false),
	canCreate: vi.fn(() => false),
	canUpdate: vi.fn(() => false),
	hasPermission: vi.fn(() => false),
	hasAnyPermission: vi.fn(() => false),
	isSuperAdmin: vi.fn(() => false),
	PERMISSIONS: {}
}));

vi.mock('$lib/components/ui/sidebar/context.svelte.js', () => ({
	useSidebar: vi.fn(() => ({
		isMobile: false,
		setOpenMobile: vi.fn()
	}))
}));

vi.mock('$lib/nomenclature', async () => {
	const { createNomenclatureMock } = await import('$lib/test-utils/nomenclature-mock');
	return createNomenclatureMock();
});

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

	it('should show "Sashakt" fallback when organization has no logo', () => {
		render(AppSidebar, {
			data: {
				...baseData,
				organization: { name: 'Acme Corp', logo: '', shortcode: 'acme' }
			}
		});

		expect(screen.getByText('Sashakt')).toBeInTheDocument();
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

	it('should show only logo when organization has a logo', () => {
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
		expect(screen.queryByText('Sashakt')).not.toBeInTheDocument();
		expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
	});
});

describe('AppSidebar - Custom nomenclature labels', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		resetNomenclature();
		const permissions = await import('$lib/utils/permissions.js');
		vi.mocked(permissions.canCreate).mockReturnValue(true);
		vi.mocked(permissions.canRead).mockReturnValue(true);
	});

	it('renders custom sidebar label when tests is overridden', () => {
		setCustomNomenclature({ tests: 'Assessments' });
		render(AppSidebar, { data: baseData });
		expect(screen.getByText('Assessments')).toBeInTheDocument();
		expect(screen.queryByText('Tests')).not.toBeInTheDocument();
	});

	it('renders custom sidebar label when question_bank is overridden', () => {
		setCustomNomenclature({ question_bank: 'Knowledge Base' });
		render(AppSidebar, { data: baseData });
		expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
		expect(screen.queryByText('Question Bank')).not.toBeInTheDocument();
	});

	it('renders custom sidebar label when tag_management is overridden', () => {
		setCustomNomenclature({ tag_management: 'Categories' });
		render(AppSidebar, { data: baseData });
		expect(screen.getByText('Categories')).toBeInTheDocument();
		expect(screen.queryByText('Tag Management')).not.toBeInTheDocument();
	});

	it('renders custom sidebar label when certificates is overridden', () => {
		setCustomNomenclature({ certificates: 'Awards' });
		render(AppSidebar, { data: baseData });
		expect(screen.getByText('Awards')).toBeInTheDocument();
		expect(screen.queryByText('Certificates')).not.toBeInTheDocument();
	});

	it('renders custom sidebar label when entities is overridden', () => {
		setCustomNomenclature({ entities: 'Groups' });
		render(AppSidebar, { data: baseData });
		expect(screen.getByText('Groups')).toBeInTheDocument();
		expect(screen.queryByText('Entities')).not.toBeInTheDocument();
	});

	it('renders custom sidebar label when forms is overridden', () => {
		setCustomNomenclature({ forms: 'Surveys' });
		render(AppSidebar, { data: baseData });
		expect(screen.getByText('Surveys')).toBeInTheDocument();
		expect(screen.queryByText('Forms')).not.toBeInTheDocument();
	});

	it('applies multiple custom nomenclature overrides simultaneously', () => {
		setCustomNomenclature({
			tests: 'Exams',
			question_bank: 'Library',
			certificates: 'Awards'
		});
		render(AppSidebar, { data: baseData });
		expect(screen.getByText('Exams')).toBeInTheDocument();
		expect(screen.getByText('Library')).toBeInTheDocument();
		expect(screen.getByText('Awards')).toBeInTheDocument();
	});

	it('falls back to defaults when no custom nomenclature is set', () => {
		render(AppSidebar, { data: baseData });
		expect(screen.getByText('Tests')).toBeInTheDocument();
		expect(screen.getByText('Question Bank')).toBeInTheDocument();
	});
});
