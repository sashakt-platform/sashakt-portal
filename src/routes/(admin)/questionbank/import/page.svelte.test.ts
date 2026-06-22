import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { writable } from 'svelte/store';
import ImportQuestions from './+page.svelte';
import { setCustomNomenclature, resetNomenclature } from '$lib/test-utils/nomenclature-mock';

type MessageData = Record<string, unknown> | undefined;

let capturedOnSubmit: (() => void) | undefined;
let capturedOnUpdated: (() => void) | undefined;
let formMessageStore = writable<MessageData>(undefined);

const mockSubmit = vi.fn(() => capturedOnSubmit?.());

vi.mock('$lib/nomenclature', async () => {
	const { createNomenclatureMock } = await import('$lib/test-utils/nomenclature-mock');
	return createNomenclatureMock();
});

vi.mock('sveltekit-superforms', () => ({
	fileProxy: () => ({
		set: () => {},
		update: () => {},
		subscribe: (fn: (v: unknown) => void) => {
			fn(undefined);
			return () => {};
		}
	}),
	superForm: (initialData: Record<string, unknown>, options?: Record<string, unknown>) => {
		capturedOnSubmit = options?.onSubmit as (() => void) | undefined;
		capturedOnUpdated = options?.onUpdated as (() => void) | undefined;
		return {
			form: writable(initialData),
			message: formMessageStore,
			enhance: () => () => {},
			submit: mockSubmit
		};
	}
}));

const csvFile = new File(['col1,col2\nval1,val2'], 'questions.csv', { type: 'text/csv' });

const baseData = { form: { file: null }, user: { id: 1, permissions: ['create_question'] } } as any;
const dataWithFile = { ...baseData, form: { file: csvFile } } as any;

describe('Import Questions Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		capturedOnSubmit = undefined;
		capturedOnUpdated = undefined;
		formMessageStore = writable<MessageData>(undefined);
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

	describe('Processing Screen', () => {
		async function triggerProcessing() {
			render(ImportQuestions, { data: dataWithFile });
			await fireEvent.click(screen.getByRole('button', { name: /import/i }));
			await tick();
		}

		it('shows the processing screen after clicking import', async () => {
			await triggerProcessing();
			expect(screen.getByText('Processing your file...')).toBeInTheDocument();
		});

		it('shows the correct subtext', async () => {
			await triggerProcessing();
			expect(screen.getByText(/validating and importing your questions/i)).toBeInTheDocument();
		});

		it('shows a spinner', async () => {
			const { container } = render(ImportQuestions, { data: dataWithFile });
			await fireEvent.click(screen.getByRole('button', { name: /import/i }));
			await tick();
			expect(container.querySelector('.animate-spin')).toBeInTheDocument();
		});

		it('shows the file name in the chip', async () => {
			await triggerProcessing();
			expect(screen.getAllByText('questions.csv').length).toBeGreaterThan(0);
		});

		it('shows the formatted file size in the chip', async () => {
			await triggerProcessing();
			const expectedSize = `${(csvFile.size / 1024).toFixed(2)} KB`;
			expect(screen.getByText(`(${expectedSize})`)).toBeInTheDocument();
		});

		it('hides the import and discard buttons while processing', async () => {
			await triggerProcessing();
			expect(screen.queryByRole('button', { name: /discard/i })).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /import/i })).not.toBeInTheDocument();
		});

		it('hides the empty dropzone while processing', async () => {
			await triggerProcessing();
			expect(screen.queryByText(/drag and drop your file here/i)).not.toBeInTheDocument();
		});

		it('transitions to success screen after upload completes', async () => {
			await triggerProcessing();
			formMessageStore.set({
				message: 'Done.',
				uploaded_questions: 10,
				success_questions: 10,
				failed_questions: 0
			});
			capturedOnUpdated?.();
			await tick();
			expect(screen.getByText('File upload successful')).toBeInTheDocument();
			expect(screen.queryByText('Processing your file...')).not.toBeInTheDocument();
		});

		it('transitions to error screen when upload has failures', async () => {
			await triggerProcessing();
			formMessageStore.set({
				message: 'Done.',
				uploaded_questions: 10,
				success_questions: 7,
				failed_questions: 3
			});
			capturedOnUpdated?.();
			await tick();
			expect(screen.getByText('File upload error')).toBeInTheDocument();
			expect(screen.queryByText('Processing your file...')).not.toBeInTheDocument();
		});

		it('shows upload summary totals after completion', async () => {
			await triggerProcessing();
			formMessageStore.set({
				message: 'Done.',
				uploaded_questions: 10,
				success_questions: 8,
				failed_questions: 2
			});
			capturedOnUpdated?.();
			await tick();
			expect(screen.getByText('10')).toBeInTheDocument();
			expect(screen.getByText('8')).toBeInTheDocument();
			expect(screen.getByText('2')).toBeInTheDocument();
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Custom nomenclature labels', () => {
		beforeEach(() => {
			resetNomenclature();
		});

		async function uploadAndComplete() {
			render(ImportQuestions, { data: dataWithFile });
			await fireEvent.click(screen.getByRole('button', { name: /import/i }));
			await tick();
			formMessageStore.set({
				message: 'Done.',
				uploaded_questions: 10,
				success_questions: 10,
				failed_questions: 0
			});
			capturedOnUpdated?.();
			await tick();
		}

		it('renders custom "Go to" button label when question_bank is overridden', async () => {
			setCustomNomenclature({ question_bank: 'Knowledge Base' });
			await uploadAndComplete();
			expect(screen.getByText('Go to Knowledge Base')).toBeInTheDocument();
			expect(screen.queryByText('Go to Question Bank')).not.toBeInTheDocument();
		});

		it('renders default "Go to Question Bank" when no custom nomenclature is set', async () => {
			await uploadAndComplete();
			expect(screen.getByText('Go to Question Bank')).toBeInTheDocument();
		});
	});
});
