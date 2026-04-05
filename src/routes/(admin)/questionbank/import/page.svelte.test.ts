import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import ImportQuestions from './+page.svelte';

// Mock sveltekit-superforms so fileProxy never touches DataTransfer
vi.mock('sveltekit-superforms', async () => {
	const actual = await vi.importActual<any>('sveltekit-superforms');
	return {
		...actual,
		fileProxy: () => ({
			set: () => {},
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
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render the page heading', () => {
			render(ImportQuestions, { data: baseData });
			expect(screen.getByText('Bulk Upload Questions')).toBeInTheDocument();
		});

		it('should render upload area with drag and drop text', () => {
			render(ImportQuestions, { data: baseData });
			expect(screen.getByText(/drag and drop your file here/i)).toBeInTheDocument();
		});

		it('should render template download banner', () => {
			render(ImportQuestions, { data: baseData });
			expect(screen.getByText('Download the template to get started')).toBeInTheDocument();
		});

		it('should render download template button', () => {
			render(ImportQuestions, { data: baseData });
			expect(screen.getByRole('button', { name: /download template/i })).toBeInTheDocument();
		});
	});

	describe('File Input', () => {
		it('should have hidden CSV file input', () => {
			const { container } = render(ImportQuestions, { data: baseData });

			const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null;
			expect(fileInput).toBeTruthy();
			expect(fileInput?.hidden).toBe(true);
			expect(fileInput?.getAttribute('accept')).toContain('.csv');
		});

		it('should have download template link with correct filename', () => {
			render(ImportQuestions, { data: baseData });

			const downloadLink = screen.getByRole('link', { name: /download template/i });
			expect(downloadLink).toHaveAttribute('download', 'template.csv');
		});
	});

	describe('Import Button State', () => {
		it('should not show import button when no file is selected', () => {
			render(ImportQuestions, { data: baseData });

			const importBtn = screen.queryByRole('button', { name: /import/i });
			expect(importBtn).not.toBeInTheDocument();
		});

		it('should show import button when file is selected', () => {
			const file = new File(['hello'], 'questions.csv', { type: 'text/csv' });
			render(ImportQuestions, { data: { ...baseData, form: { file } } });

			const importBtn = screen.getByRole('button', { name: /import/i });
			expect(importBtn).toBeEnabled();
		});

		it('should display selected file name', () => {
			const file = new File(['hello'], 'questions.csv', { type: 'text/csv' });
			render(ImportQuestions, { data: { ...baseData, form: { file } } });

			expect(screen.getByText('questions.csv')).toBeInTheDocument();
		});
	});
});
