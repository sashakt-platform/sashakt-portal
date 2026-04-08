import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
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
			expect(button).toHaveClass('hover:text-gray-700');
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

	describe('Title Derivation', () => {
		it('should strip "Help: " prefix from label for title', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Help: Marks',
					description: 'Marks description'
				}
			});

			const trigger = screen.getByRole('button', { name: 'Help: Marks' });
			await fireEvent.click(trigger);

			expect(screen.getByText('What is Marks')).toBeInTheDocument();
		});

		it('should strip "help: " prefix case-insensitively', async () => {
			render(TooltipInfo, {
				props: {
					label: 'HELP: Passing Criteria',
					description: 'Some description'
				}
			});

			const trigger = screen.getByRole('button', { name: 'HELP: Passing Criteria' });
			await fireEvent.click(trigger);

			expect(screen.getByText('What is Passing Criteria')).toBeInTheDocument();
		});

		it('should use label as-is when no "Help: " prefix', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Marks',
					description: 'Marks description'
				}
			});

			const trigger = screen.getByRole('button', { name: 'Marks' });
			await fireEvent.click(trigger);

			expect(screen.getByText('What is Marks')).toBeInTheDocument();
		});
	});

	describe('Popover Content', () => {
		it('should show description section when description is provided', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					description: 'This is the description text'
				}
			});

			const trigger = screen.getByRole('button', { name: 'Help' });
			await fireEvent.click(trigger);

			expect(screen.getByText('What is Help')).toBeInTheDocument();
			expect(screen.getByText('This is the description text')).toBeInTheDocument();
		});

		it('should not show description section when description is empty', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					description: ''
				}
			});

			const trigger = screen.getByRole('button', { name: 'Help' });
			await fireEvent.click(trigger);

			expect(screen.queryByText('What is Help')).not.toBeInTheDocument();
		});

		it('should show title in popover header', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Marks',
					description: 'Some description'
				}
			});

			const trigger = screen.getByRole('button', { name: 'Marks' });
			await fireEvent.click(trigger);

			const header = screen.getByText('Marks');
			expect(header).toBeInTheDocument();
		});

		it('should show close button when popover is open', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					description: 'Description'
				}
			});

			const trigger = screen.getByRole('button', { name: 'Help' });
			await fireEvent.click(trigger);

			const closeButton = screen.getByRole('button', { name: 'Close' });
			expect(closeButton).toBeInTheDocument();
		});
	});

	describe('Video URL', () => {
		it('should render iframe when videoUrl is provided', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					description: 'Description',
					videoUrl: 'https://www.youtube.com/embed/abc123'
				}
			});

			const trigger = screen.getByRole('button', { name: 'Help' });
			await fireEvent.click(trigger);

			const iframe = document.body.querySelector('iframe');
			expect(iframe).toBeInTheDocument();
			expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/abc123');
		});

		it('should show "How to use" heading when videoUrl is provided', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Marks',
					description: 'Description',
					videoUrl: 'https://www.youtube.com/embed/abc123'
				}
			});

			const trigger = screen.getByRole('button', { name: 'Marks' });
			await fireEvent.click(trigger);

			expect(screen.getByText('How to use Marks')).toBeInTheDocument();
		});

		it('should not render iframe when videoUrl is not provided', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					description: 'Description'
				}
			});

			const trigger = screen.getByRole('button', { name: 'Help' });
			await fireEvent.click(trigger);

			expect(document.body.querySelector('iframe')).not.toBeInTheDocument();
		});

		it('should not show "How to use" heading when videoUrl is not provided', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					description: 'Description'
				}
			});

			const trigger = screen.getByRole('button', { name: 'Help' });
			await fireEvent.click(trigger);

			expect(screen.queryByText('How to use Help')).not.toBeInTheDocument();
		});

		it('should set correct iframe title', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Marks',
					description: 'Description',
					videoUrl: 'https://www.youtube.com/embed/abc123'
				}
			});

			const trigger = screen.getByRole('button', { name: 'Marks' });
			await fireEvent.click(trigger);

			const iframe = document.body.querySelector('iframe');
			expect(iframe).toHaveAttribute('title', 'How to use Marks');
		});

		it('should show both description and video sections when both are provided', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Marks',
					description: 'This explains marks',
					videoUrl: 'https://www.youtube.com/embed/abc123'
				}
			});

			const trigger = screen.getByRole('button', { name: 'Marks' });
			await fireEvent.click(trigger);

			expect(screen.getByText('What is Marks')).toBeInTheDocument();
			expect(screen.getByText('How to use Marks')).toBeInTheDocument();
		});
	});
});
