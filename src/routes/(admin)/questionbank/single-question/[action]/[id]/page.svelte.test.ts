import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SingleQuestionPage from './+page.svelte';
import { QuestionTypeEnum } from './schema';

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4Client: vi.fn((schema: unknown) => schema)
}));

const baseForm = {
	question_text: '',
	is_mandatory: false,
	is_active: false,
	tag_ids: [],
	state_ids: [],
	marking_scheme: { correct: 1, wrong: 0, skipped: 0 },
	question_type: QuestionTypeEnum.SingleChoice
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
				question_type: QuestionTypeEnum.SingleChoice,
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
		question_type: QuestionTypeEnum.SingleChoice,
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

describe('Single Question Page - Question Type Selection', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Question Type Dropdown', () => {
		it('should render question type dropdown with label', () => {
			render(SingleQuestionPage, { data: baseData as any });
			expect(screen.getByText('Question Type')).toBeInTheDocument();
		});

		it('should show Single Choice as default selected type', () => {
			render(SingleQuestionPage, { data: baseData as any });
			expect(screen.getByText('Single/Multiple Choice')).toBeInTheDocument();
		});

		it('should show answer options for Single Choice type', () => {
			render(SingleQuestionPage, { data: baseData as any });

			expect(screen.getByText('Answer')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /Add Answer/i })).toBeInTheDocument();
		});
	});
});

describe('Single Question Page - Subjective Question Type', () => {
	const subjectiveQuestionData = {
		question_text: 'Explain the concept of recursion',
		question_type: QuestionTypeEnum.Subjective,
		options: [],
		correct_answer: [],
		is_mandatory: false,
		is_active: true,
		subjective_answer_limit: 50,
		marking_scheme: { correct: 5, wrong: 0, skipped: 0 },
		instructions: 'Write in detail'
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Subjective Question UI', () => {
		it('should show Answer Settings section for subjective questions', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: subjectiveQuestionData } as any
			});

			expect(screen.getByText('Answer Settings')).toBeInTheDocument();
		});

		it('should hide Answers section for subjective questions', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: subjectiveQuestionData } as any
			});

			expect(screen.queryByText('Answer')).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /Add Answer/i })).not.toBeInTheDocument();
		});

		it('should show character limit input for subjective questions', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: subjectiveQuestionData } as any
			});

			expect(screen.getByText('Maximum character limit')).toBeInTheDocument();
			expect(screen.getByText('characters')).toBeInTheDocument();
		});

		it('should display prefilled character limit value', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: subjectiveQuestionData } as any
			});

			const limitInput = screen.getByPlaceholderText('e.g., 500');
			expect(limitInput).toHaveValue(50);
		});

		it('should show helper text for character limit', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: subjectiveQuestionData } as any
			});

			expect(screen.getByText(/Leave empty for unlimited/i)).toBeInTheDocument();
		});
	});

	describe('Subjective Question Save Button', () => {
		it('should enable Save button for subjective question with only question text', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: subjectiveQuestionData } as any
			});

			const saveButton = screen.getByRole('button', { name: /Save/i });
			expect(saveButton).toBeEnabled();
		});

		it('should disable Save button when question text is empty for subjective', async () => {
			const emptySubjectiveData = {
				...subjectiveQuestionData,
				question_text: ''
			};

			render(SingleQuestionPage, {
				data: { ...baseData, questionData: emptySubjectiveData } as any
			});

			const saveButton = screen.getByRole('button', { name: /Save/i });
			expect(saveButton).toBeDisabled();
		});
	});

	describe('Subjective Question Editing', () => {
		it('should allow editing question text', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: subjectiveQuestionData } as any
			});

			const questionInput = screen.getByDisplayValue('Explain the concept of recursion');
			await fireEvent.input(questionInput, { target: { value: 'Updated subjective question' } });
			expect(questionInput).toHaveValue('Updated subjective question');
		});

		it('should allow editing character limit', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: subjectiveQuestionData } as any
			});

			const limitInput = screen.getByPlaceholderText('e.g., 500');
			await fireEvent.input(limitInput, { target: { value: '1000' } });
			expect(limitInput).toHaveValue(1000);
		});

		it('should allow clearing character limit for unlimited', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: subjectiveQuestionData } as any
			});

			const limitInput = screen.getByPlaceholderText('e.g., 500');
			await fireEvent.input(limitInput, { target: { value: '' } });
			expect(limitInput).toHaveValue(null);
		});

		it('should display prefilled instructions for subjective question', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: subjectiveQuestionData } as any
			});

			expect(screen.getByDisplayValue('Write in detail')).toBeInTheDocument();
		});

		it('should display prefilled marking scheme for subjective question', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: subjectiveQuestionData } as any
			});

			expect(screen.getByDisplayValue('5')).toBeInTheDocument();
		});
	});
});

