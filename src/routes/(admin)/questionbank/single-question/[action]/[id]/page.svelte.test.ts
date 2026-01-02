import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('Single Question Page - Create Mode', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render create view heading', () => {
			render(SingleQuestionPage, { data: baseData as any });
			expect(screen.getByText('Create a Question')).toBeInTheDocument();
		});

		it('should render question textarea', () => {
			render(SingleQuestionPage, { data: baseData as any });
			expect(screen.getByPlaceholderText('Enter your Question...')).toBeInTheDocument();
		});

		it('should render at least 4 answer inputs', () => {
			render(SingleQuestionPage, { data: baseData as any });

			const inputs = screen.getAllByRole('textbox');
			expect(inputs.length).toBeGreaterThanOrEqual(4);
		});
	});

	describe('Save Button State', () => {
		it('should disable Save button initially when required fields are empty', () => {
			render(SingleQuestionPage, { data: baseData as any });

			const saveButton = screen.getByRole('button', { name: /Save/i });
			expect(saveButton).toBeDisabled();
		});

		it('should enable Save button when valid question and answers are provided', async () => {
			render(SingleQuestionPage, { data: baseData });

			const questionInput = screen.getByPlaceholderText('Enter your Question...');
			await fireEvent.input(questionInput, { target: { value: 'What is Svelte?' } });

			const inputs = screen.getAllByRole('textbox');
			await fireEvent.input(inputs[1], { target: { value: 'A framework' } });
			await fireEvent.input(inputs[2], { target: { value: 'A library' } });

			const checkboxes = screen.getAllByRole('checkbox');
			await fireEvent.click(checkboxes[1]);

			const saveButton = screen.getByRole('button', { name: /Save/i });
			expect(saveButton).toBeEnabled();
		});
	});

	describe('Answer Management', () => {
		it('should add a new answer when "Add Answer" button is clicked', async () => {
			render(SingleQuestionPage, { data: baseData as any });

			const addButton = screen.getByRole('button', { name: /Add Answer/i });
			const initialInputs = screen.getAllByRole('textbox');

			await fireEvent.click(addButton);

			const updatedInputs = screen.getAllByRole('textbox');
			expect(updatedInputs.length).toBe(initialInputs.length + 1);
		});

		it('should remove an answer when Trash icon is clicked', async () => {
			render(SingleQuestionPage, { data: baseData as any });

			const trashIcons = screen.getAllByTestId('trash-icon');
			const initialInputs = screen.getAllByRole('textbox');

			await fireEvent.click(trashIcons[0]);

			const updatedInputs = screen.getAllByRole('textbox');
			expect(updatedInputs.length).toBe(initialInputs.length - 1);
		});
	});

	describe('Form Controls', () => {
		it('should toggle mandatory checkbox', async () => {
			render(SingleQuestionPage, { data: baseData as any });

			const mandatoryCheckbox = screen.getAllByRole('checkbox')[0];
			expect(mandatoryCheckbox).not.toBeChecked();

			await fireEvent.click(mandatoryCheckbox);
			expect(mandatoryCheckbox).toBeChecked();
		});

		it('should toggle Is Active switch', async () => {
			render(SingleQuestionPage, { data: baseData as any });

			const isActiveSwitch = screen.getByLabelText('Is Active?');
			expect(isActiveSwitch).not.toBeChecked();

			await fireEvent.click(isActiveSwitch);
			expect(isActiveSwitch).toBeChecked();
		});

		it('should fill additional instructions textarea', async () => {
			render(SingleQuestionPage, { data: baseData as any });

			const instructions = screen.getByPlaceholderText('');
			await fireEvent.input(instructions, { target: { value: 'Some instructions' } });
			expect(instructions).toHaveValue('Some instructions');
		});

		it('should update marking scheme input', async () => {
			render(SingleQuestionPage, { data: baseData as any });

			const markingInput = screen.getByDisplayValue('1');
			await fireEvent.input(markingInput, { target: { value: '5' } });
			expect(markingInput).toHaveValue(5);
		});
	});

	describe('Edit Mode Detection', () => {
		it('should show edit heading and prefilled data when questionData exists', () => {
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
	});
});

describe('Single Question Page - Edit Mode', () => {
	const editQuestionData = {
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

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Prefilled Data', () => {
		it('should render edit heading', () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });
			expect(screen.getByText('Edit Question')).toBeInTheDocument();
		});

		it('should display prefilled question text', () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });
			expect(screen.getByDisplayValue('Existing question')).toBeInTheDocument();
		});

		it('should display prefilled answer options', () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });

			expect(screen.getByDisplayValue('Yes')).toBeInTheDocument();
			expect(screen.getByDisplayValue('No')).toBeInTheDocument();
		});

		it('should show mandatory checkbox as checked', () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });

			const mandatoryCheckbox = screen.getAllByRole('checkbox')[0];
			expect(mandatoryCheckbox).toBeChecked();
		});

		it('should show Is Active switch as checked', () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });

			const isActiveSwitch = screen.getByLabelText('Is Active?');
			expect(isActiveSwitch).toBeChecked();
		});

		it('should display prefilled instructions', () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });
			expect(screen.getByDisplayValue('Initial instructions')).toBeInTheDocument();
		});

		it('should display prefilled marking scheme', () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });
			expect(screen.getByDisplayValue('2')).toBeInTheDocument();
		});
	});

	describe('Editing Question', () => {
		it('should allow editing question text', async () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });

			const questionInput = screen.getByDisplayValue('Existing question');
			await fireEvent.input(questionInput, { target: { value: 'Updated question' } });
			expect(questionInput).toHaveValue('Updated question');
		});

		it('should allow editing answer values', async () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });

			const inputs = screen.getAllByRole('textbox');
			await fireEvent.input(inputs[0], { target: { value: 'Yes edited' } });
			await fireEvent.input(inputs[1], { target: { value: 'No edited' } });

			expect(inputs[0]).toHaveValue('Yes edited');
			expect(inputs[1]).toHaveValue('No edited');
		});

		it('should toggle correct answer checkbox', async () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });

			const checkboxes = screen.getAllByRole('checkbox');
			expect(checkboxes[1]).toBeChecked();

			await fireEvent.click(checkboxes[1]);
			expect(checkboxes[1]).not.toBeChecked();
		});

		it('should edit marking scheme', async () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });

			const markingInput = screen.getByDisplayValue('2');
			await fireEvent.input(markingInput, { target: { value: '5' } });
			expect(markingInput).toHaveValue(5);
		});

		it('should edit additional instructions', async () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });

			const instructions = screen.getByDisplayValue('Initial instructions');
			await fireEvent.input(instructions, { target: { value: 'Updated instructions' } });
			expect(instructions).toHaveValue('Updated instructions');
		});
	});

	describe('Answer Management in Edit Mode', () => {
		it('should add a new answer', async () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });

			const addButton = screen.getByRole('button', { name: /Add Answer/i });
			const initialInputs = screen.getAllByRole('textbox');

			await fireEvent.click(addButton);

			const updatedInputs = screen.getAllByRole('textbox');
			expect(updatedInputs.length).toBe(initialInputs.length + 1);
		});

		it('should remove an answer using Trash icon', async () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: editQuestionData } as any });

			const trashIcons = screen.getAllByTestId('trash-icon');
			expect(trashIcons.length).toBeGreaterThan(0);

			const initialInputs = screen.getAllByRole('textbox');
			await fireEvent.click(trashIcons[0]);

			const updatedInputs = screen.getAllByRole('textbox');
			expect(updatedInputs.length).toBe(initialInputs.length - 1);
		});
	});
});
