import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import QuestionsPerPageCard from './cards/QuestionsPerPageCard.svelte';
import type { OrganizationSettings } from './schema';

function baseSettings(mode: 'fixed' | 'flexible' = 'fixed') {
	return {
		questions_per_page: {
			mode,
			value: { question_pagination: 1 }
		}
	} as unknown as OrganizationSettings;
}

describe('FeatureCard (via QuestionsPerPageCard)', () => {
	it('should render the title', () => {
		render(QuestionsPerPageCard, { settings: baseSettings() });
		expect(screen.getByRole('heading', { name: 'Questions per Page' })).toBeInTheDocument();
	});

	it('should render the description', () => {
		render(QuestionsPerPageCard, { settings: baseSettings() });
		expect(screen.getByText('Set how many questions appear on each page')).toBeInTheDocument();
	});

	it('should render Fixed and Flexible buttons', () => {
		render(QuestionsPerPageCard, { settings: baseSettings() });
		expect(screen.getByRole('button', { name: 'Fixed' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Flexible' })).toBeInTheDocument();
	});

	it('should highlight Fixed button when mode is fixed', () => {
		render(QuestionsPerPageCard, { settings: baseSettings('fixed') });
		const fixedBtn = screen.getByRole('button', { name: 'Fixed' });
		expect(fixedBtn.className).toContain('font-semibold');
	});

	it('should highlight Flexible button when mode is flexible', () => {
		render(QuestionsPerPageCard, { settings: baseSettings('flexible') });
		const flexBtn = screen.getByRole('button', { name: 'Flexible' });
		expect(flexBtn.className).toContain('font-semibold');
	});

	it('should switch mode to flexible on click', async () => {
		const settings = baseSettings('fixed');
		render(QuestionsPerPageCard, { settings });
		await fireEvent.click(screen.getByRole('button', { name: 'Flexible' }));
		expect(settings.questions_per_page.mode).toBe('flexible');
	});

	it('should switch mode to fixed on click', async () => {
		const settings = baseSettings('flexible');
		render(QuestionsPerPageCard, { settings });
		await fireEvent.click(screen.getByRole('button', { name: 'Fixed' }));
		expect(settings.questions_per_page.mode).toBe('fixed');
	});

	it('should set toggle buttons as type="button"', () => {
		render(QuestionsPerPageCard, { settings: baseSettings() });
		expect(screen.getByRole('button', { name: 'Fixed' })).toHaveAttribute('type', 'button');
		expect(screen.getByRole('button', { name: 'Flexible' })).toHaveAttribute('type', 'button');
	});

	it('should render inside a section element', () => {
		const { container } = render(QuestionsPerPageCard, { settings: baseSettings() });
		expect(container.querySelector('section')).toBeInTheDocument();
	});

	it('should render slot content (number input)', () => {
		render(QuestionsPerPageCard, { settings: baseSettings() });
		expect(screen.getByText('Enter number of questions')).toBeInTheDocument();
	});
});
