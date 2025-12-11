import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import ImportQuestions from './+page.svelte';

// Mock sveltekit-superforms so fileProxy never touches DataTransfer
vi.mock('sveltekit-superforms', async () => {
	const actual = await vi.importActual<any>('sveltekit-superforms');
	return {
		...actual,
		fileProxy: () => ({
			update: () => {},
			subscribe: () => () => {}
		})
	};
});

const baseData = {
	form: { file: null },
	user: { id: 1, permissions: ['create_question'] }
};

describe('Import Questions Page', () => {
	test('renders the heading "Import questions"', () => {
		render(ImportQuestions, { data: baseData });

		expect(screen.getByText('Import questions')).toBeInTheDocument();
		expect(screen.getByText('Click to upload Questions')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /download template/i })).toBeInTheDocument();
		expect(screen.getByText('Instructions')).toBeInTheDocument();
	});

	test('disables import button while uploading', async () => {
		render(ImportQuestions, { data: { ...baseData, form: { ...baseData.form, uploading: true } } });
		const submitBtn = screen.getByRole('button', { name: /import/i });
		expect(submitBtn).toBeDisabled();
	});

	test('shows instructions list', () => {
		render(ImportQuestions, { data: baseData });

		expect(screen.getByText('Instructions')).toBeInTheDocument();
		expect(
			screen.getByText(
				'Download the CSV template or upload your own with appropriate tags & details.'
			)
		).toBeInTheDocument();
	});

	test('has hidden CSV file input and download template link', () => {
		const { container } = render(ImportQuestions, { data: baseData });

		const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null;
		expect(fileInput).toBeTruthy();
		expect(fileInput?.hidden).toBe(true);
		expect(fileInput?.getAttribute('accept')).toContain('.csv');

		const downloadLink = screen.getByRole('link', { name: /download template/i });
		expect(downloadLink).toHaveAttribute('download', 'template.csv');
	});

	test('disables import button when no file is selected', () => {
		render(ImportQuestions, { data: baseData });
		const importBtn = screen.getByRole('button', { name: /import/i });
		expect(importBtn).toBeDisabled();
	});

	test('shows selected file info and enables import', () => {
		const file = new File(['hello'], 'questions.csv', { type: 'text/csv' });
		render(ImportQuestions, { data: { ...baseData, form: { file } } });

		expect(screen.getByText('questions.csv')).toBeInTheDocument();
		const importBtn = screen.getByRole('button', { name: /import/i });
		expect(importBtn).toBeEnabled();
	});
});
