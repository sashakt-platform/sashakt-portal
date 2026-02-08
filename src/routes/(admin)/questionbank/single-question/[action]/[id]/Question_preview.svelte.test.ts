import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import QuestionPreview from './Question_preview.svelte';

function createData(overrides = {}) {
	return {
		question_text: 'What is the capital of France?',
		options: [
			{ key: 'A', value: 'Berlin' },
			{ key: 'B', value: 'Paris' },
			{ key: 'C', value: 'Madrid' },
			{ key: 'D', value: 'Rome' }
		],
		instructions: 'Select the correct answer.',
		marking_scheme: { correct: 1, wrong: 0, skipped: 0 },
		is_mandatory: false,
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

		expect(screen.getByText('PREVIEW')).toBeInTheDocument();
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
			{ key: 'A', value: 'Option 1' },
			{ key: 'B', value: 'Option 2' },
			{ key: 'C', value: 'Option 3' }
		];
		render(QuestionPreview, {
			props: { data: createData({ options }) }
		});

		await openDialog();

		expect(screen.getByText('A.')).toBeInTheDocument();
		expect(screen.getByText('Option 1')).toBeInTheDocument();
		expect(screen.getByText('B.')).toBeInTheDocument();
		expect(screen.getByText('Option 2')).toBeInTheDocument();
		expect(screen.getByText('C.')).toBeInTheDocument();
		expect(screen.getByText('Option 3')).toBeInTheDocument();
	});

	it('filters out options with empty values', async () => {
		const options = [
			{ key: 'A', value: 'Valid option' },
			{ key: 'B', value: '' },
			{ key: 'C', value: '   ' }
		];
		render(QuestionPreview, {
			props: { data: createData({ options }) }
		});

		await openDialog();

		expect(screen.getByText('Valid option')).toBeInTheDocument();
		expect(screen.queryByText('B.')).not.toBeInTheDocument();
		expect(screen.queryByText('C.')).not.toBeInTheDocument();
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
					is_mandatory: undefined
				}
			}
		});

		await openDialog();

		expect(screen.getByText('Enter your question to see preview...')).toBeInTheDocument();
		expect(screen.getByText('Add options to see them in preview...')).toBeInTheDocument();
	});
});
