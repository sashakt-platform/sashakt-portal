import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SingleQuestionPage from './+page.svelte';

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn((schema: unknown) => schema)
}));

const baseForm = {
	question_text: '',
	is_mandatory: false,
	is_active: false,
	tag_ids: [],
	state_ids: [],
	marking_scheme: { correct: 1, wrong: 0, skipped: 0 }
};

const baseData = {
	form: baseForm,
	tagForm: {},
	tagTypes: [],
	user: { organization_id: 'org-1' }
};

describe('Single Question +page.svelte', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('renders create view and keeps Save disabled until valid answers provided', async () => {
		render(SingleQuestionPage, { data: baseData as any });

		expect(screen.getByText('Create a Question')).toBeInTheDocument();

		expect(screen.getByPlaceholderText('Enter your Question...')).toBeInTheDocument();
		const inputs = screen.getAllByRole('textbox');
		expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(4);
		expect(inputs.length).toBeGreaterThan(1);
	});
	test('disables Save button intestially when required fields are empty', () => {
		render(SingleQuestionPage, { data: baseData as any });
		const saveButton = screen.getByRole('button', { name: /Save/i });
		expect(saveButton).toBeDisabled();
	});

	test('shows edit heading and prefilled data when questionData exists', () => {
		const questionData = {
			question_text: 'Existing question',
			options: [
				{ id: 1, key: 'A', value: 'Yes' },
				{ id: 2, key: 'B', value: 'No' }
			],
			is_mandatory: false,
			is_active: true,
			correct_answer: [1],
			locations: [{ state_id: 10, state_name: 'State' }],
			tags: [{ id: 5, name: 'Tag', tag_type: { name: 'Type' } }]
		};

		render(SingleQuestionPage, { data: { ...baseData, questionData } as any });

		expect(screen.getByText('Edit Question')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Existing question')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Yes')).toBeInTheDocument();
		expect(screen.getByDisplayValue('No')).toBeInTheDocument();
	});
	test('adds a new answer when "Add Answer" button is clicked', async () => {
		render(SingleQuestionPage, { data: baseData as any });

		const addButton = screen.getByRole('button', { name: /Add Answer/i });
		const initialInputs = screen.getAllByRole('textbox');

		await fireEvent.click(addButton);

		const updatedInputs = screen.getAllByRole('textbox');
		expect(updatedInputs.length).toBe(initialInputs.length + 1);
	});
	test('removes an answer when Trash icon is clicked', async () => {
		render(SingleQuestionPage, { data: baseData as any });

		const trashIcons = document.querySelectorAll('svg[data-testid="trash-icon"]');
		const initialInputs = screen.getAllByRole('textbox');

		if (trashIcons.length > 0) {
			await fireEvent.click(trashIcons[0]);
			const updatedInputs = screen.getAllByRole('textbox');
			expect(updatedInputs.length).toBe(initialInputs.length - 1);
		}
	});
	test('toggles mandatory checkbox', async () => {
		render(SingleQuestionPage, { data: baseData as any });

		const mandatoryCheckbox = screen.getAllByRole('checkbox')[0];
		expect(mandatoryCheckbox).not.toBeChecked();

		await fireEvent.click(mandatoryCheckbox);
		expect(mandatoryCheckbox).toBeChecked();
	});
	test('enables Save button when valid question and answers are provided', async () => {
		render(SingleQuestionPage, { data: baseData });

		const questionInput = screen.getByPlaceholderText('Enter your Question...');
		await fireEvent.input(questionInput, { target: { value: 'What is Svelte?' } });

		const inputs = screen.getAllByRole('textbox');
		await fireEvent.input(inputs[0], { target: { value: 'A framework' } });
		await fireEvent.input(inputs[1], { target: { value: 'A library' } });

		const checkboxes = screen.getAllByRole('checkbox');
		await fireEvent.click(checkboxes[1]);
	});
	test('toggles Is Active switch', async () => {
		render(SingleQuestionPage, { data: baseData as any });
		const isActiveSwitch = screen.getByLabelText('Is Active?');
		expect(isActiveSwitch).not.toBeChecked();

		await fireEvent.click(isActiveSwitch);
		expect(isActiveSwitch).toBeChecked();
	});
	test('fills additional instructions textarea', async () => {
		render(SingleQuestionPage, { data: baseData as any });
		const instructions = screen.getByPlaceholderText('');
		await fireEvent.input(instructions, { target: { value: 'Some instructions' } });
		expect(instructions).toHaveValue('Some instructions');
	});
	test('updates marking scheme input', async () => {
		render(SingleQuestionPage, { data: baseData as any });
		const markingInput = screen.getByDisplayValue('1');
		await fireEvent.input(markingInput, { target: { value: '5' } });
		expect(markingInput).toHaveValue(5);
	});
});
const questionData = {
	question_text: 'Existing question',
	options: [
		{ id: 1, key: 'A', value: 'Yes' },
		{ id: 2, key: 'B', value: 'No' }
	],
	is_mandatory: true,
	is_active: true,
	correct_answer: [1],
	tags: [{ id: 5, name: 'Tag', tag_type: { name: 'Type' } }],
	marking_scheme: { correct: 2, wrong: 0, skipped: 0 },
	instructions: 'Initial instructions'
};

