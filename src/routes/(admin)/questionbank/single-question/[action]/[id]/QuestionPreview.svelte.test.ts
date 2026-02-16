import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import QuestionPreview from './QuestionPreview.svelte';

function createData(overrides = {}) {
	return {
		question_text: 'What is the capital of France?',
		options: [
			{ key: 'A', value: 'Berlin', correct_answer: false },
			{ key: 'B', value: 'Paris', correct_answer: true },
			{ key: 'C', value: 'Madrid', correct_answer: false },
			{ key: 'D', value: 'Rome', correct_answer: false }
		],
		instructions: 'Select the correct answer.',
		marking_scheme: { correct: 1, wrong: 0, skipped: 0 },
		is_mandatory: false,
		question_type: 'single-choice',
		...overrides
	};
}

async function openDialog() {
	await fireEvent.click(screen.getByRole('button', { name: /preview/i }));
}

describe('Question_preview', () => {
	it('renders the Preview button', () => {
		render(QuestionPreview, { props: { data: createData() } });
		expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
	});

	it('opens dialog when Preview button is clicked', async () => {
		render(QuestionPreview, { props: { data: createData() } });

		await openDialog();

		expect(screen.getByRole('heading', { name: 'Preview' })).toBeInTheDocument();
	});

	it('displays question text in dialog', async () => {
		render(QuestionPreview, {
			props: { data: createData({ question_text: 'What is 2 + 2?' }) }
		});

		await openDialog();

		expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
	});

	it('shows placeholder when question text is empty', async () => {
		render(QuestionPreview, {
			props: { data: createData({ question_text: '' }) }
		});

		await openDialog();

		expect(screen.getByText('Enter your question to see preview...')).toBeInTheDocument();
	});

	it('shows mandatory asterisk when is_mandatory is true', async () => {
		render(QuestionPreview, {
			props: { data: createData({ is_mandatory: true }) }
		});

		await openDialog();

		expect(screen.getByText('*')).toBeInTheDocument();
	});

	it('does not show mandatory asterisk when is_mandatory is false', async () => {
		render(QuestionPreview, {
			props: { data: createData({ is_mandatory: false }) }
		});

		await openDialog();

		expect(screen.queryByText('*')).not.toBeInTheDocument();
	});

	it('displays instructions when provided', async () => {
		render(QuestionPreview, {
			props: { data: createData({ instructions: 'Choose wisely.' }) }
		});

		await openDialog();

		expect(screen.getByText('Choose wisely.')).toBeInTheDocument();
	});

	it('does not display instructions when empty', async () => {
		render(QuestionPreview, {
			props: { data: createData({ instructions: '' }) }
		});

		await openDialog();

		expect(screen.queryByText('Choose wisely.')).not.toBeInTheDocument();
	});

	it('displays all valid options', async () => {
		const options = [
			{ key: 'A', value: 'Option 1', correct_answer: false },
			{ key: 'B', value: 'Option 2', correct_answer: false },
			{ key: 'C', value: 'Option 3', correct_answer: true }
		];
		render(QuestionPreview, {
			props: { data: createData({ options }) }
		});

		await openDialog();

		expect(screen.getByText('A. Option 1')).toBeInTheDocument();
		expect(screen.getByText('B. Option 2')).toBeInTheDocument();
		expect(screen.getByText('C. Option 3')).toBeInTheDocument();
	});

	it('filters out options with empty values', async () => {
		const options = [
			{ key: 'A', value: 'Valid option', correct_answer: true },
			{ key: 'B', value: '', correct_answer: false },
			{ key: 'C', value: '   ', correct_answer: false }
		];
		render(QuestionPreview, {
			props: { data: createData({ options }) }
		});

		await openDialog();

		expect(screen.getByText('A. Valid option')).toBeInTheDocument();
		expect(screen.queryByText(/^B\./)).not.toBeInTheDocument();
		expect(screen.queryByText(/^C\./)).not.toBeInTheDocument();
	});

	it('shows placeholder when no valid options exist', async () => {
		render(QuestionPreview, {
			props: { data: createData({ options: [] }) }
		});

		await openDialog();

		expect(screen.getByText('Add options to see them in preview...')).toBeInTheDocument();
	});

	it('displays singular "MARK" for 1 mark', async () => {
		render(QuestionPreview, {
			props: { data: createData({ marking_scheme: { correct: 1, wrong: 0, skipped: 0 } }) }
		});

		await openDialog();

		expect(screen.getByText(/1\s+MARK$/)).toBeInTheDocument();
	});

	it('displays plural "MARKS" for multiple marks', async () => {
		render(QuestionPreview, {
			props: { data: createData({ marking_scheme: { correct: 3, wrong: -1, skipped: 0 } }) }
		});

		await openDialog();

		expect(screen.getByText(/3\s+MARKS/)).toBeInTheDocument();
	});

	it('uses default marking scheme when not provided', async () => {
		render(QuestionPreview, {
			props: {
				data: createData({
					marking_scheme: undefined
				})
			}
		});

		await openDialog();

		expect(screen.getByText(/1\s+MARK$/)).toBeInTheDocument();
	});

	it('handles undefined data fields gracefully', async () => {
		render(QuestionPreview, {
			props: {
				data: {
					question_text: undefined,
					options: undefined,
					instructions: undefined,
					marking_scheme: undefined,
					is_mandatory: undefined,
					question_type: undefined
				}
			}
		});

		await openDialog();

		expect(screen.getByText('Enter your question to see preview...')).toBeInTheDocument();
		expect(screen.getByText('Add options to see them in preview...')).toBeInTheDocument();
	});

	describe('Single-choice interaction', () => {
		it('renders radio buttons for single-choice questions', async () => {
			render(QuestionPreview, { props: { data: createData() } });
			await openDialog();

			expect(screen.getAllByRole('radio')).toHaveLength(4);
		});

		it('allows selecting a radio option', async () => {
			render(QuestionPreview, { props: { data: createData() } });
			await openDialog();

			const radios = screen.getAllByRole('radio');
			await fireEvent.click(radios[1]);

			expect(radios[1]).toBeChecked();
		});

		it('switches selection when a different radio is clicked', async () => {
			render(QuestionPreview, { props: { data: createData() } });
			await openDialog();

			const radios = screen.getAllByRole('radio');
			await fireEvent.click(radios[0]);
			expect(radios[0]).toBeChecked();

			await fireEvent.click(radios[2]);
			expect(radios[2]).toBeChecked();
			expect(radios[0]).not.toBeChecked();
		});
	});

	describe('Multi-choice interaction', () => {
		const multiChoiceOptions = [
			{ key: 'A', value: 'Berlin', correct_answer: true },
			{ key: 'B', value: 'Paris', correct_answer: true },
			{ key: 'C', value: 'Madrid', correct_answer: false },
			{ key: 'D', value: 'Rome', correct_answer: false }
		];

		it('renders checkboxes for multi-choice questions', async () => {
			render(QuestionPreview, {
				props: { data: createData({ options: multiChoiceOptions }) }
			});
			await openDialog();

			expect(screen.getAllByRole('checkbox')).toHaveLength(4);
		});

		it('allows selecting multiple checkboxes', async () => {
			render(QuestionPreview, {
				props: { data: createData({ options: multiChoiceOptions }) }
			});
			await openDialog();

			const checkboxes = screen.getAllByRole('checkbox');
			await fireEvent.click(checkboxes[0]);
			await fireEvent.click(checkboxes[1]);

			expect(checkboxes[0]).toBeChecked();
			expect(checkboxes[1]).toBeChecked();
		});

		it('allows deselecting a checkbox', async () => {
			render(QuestionPreview, {
				props: { data: createData({ options: multiChoiceOptions }) }
			});
			await openDialog();

			const checkboxes = screen.getAllByRole('checkbox');
			await fireEvent.click(checkboxes[0]);
			expect(checkboxes[0]).toBeChecked();

			await fireEvent.click(checkboxes[0]);
			expect(checkboxes[0]).not.toBeChecked();
		});
	});

	describe('Subjective interaction', () => {
		it('renders a textarea for subjective questions', async () => {
			render(QuestionPreview, {
				props: { data: createData({ question_type: 'subjective' }) }
			});
			await openDialog();

			expect(screen.getByPlaceholderText('Type your answer here...')).toBeInTheDocument();
		});

		it('allows typing in the textarea', async () => {
			render(QuestionPreview, {
				props: { data: createData({ question_type: 'subjective' }) }
			});
			await openDialog();

			const textarea = screen.getByPlaceholderText('Type your answer here...');
			await fireEvent.input(textarea, { target: { value: 'My answer' } });

			expect(textarea).toHaveValue('My answer');
		});

		it('does not render option cards for subjective questions', async () => {
			render(QuestionPreview, {
				props: { data: createData({ question_type: 'subjective' }) }
			});
			await openDialog();

			expect(screen.queryByText('A. Berlin')).not.toBeInTheDocument();
			expect(screen.queryByText(/^A\./)).not.toBeInTheDocument();
		});
	});

	describe('Reset on dialog close', () => {
		it('clears single-choice selection when dialog closes and reopens', async () => {
			render(QuestionPreview, { props: { data: createData() } });
			await openDialog();

			const radios = screen.getAllByRole('radio');
			await fireEvent.click(radios[1]);
			expect(radios[1]).toBeChecked();

			const closeButton = screen.getByRole('button', { name: /close/i });
			await fireEvent.click(closeButton);

			await openDialog();

			const newRadios = screen.getAllByRole('radio');
			newRadios.forEach((radio) => {
				expect(radio).not.toBeChecked();
			});
		});

		it('clears multi-choice selections when dialog closes and reopens', async () => {
			const multiChoiceOptions = [
				{ key: 'A', value: 'Berlin', correct_answer: true },
				{ key: 'B', value: 'Paris', correct_answer: true },
				{ key: 'C', value: 'Madrid', correct_answer: false }
			];
			render(QuestionPreview, {
				props: { data: createData({ options: multiChoiceOptions }) }
			});
			await openDialog();

			const checkboxes = screen.getAllByRole('checkbox');
			await fireEvent.click(checkboxes[0]);
			await fireEvent.click(checkboxes[1]);

			const closeButton = screen.getByRole('button', { name: /close/i });
			await fireEvent.click(closeButton);

			await openDialog();

			const newCheckboxes = screen.getAllByRole('checkbox');
			newCheckboxes.forEach((cb) => {
				expect(cb).not.toBeChecked();
			});
		});

		it('clears subjective answer when dialog closes and reopens', async () => {
			render(QuestionPreview, {
				props: { data: createData({ question_type: 'subjective' }) }
			});
			await openDialog();

			const textarea = screen.getByPlaceholderText('Type your answer here...');
			await fireEvent.input(textarea, { target: { value: 'Some answer' } });

			const closeButton = screen.getByRole('button', { name: /close/i });
			await fireEvent.click(closeButton);

			await openDialog();

			const newTextarea = screen.getByPlaceholderText('Type your answer here...');
			expect(newTextarea).toHaveValue('');
		});
	});
});