describe('Single Question Page - Multi Choice Question Type', () => {
	const multiChoiceQuestionData = {
		question_text: 'Select all correct answers',
		question_type: QuestionTypeEnum.MultiChoice,
		options: [
			{ id: 1, key: 'A', value: 'Option 1' },
			{ id: 2, key: 'B', value: 'Option 2' },
			{ id: 3, key: 'C', value: 'Option 3' }
		],
		correct_answer: [1, 2],
		is_mandatory: false,
		is_active: true,
		marking_scheme: { correct: 2, wrong: 0, skipped: 0 }
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Multi Choice Question UI', () => {
		it('should show Answers section for multi choice questions', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceQuestionData } as any
			});

			expect(screen.getByText('Answer')).toBeInTheDocument();
		});

		it('should hide Answer Settings section for multi choice questions', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceQuestionData } as any
			});

			expect(screen.queryByText('Answer Settings')).not.toBeInTheDocument();
			expect(screen.queryByText('Maximum character limit')).not.toBeInTheDocument();
		});

		it('should display all prefilled options', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceQuestionData } as any
			});

			expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument();
			expect(screen.getByDisplayValue('Option 2')).toBeInTheDocument();
			expect(screen.getByDisplayValue('Option 3')).toBeInTheDocument();
		});
	});
});

describe('Single Question Page - Numerical Integer Question Type', () => {
	const numericalIntegerData = {
		question_text: 'What is 6 × 7?',
		question_type: QuestionTypeEnum.NumericalInteger,
		options: [],
		correct_answer: 42,
		is_mandatory: false,
		is_active: true,
		marking_scheme: { correct: 1, wrong: 0, skipped: 0 }
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Numerical Integer UI', () => {
		it('should show Correct Answer section', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalIntegerData } as any
			});

			expect(screen.getByText('Correct Answer')).toBeInTheDocument();
		});

		it('should hide Answer section and Add Answer button', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalIntegerData } as any
			});

			expect(screen.queryByText('Answer')).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /Add Answer/i })).not.toBeInTheDocument();
		});

		it('should hide Answer Settings section', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalIntegerData } as any
			});

			expect(screen.queryByText('Answer Settings')).not.toBeInTheDocument();
		});

		it('should render number input with step="1"', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalIntegerData } as any
			});

			const spinbuttons = screen.getAllByRole('spinbutton');
			const answerInput = spinbuttons.find((el) => el.getAttribute('step') === '1');
			expect(answerInput).toBeDefined();
			expect(answerInput).toHaveAttribute('step', '1');
		});

		it('should display prefilled integer answer', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalIntegerData } as any
			});

			expect(screen.getByDisplayValue('42')).toBeInTheDocument();
		});
	});

	describe('Numerical Integer Save Button', () => {
		it('should disable Save button when no correct answer is provided', () => {
			render(SingleQuestionPage, {
				data: {
					...baseData,
					questionData: { ...numericalIntegerData, correct_answer: [] }
				} as any
			});

			const saveButton = screen.getByRole('button', { name: /Save/i });
			expect(saveButton).toBeDisabled();
		});

		it('should enable Save button when integer answer is provided', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalIntegerData } as any
			});

			const saveButton = screen.getByRole('button', { name: /Save/i });
			expect(saveButton).toBeEnabled();
		});
	});

	describe('Numerical Integer Editing', () => {
		it('should allow editing the integer answer', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalIntegerData } as any
			});

			const input = screen.getByDisplayValue('42');
			await fireEvent.input(input, { target: { value: '100' } });
			expect(input).toHaveValue(100);
		});
	});
});

describe('Single Question Page - Numerical Decimal Question Type', () => {
	const numericalDecimalData = {
		question_text: 'What is π approximately?',
		question_type: QuestionTypeEnum.NumericalDecimal,
		options: [],
		correct_answer: 3.14,
		is_mandatory: false,
		is_active: true,
		marking_scheme: { correct: 1, wrong: 0, skipped: 0 }
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Numerical Decimal UI', () => {
		it('should show Correct Answer section', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalDecimalData } as any
			});

			expect(screen.getByText('Correct Answer')).toBeInTheDocument();
		});

		it('should hide Answer section and Add Answer button', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalDecimalData } as any
			});

			expect(screen.queryByText('Answer')).not.toBeInTheDocument();
			expect(screen.queryByRole('button', { name: /Add Answer/i })).not.toBeInTheDocument();
		});

		it('should render number input with step="any"', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalDecimalData } as any
			});

			const spinbuttons = screen.getAllByRole('spinbutton');
			const answerInput = spinbuttons.find((el) => el.getAttribute('step') === 'any');
			expect(answerInput).toBeDefined();
			expect(answerInput).toHaveAttribute('step', 'any');
		});

		it('should display prefilled decimal answer', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalDecimalData } as any
			});

			expect(screen.getByDisplayValue('3.14')).toBeInTheDocument();
		});
	});

	describe('Numerical Decimal Save Button', () => {
		it('should disable Save button when no correct answer is provided', () => {
			render(SingleQuestionPage, {
				data: {
					...baseData,
					questionData: { ...numericalDecimalData, correct_answer: [] }
				} as any
			});

			const saveButton = screen.getByRole('button', { name: /Save/i });
			expect(saveButton).toBeDisabled();
		});

		it('should enable Save button when decimal answer is provided', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalDecimalData } as any
			});

			const saveButton = screen.getByRole('button', { name: /Save/i });
			expect(saveButton).toBeEnabled();
		});
	});

	describe('Numerical Decimal Editing', () => {
		it('should allow editing the decimal answer', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalDecimalData } as any
			});

			const input = screen.getByDisplayValue('3.14');
			await fireEvent.input(input, { target: { value: '2.718' } });
			expect(input).toHaveValue(2.718);
		});
	});
});