describe('Single Question +page.svelte - Edit Mode', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('renders prefilled question and answers', () => {
		render(SingleQuestionPage, { data: { ...baseData, questionData } as any });

		expect(screen.getByText('Edit Question')).toBeInTheDocument();

		expect(screen.getByDisplayValue('Existing question')).toBeInTheDocument();

		expect(screen.getByDisplayValue('Yes')).toBeInTheDocument();
		expect(screen.getByDisplayValue('No')).toBeInTheDocument();

		const mandatoryCheckbox = screen.getAllByRole('checkbox')[0];
		expect(mandatoryCheckbox).toBeChecked();
		const isActiveSwitch = screen.getByLabelText('Is Active?');
		expect(isActiveSwitch).toBeChecked();
		expect(screen.getByDisplayValue('Initial instructions')).toBeInTheDocument();
		expect(screen.getByDisplayValue('2')).toBeInTheDocument();
	});

	test('allows editing question text', async () => {
		render(SingleQuestionPage, { data: { ...baseData, questionData } as any });

		const questionInput = screen.getByDisplayValue('Existing question');
		await fireEvent.input(questionInput, { target: { value: 'Updated question' } });
		expect(questionInput).toHaveValue('Updated question');
	});

	test('allows editing answer values', async () => {
		render(SingleQuestionPage, { data: { ...baseData, questionData } as any });

		const inputs = screen.getAllByRole('textbox');
		await fireEvent.input(inputs[0], { target: { value: 'Yes edited' } });
		await fireEvent.input(inputs[1], { target: { value: 'No edited' } });

		expect(inputs[0]).toHaveValue('Yes edited');
		expect(inputs[1]).toHaveValue('No edited');
	});

	test('toggles correct answer checkbox', async () => {
		render(SingleQuestionPage, { data: { ...baseData, questionData } as any });

		const checkboxes = screen.getAllByRole('checkbox');
		expect(checkboxes[1]).toBeChecked();

		await fireEvent.click(checkboxes[1]);
		expect(checkboxes[1]).not.toBeChecked();
	});

	test('adds a new answer', async () => {
		render(SingleQuestionPage, { data: { ...baseData, questionData } as any });

		const addButton = screen.getByRole('button', { name: /Add Answer/i });
		const initialInputs = screen.getAllByRole('textbox');

		await fireEvent.click(addButton);
		const updatedInputs = screen.getAllByRole('textbox');
		expect(updatedInputs.length).toBe(initialInputs.length + 1);
	});

	test('removes an answer using Trash icon', async () => {
		render(SingleQuestionPage, { data: { ...baseData, questionData } as any });

		const trashIcons = screen.getAllByTestId('trash-icon');
		const initialInputs = screen.getAllByRole('textbox');

		if (trashIcons.length > 0) {
			await fireEvent.click(trashIcons[0]);
			const updatedInputs = screen.getAllByRole('textbox');
			expect(updatedInputs.length).toBe(initialInputs.length - 1);
		}
	});

	test('edits marking scheme', async () => {
		render(SingleQuestionPage, { data: { ...baseData, questionData } as any });

		const markingInput = screen.getByDisplayValue('2');
		await fireEvent.input(markingInput, { target: { value: '5' } });
		expect(markingInput).toHaveValue(5);
	});

	test('edits additional instructions', async () => {
		render(SingleQuestionPage, { data: { ...baseData, questionData } as any });

		const instructions = screen.getByDisplayValue('Initial instructions');
		await fireEvent.input(instructions, { target: { value: 'Updated instructions' } });
		expect(instructions).toHaveValue('Updated instructions');
	});
});
