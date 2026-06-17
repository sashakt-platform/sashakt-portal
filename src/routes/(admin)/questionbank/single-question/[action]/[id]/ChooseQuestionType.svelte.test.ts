import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import ChooseQuestionType from './ChooseQuestionType.svelte';
import { QuestionTypeEnum } from '$lib/types/question';

function renderOpen(onSelect = vi.fn()) {
	return render(ChooseQuestionType, { props: { open: true, onSelect } });
}

describe('ChooseQuestionType', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Dialog visibility', () => {
		it('does not render dialog content when open is false', () => {
			render(ChooseQuestionType, { props: { open: false, onSelect: vi.fn() } });
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('renders dialog content when open is true', async () => {
			renderOpen();
			expect(await screen.findByRole('dialog')).toBeInTheDocument();
		});

		it('shows "Choose Question Type" as the dialog title', async () => {
			renderOpen();
			const dialog = await screen.findByRole('dialog');
			expect(within(dialog).getByText('Choose Question Type')).toBeInTheDocument();
		});
	});

	describe('Section labels', () => {
		it('shows the "Commonly Used" section label', async () => {
			renderOpen();
			await screen.findByRole('dialog');
			expect(screen.getByText('Commonly Used')).toBeInTheDocument();
		});

		it('shows the "Advanced" section label', async () => {
			renderOpen();
			await screen.findByRole('dialog');
			expect(screen.getByText('Advanced')).toBeInTheDocument();
		});
	});

	describe('Commonly Used question types', () => {
		it('renders the Single/Multiple Choice button', async () => {
			renderOpen();
			await screen.findByRole('dialog');
			expect(screen.getByRole('button', { name: /single\/multiple choice/i })).toBeInTheDocument();
		});

		it('renders the Subjective button', async () => {
			renderOpen();
			await screen.findByRole('dialog');
			expect(screen.getByRole('button', { name: /subjective/i })).toBeInTheDocument();
		});

		it('renders the Numerical button', async () => {
			renderOpen();
			await screen.findByRole('dialog');
			expect(screen.getByRole('button', { name: /numerical/i })).toBeInTheDocument();
		});

		it('renders exactly 3 buttons in the Commonly Used section', async () => {
			renderOpen();
			const dialog = await screen.findByRole('dialog');
			const commonSection = within(dialog)
				.getByText('Commonly Used')
				.closest('div') as HTMLElement;
			expect(within(commonSection).getAllByRole('button')).toHaveLength(3);
		});
	});

	describe('Advanced question types', () => {
		it('renders the Matrix Text button', async () => {
			renderOpen();
			await screen.findByRole('dialog');
			expect(screen.getByRole('button', { name: /matrix text/i })).toBeInTheDocument();
		});

		it('renders the Matrix Number button', async () => {
			renderOpen();
			await screen.findByRole('dialog');
			expect(screen.getByRole('button', { name: /matrix number/i })).toBeInTheDocument();
		});

		it('renders the Matrix Match button', async () => {
			renderOpen();
			await screen.findByRole('dialog');
			expect(screen.getByRole('button', { name: /matrix match/i })).toBeInTheDocument();
		});

		it('renders the Matrix Rating button', async () => {
			renderOpen();
			await screen.findByRole('dialog');
			expect(screen.getByRole('button', { name: /matrix rating/i })).toBeInTheDocument();
		});

		it('renders exactly 4 buttons in the Advanced section', async () => {
			renderOpen();
			const dialog = await screen.findByRole('dialog');
			const advancedSection = within(dialog).getByText('Advanced').closest('div') as HTMLElement;
			expect(within(advancedSection).getAllByRole('button')).toHaveLength(4);
		});
	});

	describe('Total buttons rendered', () => {
		it('renders 8 buttons in total (3 common + 4 advanced + 1 dialog close)', async () => {
			renderOpen();
			const dialog = await screen.findByRole('dialog');
			expect(within(dialog).getAllByRole('button')).toHaveLength(8);
		});
	});

	describe('onSelect callback', () => {
		it('calls onSelect with SingleChoice when Single/Multiple Choice is clicked', async () => {
			const onSelect = vi.fn();
			renderOpen(onSelect);
			await screen.findByRole('dialog');
			await fireEvent.click(screen.getByRole('button', { name: /single\/multiple choice/i }));
			expect(onSelect).toHaveBeenCalledWith(QuestionTypeEnum.SingleChoice);
		});

		it('calls onSelect with Subjective when Subjective is clicked', async () => {
			const onSelect = vi.fn();
			renderOpen(onSelect);
			await screen.findByRole('dialog');
			await fireEvent.click(screen.getByRole('button', { name: /subjective/i }));
			expect(onSelect).toHaveBeenCalledWith(QuestionTypeEnum.Subjective);
		});

		it('calls onSelect with NumericalInteger when Numerical is clicked', async () => {
			const onSelect = vi.fn();
			renderOpen(onSelect);
			await screen.findByRole('dialog');
			await fireEvent.click(screen.getByRole('button', { name: /numerical/i }));
			expect(onSelect).toHaveBeenCalledWith(QuestionTypeEnum.NumericalInteger);
		});

		it('calls onSelect with MatrixString when Matrix Text is clicked', async () => {
			const onSelect = vi.fn();
			renderOpen(onSelect);
			await screen.findByRole('dialog');
			await fireEvent.click(screen.getByRole('button', { name: /matrix text/i }));
			expect(onSelect).toHaveBeenCalledWith(QuestionTypeEnum.MatrixString);
		});

		it('calls onSelect with MatrixNumber when Matrix Number is clicked', async () => {
			const onSelect = vi.fn();
			renderOpen(onSelect);
			await screen.findByRole('dialog');
			await fireEvent.click(screen.getByRole('button', { name: /matrix number/i }));
			expect(onSelect).toHaveBeenCalledWith(QuestionTypeEnum.MatrixNumber);
		});

		it('calls onSelect with MatrixMatch when Matrix Match is clicked', async () => {
			const onSelect = vi.fn();
			renderOpen(onSelect);
			await screen.findByRole('dialog');
			await fireEvent.click(screen.getByRole('button', { name: /matrix match/i }));
			expect(onSelect).toHaveBeenCalledWith(QuestionTypeEnum.MatrixMatch);
		});

		it('calls onSelect with MatrixRating when Matrix Rating is clicked', async () => {
			const onSelect = vi.fn();
			renderOpen(onSelect);
			await screen.findByRole('dialog');
			await fireEvent.click(screen.getByRole('button', { name: /matrix rating/i }));
			expect(onSelect).toHaveBeenCalledWith(QuestionTypeEnum.MatrixRating);
		});

		it('calls onSelect exactly once per click', async () => {
			const onSelect = vi.fn();
			renderOpen(onSelect);
			await screen.findByRole('dialog');
			await fireEvent.click(screen.getByRole('button', { name: /subjective/i }));
			expect(onSelect).toHaveBeenCalledOnce();
		});
	});

	describe('Dialog closes after selection', () => {
		it('closes the dialog after a type is selected', async () => {
			renderOpen();
			await screen.findByRole('dialog');
			await fireEvent.click(screen.getByRole('button', { name: /subjective/i }));
			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});
		});

		it('closes for any question type selection', async () => {
			renderOpen();
			await screen.findByRole('dialog');
			await fireEvent.click(screen.getByRole('button', { name: /matrix match/i }));
			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});
		});
	});
});
