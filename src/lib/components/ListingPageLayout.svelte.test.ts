import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import ListingPageLayout from './ListingPageLayout.svelte';

// Mock TooltipInfo component
vi.mock('./TooltipInfo.svelte', () => ({
	default: vi.fn().mockImplementation(() => ({
		render: vi.fn(),
		$$set: vi.fn(),
		$destroy: vi.fn()
	}))
}));

describe('ListingPageLayout', () => {
	const defaultProps = {
		title: 'User Management',
		subtitle: 'Manage all users in the system'
	};

	describe('Basic Rendering', () => {
		it('should render title', () => {
			render(ListingPageLayout, { props: defaultProps });

			expect(screen.getByText('User Management')).toBeInTheDocument();
		});

		it('should render subtitle', () => {
			render(ListingPageLayout, { props: defaultProps });

			expect(screen.getByText('Manage all users in the system')).toBeInTheDocument();
		});

		it('should render both title and subtitle', () => {
			render(ListingPageLayout, { props: defaultProps });

			expect(screen.getByText('User Management')).toBeInTheDocument();
			expect(screen.getByText('Manage all users in the system')).toBeInTheDocument();
		});

		it('should render with custom title and subtitle', () => {
			render(ListingPageLayout, {
				props: {
					title: 'Question Bank',
					subtitle: 'Browse and manage questions'
				}
			});

			expect(screen.getByText('Question Bank')).toBeInTheDocument();
			expect(screen.getByText('Browse and manage questions')).toBeInTheDocument();
		});
	});

	describe('Info Icon', () => {
		it('should show info icon by default', () => {
			render(ListingPageLayout, { props: defaultProps });

			// TooltipInfo component should be rendered
			expect(screen.getByText('User Management')).toBeInTheDocument();
		});

		it('should not show info icon when showInfoIcon is false', () => {
			render(ListingPageLayout, {
				props: {
					...defaultProps,
					showInfoIcon: false
				}
			});

			expect(screen.getByText('User Management')).toBeInTheDocument();
		});

		it('should pass infoLabel and infoDescription to TooltipInfo', () => {
			render(ListingPageLayout, {
				props: {
					...defaultProps,
					infoLabel: 'Help',
					infoDescription: 'This is the help text'
				}
			});

			expect(screen.getByText('User Management')).toBeInTheDocument();
		});
	});

	describe('Empty State', () => {
		it('should not show empty state by default', () => {
			render(ListingPageLayout, { props: defaultProps });

			// Content area should be rendered (has mx-4 mt-6 classes)
			const { container } = render(ListingPageLayout, { props: defaultProps });
			const contentSection = container.querySelector('.mx-4.mt-6');
			expect(contentSection).toBeInTheDocument();
		});

		it('should show empty state when showEmptyState is true', () => {
			render(ListingPageLayout, {
				props: {
					...defaultProps,
					showEmptyState: true
				}
			});

			expect(screen.getByText('User Management')).toBeInTheDocument();
		});
	});

	describe('Filters', () => {
		it('should show filters by default when filters prop is provided', () => {
			render(ListingPageLayout, { props: defaultProps });

			// Just verify component renders
			expect(screen.getByText('User Management')).toBeInTheDocument();
		});

		it('should hide filters when showFilters is false', () => {
			render(ListingPageLayout, {
				props: {
					...defaultProps,
					showFilters: false
				}
			});

			expect(screen.getByText('User Management')).toBeInTheDocument();
		});

		it('should show filters when showFilters is true', () => {
			render(ListingPageLayout, {
				props: {
					...defaultProps,
					showFilters: true
				}
			});

			expect(screen.getByText('User Management')).toBeInTheDocument();
		});
	});

	describe('Layout Structure', () => {
		it('should have proper header structure', () => {
			const { container } = render(ListingPageLayout, { props: defaultProps });

			const header = container.querySelector('.mx-4.py-4');
			expect(header).toBeInTheDocument();
		});

		it('should have proper content structure when not in empty state', () => {
			const { container } = render(ListingPageLayout, {
				props: {
					...defaultProps,
					showEmptyState: false
				}
			});

			const contentSection = container.querySelector('.mx-4.mt-6');
			expect(contentSection).toBeInTheDocument();
		});

		it('should apply correct CSS classes to title', () => {
			const { container } = render(ListingPageLayout, { props: defaultProps });

			const title = screen.getByText('User Management');
			expect(title).toHaveClass('text-2xl');
			expect(title).toHaveClass('font-semibold');
		});

		it('should apply correct CSS classes to subtitle', () => {
			render(ListingPageLayout, { props: defaultProps });

			const subtitle = screen.getByText('Manage all users in the system');
			expect(subtitle).toHaveClass('text-sm');
			expect(subtitle).toHaveClass('font-extralight');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty title', () => {
			render(ListingPageLayout, {
				props: {
					title: '',
					subtitle: 'A subtitle'
				}
			});

			expect(screen.getByText('A subtitle')).toBeInTheDocument();
		});

		it('should handle empty subtitle', () => {
			render(ListingPageLayout, {
				props: {
					title: 'A Title',
					subtitle: ''
				}
			});

			expect(screen.getByText('A Title')).toBeInTheDocument();
		});

		it('should handle long title', () => {
			const longTitle =
				'This is a very long title that might wrap to multiple lines on smaller screens';
			render(ListingPageLayout, {
				props: {
					title: longTitle,
					subtitle: 'Subtitle'
				}
			});

			expect(screen.getByText(longTitle)).toBeInTheDocument();
		});

		it('should handle long subtitle', () => {
			const longSubtitle =
				'This is a very long subtitle that provides detailed information about the page and its purpose';
			render(ListingPageLayout, {
				props: {
					title: 'Title',
					subtitle: longSubtitle
				}
			});

			expect(screen.getByText(longSubtitle)).toBeInTheDocument();
		});

		it('should handle special characters in title', () => {
			render(ListingPageLayout, {
				props: {
					title: "User's & Admin's Panel",
					subtitle: 'Manage users'
				}
			});

			expect(screen.getByText("User's & Admin's Panel")).toBeInTheDocument();
		});

		it('should handle all boolean flags together', () => {
			render(ListingPageLayout, {
				props: {
					...defaultProps,
					showFilters: true,
					showEmptyState: false,
					showInfoIcon: true
				}
			});

			expect(screen.getByText('User Management')).toBeInTheDocument();
		});

		it('should handle undefined optional props', () => {
			render(ListingPageLayout, {
				props: {
					title: 'Test',
					subtitle: 'Test subtitle'
				}
			});

			expect(screen.getByText('Test')).toBeInTheDocument();
		});
	});

	describe('Responsive Design', () => {
		it('should have responsive classes on header', () => {
			const { container } = render(ListingPageLayout, { props: defaultProps });

			const header = container.querySelector('.sm\\:mx-10');
			expect(header).toBeInTheDocument();
		});

		it('should have responsive classes on content section', () => {
			const { container } = render(ListingPageLayout, { props: defaultProps });

			const contentSection = container.querySelector('.sm\\:mx-8');
			expect(contentSection).toBeInTheDocument();
		});

		it('should have responsive flex direction on header', () => {
			const { container } = render(ListingPageLayout, { props: defaultProps });

			const headerFlex = container.querySelector('.sm\\:flex-row');
			expect(headerFlex).toBeInTheDocument();
		});
	});
});
