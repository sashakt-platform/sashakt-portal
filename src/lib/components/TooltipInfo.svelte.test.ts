import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import TooltipInfo from './TooltipInfo.svelte';

describe('TooltipInfo', () => {
	describe('Basic Rendering', () => {
		it('should render info icon', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					description: 'This is help text'
				}
			});

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toBeInTheDocument();
		});

		it('should render with default label', () => {
			render(TooltipInfo, {
				props: {
					description: 'Some description'
				}
			});

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toBeInTheDocument();
		});

		it('should render with custom label', () => {
			render(TooltipInfo, {
				props: {
					label: 'Information',
					description: 'Some description'
				}
			});

			const button = screen.getByRole('button', { name: 'Information' });
			expect(button).toBeInTheDocument();
		});

		it('should render with empty description', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					description: ''
				}
			});

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have correct aria-label', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help Text',
					description: 'Description'
				}
			});

			const button = screen.getByRole('button', { name: 'Help Text' });
			expect(button).toHaveAttribute('aria-label', 'Help Text');
		});

		it('should have aria-describedby attribute', () => {
			const { container } = render(TooltipInfo, {
				props: {
					label: 'Help',
					description: 'Description'
				}
			});

			const span = container.querySelector('span[role="button"]');
			expect(span).toHaveAttribute('aria-describedby');
		});

		it('should generate tooltip ID from label', () => {
			render(TooltipInfo, {
				props: {
					label: 'User Help',
					description: 'Description'
				}
			});

			const button = screen.getByRole('button', { name: 'User Help' });
			expect(button).toHaveAttribute('aria-describedby', 'tooltip-user-help');
		});
	});

	describe('Tooltip ID Generation', () => {
		it('should convert simple label to ID', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					description: 'Description'
				}
			});

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toHaveAttribute('aria-describedby', 'tooltip-help');
		});

		it('should convert multi-word label to ID with hyphens', () => {
			render(TooltipInfo, {
				props: {
					label: 'User Management Help',
					description: 'Description'
				}
			});

			const button = screen.getByRole('button', { name: 'User Management Help' });
			expect(button).toHaveAttribute('aria-describedby', 'tooltip-user-management-help');
		});

		it('should convert to lowercase', () => {
			render(TooltipInfo, {
				props: {
					label: 'HELP',
					description: 'Description'
				}
			});

			const button = screen.getByRole('button', { name: 'HELP' });
			expect(button).toHaveAttribute('aria-describedby', 'tooltip-help');
		});

		it('should handle multiple spaces', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help    Text    Here',
					description: 'Description'
				}
			});

			// Browser normalizes multiple spaces to single space in accessible name
			const button = screen.getByRole('button', { name: /Help.*Text.*Here/ });
			expect(button).toHaveAttribute('aria-describedby', 'tooltip-help-text-here');
		});
	});

	describe('Styling', () => {
		it('should have correct CSS classes', () => {
			const { container } = render(TooltipInfo, {
				props: {
					label: 'Help',
					description: 'Description'
				}
			});

			const button = container.querySelector('[role="button"]');
			expect(button).toHaveClass('inline-flex');
			expect(button).toHaveClass('cursor-pointer');
			expect(button).toHaveClass('rounded');
		});

		it('should have hover styles', () => {
			const { container } = render(TooltipInfo, {
				props: {
					label: 'Help',
					description: 'Description'
				}
			});

			const button = container.querySelector('[role="button"]');
			expect(button).toHaveClass('hover:text-gray-900');
		});

		it('should have focus styles', () => {
			const { container } = render(TooltipInfo, {
				props: {
					label: 'Help',
					description: 'Description'
				}
			});

			const button = container.querySelector('[role="button"]');
			expect(button).toHaveClass('focus-visible:ring-2');
			expect(button).toHaveClass('focus-visible:outline-none');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty label', () => {
			const { container } = render(TooltipInfo, {
				props: {
					label: '',
					description: 'Description'
				}
			});

			const span = container.querySelector('span[role="button"]');
			expect(span).toBeInTheDocument();
		});

		it('should handle very long description', () => {
			const longDescription =
				'This is a very long description that contains a lot of text and should still render properly in the tooltip component without any issues';

			render(TooltipInfo, {
				props: {
					label: 'Help',
					description: longDescription
				}
			});

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toBeInTheDocument();
		});

		it('should handle special characters in label', () => {
			render(TooltipInfo, {
				props: {
					label: "User's & Admin's Help",
					description: 'Description'
				}
			});

			const button = screen.getByRole('button', { name: "User's & Admin's Help" });
			expect(button).toBeInTheDocument();
		});

		it('should handle special characters in description', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					description: 'Special chars: <>&"\'{}[]'
				}
			});

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toBeInTheDocument();
		});

		it('should handle numbers in label', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help123',
					description: 'Description'
				}
			});

			const button = screen.getByRole('button', { name: 'Help123' });
			expect(button).toHaveAttribute('aria-describedby', 'tooltip-help123');
		});

		it('should handle unicode characters', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help 🎯',
					description: 'Description with emoji 🚀'
				}
			});

			const button = screen.getByRole('button', { name: 'Help 🎯' });
			expect(button).toBeInTheDocument();
		});
	});
});
