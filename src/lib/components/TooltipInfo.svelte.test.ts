import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import TooltipInfo from './TooltipInfo.svelte';
import type { TooltipKey } from '$lib/config/tooltips';

const testVideoKey = 'test-video' as TooltipKey;


vi.mock('$lib/config/tooltips', () => ({
	TOOLTIPS: {
		dashboard: {
			label: 'Help: Dashboard',
			items: [
				{
					question: 'What is Dashboard',
					text: "Dashboard provides a quick overview of your organization's activity."
				}
			]
		},
		users: {
			label: 'Help: User management',
			items: [
				{
					question: 'What is User management',
					text: 'This panel displays all users in the system.'
				}
			]
		},
		'test-video': {
			label: 'Help: Video Guide',
			items: [
				{ question: 'What is it', text: 'Text answer' },
				{ question: 'How to use it', videoUrl: 'https://www.youtube.com/embed/abc123' }
			]
		}
	}
}));

describe('TooltipInfo', () => {
	describe('Basic Rendering', () => {
		it('should render info icon', () => {
			render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const button = screen.getByRole('button', { name: 'Help: Dashboard' });
			expect(button).toBeInTheDocument();
		});

		it('should render with default label when no key is provided', () => {
			render(TooltipInfo, { props: {} });

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toBeInTheDocument();
		});

		it('should render with label from tooltipKey', () => {
			render(TooltipInfo, { props: { tooltipKey: 'users' } });

			const button = screen.getByRole('button', { name: 'Help: User management' });
			expect(button).toBeInTheDocument();
		});

		it('should render with empty items when no key is provided', () => {
			render(TooltipInfo, { props: {} });

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have correct aria-label from tooltipKey', () => {
			render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const button = screen.getByRole('button', { name: 'Help: Dashboard' });
			expect(button).toHaveAttribute('aria-label', 'Help: Dashboard');
		});

		it('should have aria-describedby attribute', () => {
			const { container } = render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const button = container.querySelector('button');
			expect(button).toHaveAttribute('aria-describedby');
		});

		it('should generate tooltip ID from label', () => {
			render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const button = screen.getByRole('button', { name: 'Help: Dashboard' });
			expect(button).toHaveAttribute('aria-describedby', 'tooltip-help:-dashboard');
		});
	});

	describe('Tooltip ID Generation', () => {
		it('should convert simple label to ID', () => {
			render(TooltipInfo, { props: {} });

			const button = screen.getByRole('button', { name: 'Help' });
			expect(button).toHaveAttribute('aria-describedby', 'tooltip-help');
		});

		it('should convert multi-word label to ID with hyphens', () => {
			render(TooltipInfo, { props: { tooltipKey: 'users' } });

			const button = screen.getByRole('button', { name: 'Help: User management' });
			expect(button).toHaveAttribute('aria-describedby', 'tooltip-help:-user-management');
		});

		it('should convert label to lowercase in ID', () => {
			render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const button = screen.getByRole('button', { name: 'Help: Dashboard' });
			const id = button.getAttribute('aria-describedby') ?? '';
			expect(id).toBe(id.toLowerCase());
		});

		it('should replace spaces with hyphens in ID', () => {
			render(TooltipInfo, { props: { tooltipKey: 'users' } });

			const button = screen.getByRole('button', { name: 'Help: User management' });
			const id = button.getAttribute('aria-describedby') ?? '';
			expect(id).not.toContain(' ');
		});
	});

	describe('Styling', () => {
		it('should have correct CSS classes', () => {
			const { container } = render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const button = container.querySelector('button');
			expect(button).toHaveClass('inline-flex');
			expect(button).toHaveClass('cursor-pointer');
			expect(button).toHaveClass('rounded');
		});

		it('should have hover styles', () => {
			const { container } = render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const button = container.querySelector('button');
			expect(button).toHaveClass('hover:text-foreground');
		});

		it('should have focus styles', () => {
			const { container } = render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const button = container.querySelector('button');
			expect(button).toHaveClass('focus-visible:ring-2');
			expect(button).toHaveClass('focus-visible:outline-none');
		});
	});

	describe('Edge Cases', () => {
		it('should render without a tooltipKey', () => {
			const { container } = render(TooltipInfo, { props: {} });

			const button = container.querySelector('button');
			expect(button).toBeInTheDocument();
		});

		it('should render with a valid tooltipKey containing long text', async () => {
			render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const button = screen.getByRole('button', { name: 'Help: Dashboard' });
			expect(button).toBeInTheDocument();
		});

		it('should render with any valid tooltipKey', () => {
			render(TooltipInfo, { props: { tooltipKey: 'users' } });

			const button = screen.getByRole('button', { name: 'Help: User management' });
			expect(button).toBeInTheDocument();
		});

		it('should render with dashboard tooltipKey', () => {
			render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const button = screen.getByRole('button', { name: 'Help: Dashboard' });
			expect(button).toBeInTheDocument();
		});
	});

	describe('Title Derivation', () => {
		it('should strip "Help: " prefix from label for header title', async () => {
			render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const trigger = screen.getByRole('button', { name: 'Help: Dashboard' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('Dashboard')).toBeInTheDocument();
		});

		it('should show only the topic name without "Help: " prefix in header', async () => {
			render(TooltipInfo, { props: { tooltipKey: 'users' } });

			const trigger = screen.getByRole('button', { name: 'Help: User management' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('User management')).toBeInTheDocument();
		});

		it('should show "Help" as-is when no key is provided (no prefix to strip)', async () => {
			render(TooltipInfo, { props: {} });

			const trigger = screen.getByRole('button', { name: 'Help' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('Help')).toBeInTheDocument();
		});
	});

	describe('Popover Content', () => {
		it('should show question and text answer when item is provided', async () => {
			render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const trigger = screen.getByRole('button', { name: 'Help: Dashboard' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('What is Dashboard')).toBeInTheDocument();
			expect(
				await screen.findByText("Dashboard provides a quick overview of your organization's activity.")
			).toBeInTheDocument();
		});

		it('should not show any Q&A content when no key is provided', async () => {
			render(TooltipInfo, { props: {} });

			const trigger = screen.getByRole('button', { name: 'Help' });
			await fireEvent.click(trigger);

			await waitFor(() =>
				expect(screen.queryByText('What is Dashboard')).not.toBeInTheDocument()
			);
		});

		it('should show title in popover header', async () => {
			render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const trigger = screen.getByRole('button', { name: 'Help: Dashboard' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('Dashboard')).toBeInTheDocument();
		});

		it('should show close button when popover is open and close popover on click', async () => {
			render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const trigger = screen.getByRole('button', { name: 'Help: Dashboard' });
			await fireEvent.click(trigger);

			const closeButton = await screen.findByRole('button', { name: 'Close' });
			expect(closeButton).toBeInTheDocument();

			await fireEvent.click(closeButton);

			await waitFor(() =>
				expect(screen.queryByText('What is Dashboard')).not.toBeInTheDocument()
			);
		});
	});

	describe('Video URL', () => {
		it('should render iframe when tooltipKey has a videoUrl item', async () => {
			render(TooltipInfo, { props: { tooltipKey: testVideoKey } });

			const trigger = screen.getByRole('button', { name: 'Help: Video Guide' });
			await fireEvent.click(trigger);

			const iframe = await screen.findByTitle('How to use it');
			expect(iframe).toBeInTheDocument();
			expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/abc123');
		});

		it('should show video question heading when tooltipKey has a videoUrl item', async () => {
			render(TooltipInfo, { props: { tooltipKey: testVideoKey } });

			const trigger = screen.getByRole('button', { name: 'Help: Video Guide' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('How to use it')).toBeInTheDocument();
		});

		it('should not render iframe when tooltipKey has no videoUrl item', async () => {
			render(TooltipInfo, { props: { tooltipKey: 'dashboard' } });

			const trigger = screen.getByRole('button', { name: 'Help: Dashboard' });
			await fireEvent.click(trigger);

			await waitFor(() => expect(document.body.querySelector('iframe')).not.toBeInTheDocument());
		});

		it('should set correct iframe title from item question', async () => {
			render(TooltipInfo, { props: { tooltipKey: testVideoKey } });

			const trigger = screen.getByRole('button', { name: 'Help: Video Guide' });
			await fireEvent.click(trigger);

			const iframe = await screen.findByTitle('How to use it');
			expect(iframe).toHaveAttribute('title', 'How to use it');
		});

		it('should show both text and video items when tooltipKey has both', async () => {
			render(TooltipInfo, { props: { tooltipKey: testVideoKey } });

			const trigger = screen.getByRole('button', { name: 'Help: Video Guide' });
			await fireEvent.click(trigger);

			expect(await screen.findByText('What is it')).toBeInTheDocument();
			expect(await screen.findByText('How to use it')).toBeInTheDocument();
		});
	});
});
