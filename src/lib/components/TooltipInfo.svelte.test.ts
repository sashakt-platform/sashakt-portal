import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import TooltipInfo from './TooltipInfo.svelte';

describe('TooltipInfo', () => {
	describe('Basic Rendering', () => {
		it('should render info icon', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					items: [{ question: 'What is Help', text: 'This is help text' }]
				}
			});

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toBeInTheDocument();
		});

		it('should render with default label', () => {
			render(TooltipInfo, {
				props: {
					items: [{ question: 'What is Help', text: 'Some description' }]
				}
			});

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toBeInTheDocument();
		});

		it('should render with custom label', () => {
			render(TooltipInfo, {
				props: {
					label: 'Information',
					items: [{ question: 'What is Information', text: 'Some description' }]
				}
			});

			const button = screen.getByRole('button', { name: 'Information' });
			expect(button).toBeInTheDocument();
		});

		it('should render with empty items', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					items: []
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
					items: [{ question: 'What is Help Text', text: 'Description' }]
				}
			});

			const button = screen.getByRole('button', { name: 'Help Text' });
			expect(button).toHaveAttribute('aria-label', 'Help Text');
		});

		it('should have aria-describedby attribute', () => {
			const { container } = render(TooltipInfo, {
				props: {
					label: 'Help',
					items: [{ question: 'What is Help', text: 'Description' }]
				}
			});

			const button = container.querySelector('button');
			expect(button).toHaveAttribute('aria-describedby');
		});

		it('should generate tooltip ID from label', () => {
			render(TooltipInfo, {
				props: {
					label: 'User Help',
					items: [{ question: 'What is User Help', text: 'Description' }]
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
					items: [{ question: 'What is Help', text: 'Description' }]
				}
			});

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toHaveAttribute('aria-describedby', 'tooltip-help');
		});

		it('should convert multi-word label to ID with hyphens', () => {
			render(TooltipInfo, {
				props: {
					label: 'User Management Help',
					items: [{ question: 'What is User Management Help', text: 'Description' }]
				}
			});

			const button = screen.getByRole('button', { name: 'User Management Help' });
			expect(button).toHaveAttribute('aria-describedby', 'tooltip-user-management-help');
		});

		it('should convert to lowercase', () => {
			render(TooltipInfo, {
				props: {
					label: 'HELP',
					items: [{ question: 'What is HELP', text: 'Description' }]
				}
			});

			const button = screen.getByRole('button', { name: 'HELP' });
			expect(button).toHaveAttribute('aria-describedby', 'tooltip-help');
		});

		it('should handle multiple spaces', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help    Text    Here',
					items: [{ question: 'What is Help Text Here', text: 'Description' }]
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
					items: [{ question: 'What is Help', text: 'Description' }]
				}
			});

			const button = container.querySelector('button');
			expect(button).toHaveClass('inline-flex');
			expect(button).toHaveClass('cursor-pointer');
			expect(button).toHaveClass('rounded');
		});

		it('should have hover styles', () => {
			const { container } = render(TooltipInfo, {
				props: {
					label: 'Help',
					items: [{ question: 'What is Help', text: 'Description' }]
				}
			});

			const button = container.querySelector('button');
			expect(button).toHaveClass('hover:text-foreground');
		});

		it('should have focus styles', () => {
			const { container } = render(TooltipInfo, {
				props: {
					label: 'Help',
					items: [{ question: 'What is Help', text: 'Description' }]
				}
			});

			const button = container.querySelector('button');
			expect(button).toHaveClass('focus-visible:ring-2');
			expect(button).toHaveClass('focus-visible:outline-none');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty label', () => {
			const { container } = render(TooltipInfo, {
				props: {
					label: '',
					items: [{ question: 'What is it', text: 'Description' }]
				}
			});

			const button = container.querySelector('button');
			expect(button).toBeInTheDocument();
		});

		it('should handle very long text answer', () => {
			const longText =
				'This is a very long description that contains a lot of text and should still render properly in the tooltip component without any issues';

			render(TooltipInfo, {
				props: {
					label: 'Help',
					items: [{ question: 'What is Help', text: longText }]
				}
			});

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toBeInTheDocument();
		});

		it('should handle special characters in label', () => {
			render(TooltipInfo, {
				props: {
					label: "User's & Admin's Help",
					items: [{ question: 'What is it', text: 'Description' }]
				}
			});

			const button = screen.getByRole('button', { name: "User's & Admin's Help" });
			expect(button).toBeInTheDocument();
		});

		it('should handle special characters in text answer', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					items: [{ question: 'What is Help', text: 'Special chars: <>&"\'{}[]' }]
				}
			});

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toBeInTheDocument();
		});

		it('should handle numbers in label', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help123',
					items: [{ question: 'What is Help123', text: 'Description' }]
				}
			});

			const button = screen.getByRole('button', { name: 'Help123' });
			expect(button).toHaveAttribute('aria-describedby', 'tooltip-help123');
		});

		it('should handle unicode characters', () => {
			render(TooltipInfo, {
				props: {
					label: 'Help 🎯',
					items: [{ question: 'What is Help', text: 'Description with emoji 🚀' }]
				}
			});

			const button = screen.getByRole('button', { name: 'Help 🎯' });
			expect(button).toBeInTheDocument();
		});
	});

	describe('Title Derivation', () => {
		it('should strip "Help: " prefix from label for header title', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Help: Marks',
					items: [{ question: 'What is Marks', text: 'Marks description' }]
				}
			});

			const trigger = screen.getByRole('button', { name: 'Help: Marks' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('Marks')).toBeInTheDocument();
		});

		it('should strip "help: " prefix case-insensitively', async () => {
			render(TooltipInfo, {
				props: {
					label: 'HELP: Passing Criteria',
					items: [{ question: 'What is Passing Criteria', text: 'Some description' }]
				}
			});

			const trigger = screen.getByRole('button', { name: 'HELP: Passing Criteria' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('Passing Criteria')).toBeInTheDocument();
		});

		it('should use label as-is when no "Help: " prefix', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Marks',
					items: [{ question: 'What is Marks', text: 'Marks description' }]
				}
			});

			const trigger = screen.getByRole('button', { name: 'Marks' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('Marks')).toBeInTheDocument();
		});
	});

	describe('Popover Content', () => {
		it('should show question and text answer when item is provided', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					items: [{ question: 'What is Help', text: 'This is the description text' }]
				}
			});

			const trigger = screen.getByRole('button', { name: 'Help' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('What is Help')).toBeInTheDocument();
			expect(await screen.findByText('This is the description text')).toBeInTheDocument();
		});

		it('should not show any Q&A content when items is empty', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					items: []
				}
			});

			const trigger = screen.getByRole('button', { name: 'Help' });
			await fireEvent.click(trigger);

			await waitFor(() => expect(screen.queryByText('What is Help')).not.toBeInTheDocument());
		});

		it('should show title in popover header', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Marks',
					items: [{ question: 'What is Marks', text: 'Some description' }]
				}
			});

			const trigger = screen.getByRole('button', { name: 'Marks' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('Marks')).toBeInTheDocument();
		});

		it('should show close button when popover is open and close popover on click', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					items: [{ question: 'What is Help', text: 'Description' }]
				}
			});

			const trigger = screen.getByRole('button', { name: 'Help' });
			await fireEvent.click(trigger);

			const closeButton = await screen.findByRole('button', { name: 'Close' });
			expect(closeButton).toBeInTheDocument();

			await fireEvent.click(closeButton);

			await waitFor(() => expect(screen.queryByText('What is Help')).not.toBeInTheDocument());
		});
	});

	describe('Video URL', () => {
		it('should render iframe when videoUrl item is provided', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					items: [{ question: 'How to use Help', videoUrl: 'https://www.youtube.com/embed/abc123' }]
				}
			});

			const trigger = screen.getByRole('button', { name: 'Help' });
			await fireEvent.click(trigger);

			const iframe = await screen.findByTitle('How to use Help');
			expect(iframe).toBeInTheDocument();
			expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/abc123');
		});

		it('should show video question heading when videoUrl item is provided', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Marks',
					items: [{ question: 'How to use Marks', videoUrl: 'https://www.youtube.com/embed/abc123' }]
				}
			});

			const trigger = screen.getByRole('button', { name: 'Marks' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('How to use Marks')).toBeInTheDocument();
		});

		it('should not render iframe when no videoUrl item is provided', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Help',
					items: [{ question: 'What is Help', text: 'Description' }]
				}
			});

			const trigger = screen.getByRole('button', { name: 'Help' });
			await fireEvent.click(trigger);

			await waitFor(() => expect(document.body.querySelector('iframe')).not.toBeInTheDocument());
		});

		it('should set correct iframe title from item question', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Marks',
					items: [{ question: 'How to use Marks', videoUrl: 'https://www.youtube.com/embed/abc123' }]
				}
			});

			const trigger = screen.getByRole('button', { name: 'Marks' });
			await fireEvent.click(trigger);

			const iframe = await screen.findByTitle('How to use Marks');
			expect(iframe).toHaveAttribute('title', 'How to use Marks');
		});

		it('should show both text and video items when both are in the array', async () => {
			render(TooltipInfo, {
				props: {
					label: 'Marks',
					items: [
						{ question: 'What is Marks', text: 'This explains marks' },
						{ question: 'How to use Marks', videoUrl: 'https://www.youtube.com/embed/abc123' }
					]
				}
			});

			const trigger = screen.getByRole('button', { name: 'Marks' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('What is Marks')).toBeInTheDocument();
			expect(await screen.findByText('How to use Marks')).toBeInTheDocument();
		});
	});
});
