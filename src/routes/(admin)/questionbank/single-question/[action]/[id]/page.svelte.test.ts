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

			// Find answer option inputs by their name attribute (A, B, C, D)
			const optionInputs = screen
				.getAllByRole('textbox')
				.filter((el) => /^[A-Z]$/.test(el.getAttribute('name') || ''));
			await fireEvent.input(optionInputs[0], { target: { value: 'A framework' } });
			await fireEvent.input(optionInputs[1], { target: { value: 'A library' } });

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

describe('Single Question Page - Marking Type Selection', () => {
	const singleChoiceData = {
		question_text: 'What is 2+2?',
		options: [
			{ id: 1, key: 'A', value: 'Three' },
			{ id: 2, key: 'B', value: 'Four' }
		],
		correct_answer: [2],
		is_mandatory: false,
		is_active: true,
		marking_scheme: { correct: 1, wrong: 0, skipped: 0 }
	};

	const multiChoiceWithPartialData = {
		question_text: 'Select all correct answers',
		options: [
			{ id: 1, key: 'A', value: 'Option 1' },
			{ id: 2, key: 'B', value: 'Option 2' }
		],
		correct_answer: [1, 2],
		is_mandatory: false,
		is_active: true,
		marking_scheme: {
			correct: 2,
			wrong: 0,
			skipped: 0,
			partial: { correct_answers: [{ num_correct_selected: 1, marks: 1 }] }
		}
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Partial Marking Checkbox Rendering', () => {
		it('should not show "Partial Marking" checkbox for single-choice question by default', () => {
			render(SingleQuestionPage, { data: baseData as any });
			expect(screen.queryByText('Partial Marking')).not.toBeInTheDocument();
		});

		it('should not show "Partial Marking Rules" section by default for single-choice', () => {
			render(SingleQuestionPage, { data: baseData as any });
			expect(screen.queryByText('Partial Marking Rules')).not.toBeInTheDocument();
		});

		it('should show "Partial Marking" checkbox for multi-choice question', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithPartialData } as any
			});
			expect(screen.getByText('Partial Marking')).toBeInTheDocument();
		});

		it('should show "Partial Marking" checkbox unchecked for multi-choice without partial data', () => {
			const multiNoPartial = {
				...multiChoiceWithPartialData,
				marking_scheme: { correct: 2, wrong: 0, skipped: 0 }
			};
			render(SingleQuestionPage, { data: { ...baseData, questionData: multiNoPartial } as any });
			const checkbox = screen
				.getByText('Partial Marking')
				.closest('label')!
				.querySelector('[role="checkbox"]') as HTMLElement;
			expect(checkbox).toHaveAttribute('data-state', 'unchecked');
		});
	});

	describe('Partial Marks Not Shown for Non-Multi-Choice', () => {
		it('should not show "Partial Marking" checkbox for single-choice question', () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: singleChoiceData } as any });
			expect(screen.queryByText('Partial Marking')).not.toBeInTheDocument();
		});

		it('should not show partial marking rules section for single-choice question', () => {
			render(SingleQuestionPage, { data: { ...baseData, questionData: singleChoiceData } as any });
			expect(screen.queryByText('Partial Marking Rules')).not.toBeInTheDocument();
		});
	});

	describe('Partial Marks Pre-filled', () => {
		it('should show "Partial Marking Rules" section when question has partial marking data', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithPartialData } as any
			});
			expect(screen.getByText('Partial Marking Rules')).toBeInTheDocument();
		});

		it('should show "Partial Marking" checkbox as checked when question has partial marking data', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithPartialData } as any
			});
			const checkbox = screen
				.getByText('Partial Marking')
				.closest('label')!
				.querySelector('[role="checkbox"]') as HTMLElement;
			expect(checkbox).toHaveAttribute('data-state', 'checked');
		});
	});
});

describe('Single Question Page - Wrong and Skipped Marks', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render "Marks for wrong answer" field', () => {
		render(SingleQuestionPage, { data: baseData as any });
		expect(screen.getByText('Marks for wrong answer')).toBeInTheDocument();
	});

	it('should render "Marks for skipped answer" field', () => {
		render(SingleQuestionPage, { data: baseData as any });
		expect(screen.getByText('Marks for skipped answer')).toBeInTheDocument();
	});

	it('should update wrong marks input value', async () => {
		const { container } = render(SingleQuestionPage, { data: baseData as any });
		const wrongInput = container.querySelector(
			'input[name="marking_scheme.wrong"]'
		) as HTMLInputElement;
		await fireEvent.input(wrongInput, { target: { value: '-1' } });
		expect(wrongInput).toHaveValue(-1);
	});

	it('should display prefilled wrong marks from question data', () => {
		const questionData = {
			...baseData.form,
			marking_scheme: { correct: 3, wrong: -1, skipped: 0 }
		};
		render(SingleQuestionPage, { data: { ...baseData, questionData } as any });
		expect(screen.getByDisplayValue('-1')).toBeInTheDocument();
	});

	it('should display prefilled skipped marks from question data', () => {
		const questionData = {
			...baseData.form,
			marking_scheme: { correct: 3, wrong: 0, skipped: -0.5 }
		};
		render(SingleQuestionPage, { data: { ...baseData, questionData } as any });
		expect(screen.getByDisplayValue('-0.5')).toBeInTheDocument();
	});
});

describe('Single Question Page - Partial Marking Section', () => {
	const multiChoiceWithPartial = {
		question_text: 'Multi choice question',
		options: [
			{ id: 1, key: 'A', value: 'Option A' },
			{ id: 2, key: 'B', value: 'Option B' },
			{ id: 3, key: 'C', value: 'Option C' }
		],
		correct_answer: [1, 2],
		is_mandatory: false,
		is_active: true,
		marking_scheme: {
			correct: 5,
			wrong: 0,
			skipped: 0,
			partial: {
				correct_answers: [
					{ num_correct_selected: 1, marks: 11 },
					{ num_correct_selected: 2, marks: 22 }
				]
			}
		}
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Section Header and Labels', () => {
		it('should show "PARTIAL MARKING RULES" header', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithPartial } as any
			});
			expect(screen.getByText('Partial Marking Rules')).toBeInTheDocument();
		});

		it('should show "Correct selected" label in partial rows', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithPartial } as any
			});
			expect(screen.getAllByText('Correct selected').length).toBeGreaterThan(0);
		});

		it('should show "Marks" label in partial rows', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithPartial } as any
			});
			expect(screen.getAllByText('Marks').length).toBeGreaterThan(0);
		});

		it('should show "Add Row" button in partial marking section', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithPartial } as any
			});
			expect(screen.getByRole('button', { name: /Add Row/i })).toBeInTheDocument();
		});
	});

	describe('Prefilled Partial Rows', () => {
		it('should render the correct number of partial marking rows', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithPartial } as any
			});
			expect(screen.getAllByText('Correct selected').length).toBe(2);
		});

		it('should display prefilled num_correct_selected values', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithPartial } as any
			});

			expect(screen.getByDisplayValue('1')).toBeInTheDocument();
			expect(screen.getByDisplayValue('2')).toBeInTheDocument();
		});

		it('should display prefilled marks values', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithPartial } as any
			});

			expect(screen.getByDisplayValue('11')).toBeInTheDocument();
			expect(screen.getByDisplayValue('22')).toBeInTheDocument();
		});
	});

	describe('Add Row', () => {
		it('should add a new partial marking row when "Add Row" is clicked', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithPartial } as any
			});

			const initialRows = screen.getAllByText('Correct selected').length;
			await fireEvent.click(screen.getByRole('button', { name: /Add Row/i }));
			expect(screen.getAllByText('Correct selected').length).toBe(initialRows + 1);
		});
	});

	describe('Delete Row', () => {
		it('should disable delete button when only one partial row exists', () => {
			const singleRow = {
				...multiChoiceWithPartial,
				marking_scheme: {
					...multiChoiceWithPartial.marking_scheme,
					partial: { correct_answers: [{ num_correct_selected: 1, marks: 1 }] }
				}
			};
			render(SingleQuestionPage, { data: { ...baseData, questionData: singleRow } as any });

			const deleteBtn = screen.getByTestId('delete-partial-row');
			expect(deleteBtn).toBeDisabled();
		});

		it('should remove a partial marking row when delete is clicked with multiple rows', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithPartial } as any
			});

			expect(screen.getAllByText('Correct selected').length).toBe(2);

			await fireEvent.click(screen.getByRole('button', { name: /Add Row/i }));
			expect(screen.getAllByText('Correct selected').length).toBe(3);

			const deleteButtons = screen.getAllByTestId('delete-partial-row');
			expect(deleteButtons.length).toBe(3);

			expect(deleteButtons[0]).toBeEnabled();

			await fireEvent.click(deleteButtons[0]);
			expect(screen.getAllByText('Correct selected').length).toBe(2);
		});
	});

	describe('Hidden When Full Marks Selected', () => {
		it('should not show partial marking section for full marks question', () => {
			const fullMarksData = {
				...multiChoiceWithPartial,
				marking_scheme: { correct: 3, wrong: 0, skipped: 0 }
			};
			render(SingleQuestionPage, { data: { ...baseData, questionData: fullMarksData } as any });
			expect(screen.queryByText('Partial Marking Rules')).not.toBeInTheDocument();
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

describe('Single Question Page - Partial Marking Toggle Behavior', () => {
	const multiChoiceNoPartial = {
		question_text: 'Multi choice question',
		question_type: QuestionTypeEnum.MultiChoice,
		options: [
			{ id: 1, key: 'A', value: 'Option A' },
			{ id: 2, key: 'B', value: 'Option B' }
		],
		correct_answer: [1, 2],
		is_mandatory: false,
		is_active: true,
		marking_scheme: { correct: 2, wrong: 0, skipped: 0 }
	};

	const multiChoiceWithExistingPartial = {
		...multiChoiceNoPartial,
		marking_scheme: {
			correct: 2,
			wrong: 0,
			skipped: 0,
			partial: { correct_answers: [{ num_correct_selected: 1, marks: 3 }] }
		}
	};

	const getPartialCheckbox = () =>
		screen
			.getByText('Partial Marking')
			.closest('label')!
			.querySelector('[role="checkbox"]') as HTMLElement;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Unchecking the Partial Marking checkbox', () => {
		it('should hide Partial Marking Rules section when checkbox is unchecked', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithExistingPartial } as any
			});

			expect(screen.getByText('Partial Marking Rules')).toBeInTheDocument();

			await fireEvent.click(getPartialCheckbox());

			expect(screen.queryByText('Partial Marking Rules')).not.toBeInTheDocument();
		});

		it('should uncheck the checkbox and hide rules when clicked while checked', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithExistingPartial } as any
			});

			expect(getPartialCheckbox()).toHaveAttribute('data-state', 'checked');

			await fireEvent.click(getPartialCheckbox());

			expect(screen.queryByText('Partial Marking Rules')).not.toBeInTheDocument();
		});
	});

	describe('Checking the Partial Marking checkbox', () => {
		it('should show Partial Marking Rules section when checkbox is checked', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceNoPartial } as any
			});

			expect(screen.queryByText('Partial Marking Rules')).not.toBeInTheDocument();

			await fireEvent.click(getPartialCheckbox());

			expect(screen.getByText('Partial Marking Rules')).toBeInTheDocument();
		});

		it('should create default partial scheme with one row when no partial data exists', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceNoPartial } as any
			});

			await fireEvent.click(getPartialCheckbox());

			expect(screen.getAllByText('Correct selected').length).toBe(1);
		});

		it('should initialize default partial scheme with num_correct_selected=1 and marks=0', async () => {
			const { container } = render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceNoPartial } as any
			});

			await fireEvent.click(getPartialCheckbox());

			const numCorrectInput = container.querySelector(
				'input[name="marking_scheme.partial.correct_answers.0.num_correct_selected"]'
			) as HTMLInputElement;
			expect(numCorrectInput).toBeTruthy();
			expect(numCorrectInput.value).toBe('1');

			const marksInput = container.querySelector(
				'input[name="marking_scheme.partial.correct_answers.0.marks"]'
			) as HTMLInputElement;
			expect(marksInput).toBeTruthy();
			expect(marksInput.value).toBe('0');
		});
	});

	describe('Partial marking checkbox state persistence', () => {
		it('should clear partial data when unchecked and reinitialize a default row when rechecked', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceWithExistingPartial } as any
			});

			expect(screen.getByDisplayValue('3')).toBeInTheDocument();

			await fireEvent.click(getPartialCheckbox());
			expect(screen.queryByText('Partial Marking Rules')).not.toBeInTheDocument();

			await fireEvent.click(getPartialCheckbox());
			expect(screen.getByText('Partial Marking Rules')).toBeInTheDocument();
			expect(screen.getAllByText('Correct selected').length).toBe(1);
		});

		it('should auto-uncheck and hide partial rules when question becomes single-choice', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: multiChoiceNoPartial } as any
			});

			await fireEvent.click(getPartialCheckbox());
			expect(screen.getByText('Partial Marking Rules')).toBeInTheDocument();

			const checkboxes = screen.getAllByRole('checkbox');
			await fireEvent.click(checkboxes[1]);

			expect(screen.queryByText('Partial Marking Rules')).not.toBeInTheDocument();
			expect(screen.queryByText('Partial Marking')).not.toBeInTheDocument();
		});
	});
});

describe('Single Question Page - Partial marking hidden for Subjective type', () => {
	const subjectiveWithMultiCorrect = {
		question_text: 'Explain recursion',
		question_type: QuestionTypeEnum.Subjective,
		options: [
			{ id: 1, key: 'A', value: 'Option A' },
			{ id: 2, key: 'B', value: 'Option B' }
		],
		correct_answer: [1, 2],
		is_mandatory: false,
		is_active: true,
		marking_scheme: { correct: 2, wrong: 0, skipped: 0 }
	};

	const subjectiveWithPartialScheme = {
		...subjectiveWithMultiCorrect,
		marking_scheme: {
			correct: 2,
			wrong: 0,
			skipped: 0,
			partial: { correct_answers: [{ num_correct_selected: 1, marks: 1 }] }
		}
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should not show Partial Marking checkbox for Subjective type even when isMultiChoice is true', () => {
		render(SingleQuestionPage, {
			data: { ...baseData, questionData: subjectiveWithMultiCorrect } as any
		});

		expect(screen.queryByText('Partial Marking')).not.toBeInTheDocument();
	});

	it('should not show Partial Marking checkbox for Subjective type with a saved partial scheme', () => {
		render(SingleQuestionPage, {
			data: { ...baseData, questionData: subjectiveWithPartialScheme } as any
		});

		expect(screen.queryByText('Partial Marking')).not.toBeInTheDocument();
	});

	it('should hide Partial Marking Rules section for Subjective type even with a saved partial scheme', () => {
		render(SingleQuestionPage, {
			data: { ...baseData, questionData: subjectiveWithPartialScheme } as any
		});

		expect(screen.queryByText('Partial Marking Rules')).not.toBeInTheDocument();
	});

	it('should not show Partial Marking checkbox for Subjective type even with a saved partial scheme', () => {
		render(SingleQuestionPage, {
			data: { ...baseData, questionData: subjectiveWithPartialScheme } as any
		});

		expect(screen.queryByText('Partial Marking')).not.toBeInTheDocument();
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

		it('should render number input with step="any"', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: numericalIntegerData } as any
			});

			const spinbuttons = screen.getAllByRole('spinbutton');
			const answerInput = spinbuttons.find((el) => el.getAttribute('step') === 'any');
			expect(answerInput).toBeDefined();
			expect(answerInput).toHaveAttribute('step', 'any');
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

		it('should enable Save button when correct answer is 0', () => {
			render(SingleQuestionPage, {
				data: {
					...baseData,
					questionData: { ...numericalIntegerData, correct_answer: 0 }
				} as any
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

		it('should enable Save button when correct answer is 0', () => {
			render(SingleQuestionPage, {
				data: {
					...baseData,
					questionData: { ...numericalDecimalData, correct_answer: 0 }
				} as any
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

describe('Single Question Page - Numerical Auto-Detection', () => {
	const numericalBase = {
		question_text: 'What is the answer?',
		question_type: QuestionTypeEnum.NumericalInteger,
		options: [],
		correct_answer: [],
		is_mandatory: false,
		is_active: true,
		marking_scheme: { correct: 1, wrong: 0, skipped: 0 }
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should always render the numerical input with step="any"', () => {
		render(SingleQuestionPage, { data: { ...baseData, questionData: numericalBase } as any });
		const spinbuttons = screen.getAllByRole('spinbutton');
		const answerInput = spinbuttons.find((el) => el.getAttribute('step') === 'any');
		expect(answerInput).toBeDefined();
		expect(answerInput).toHaveAttribute('step', 'any');
	});

	it('should disable Save when input is cleared after entering a value', async () => {
		const filledData = { ...numericalBase, question_text: 'Q?', correct_answer: 42 };
		render(SingleQuestionPage, { data: { ...baseData, questionData: filledData } as any });
		const input = screen.getByDisplayValue('42');
		await fireEvent.input(input, { target: { value: '' } });
		expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
	});

	it('should enable Save when an integer value is entered', async () => {
		const withQuestion = { ...numericalBase, question_text: 'Q?' };
		render(SingleQuestionPage, { data: { ...baseData, questionData: withQuestion } as any });
		const spinbuttons = screen.getAllByRole('spinbutton');
		const answerInput = spinbuttons.find((el) => el.getAttribute('step') === 'any')!;
		await fireEvent.input(answerInput, { target: { value: '42' } });
		expect(screen.getByRole('button', { name: /Save/i })).toBeEnabled();
	});

	it('should enable Save when a decimal value is entered', async () => {
		const withQuestion = { ...numericalBase, question_text: 'Q?' };
		render(SingleQuestionPage, { data: { ...baseData, questionData: withQuestion } as any });
		const spinbuttons = screen.getAllByRole('spinbutton');
		const answerInput = spinbuttons.find((el) => el.getAttribute('step') === 'any')!;
		await fireEvent.input(answerInput, { target: { value: '3.14' } });
		expect(screen.getByRole('button', { name: /Save/i })).toBeEnabled();
	});
});

describe('Single Question Page - Matrix Match Question Type', () => {
	const matrixMatchQuestionData = {
		question_text: 'Match the following capitals',
		question_type: QuestionTypeEnum.MatrixMatch,
		options: {
			rows: {
				label: 'Countries',
				items: [
					{ id: 1, key: '1', value: 'India' },
					{ id: 2, key: '2', value: 'France' }
				]
			},
			columns: {
				label: 'Capitals',
				items: [
					{ id: 10, key: 'A', value: 'New Delhi' },
					{ id: 11, key: 'B', value: 'Paris' }
				]
			}
		},
		correct_answer: { '1': [10], '2': [11] },
		is_mandatory: false,
		is_active: true,
		marking_scheme: { correct: 2, wrong: 0, skipped: 0 }
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Matrix Match UI Rendering', () => {
		it('should render "Match The Following" heading for matrix match type', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});
			expect(screen.getByText('Match The Following')).toBeInTheDocument();
		});

		it('should render Correct Answers section', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});
			expect(screen.getByText('Correct Answers')).toBeInTheDocument();
		});

		it('should display prefilled left column label', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});
			expect(screen.getByDisplayValue('Countries')).toBeInTheDocument();
		});

		it('should display prefilled right column label', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});
			expect(screen.getByDisplayValue('Capitals')).toBeInTheDocument();
		});

		it('should display prefilled left column items', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});
			expect(screen.getByDisplayValue('India')).toBeInTheDocument();
			expect(screen.getByDisplayValue('France')).toBeInTheDocument();
		});

		it('should display prefilled right column items', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});
			expect(screen.getByDisplayValue('New Delhi')).toBeInTheDocument();
			expect(screen.getByDisplayValue('Paris')).toBeInTheDocument();
		});

		it('should render "Add Question" button for left column', () => {
			const { container } = render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});
			const buttons = Array.from(container.querySelectorAll('button'));
			const addQuestionButton = buttons.find((btn) => btn.textContent?.includes('Add Question'));
			expect(addQuestionButton).toBeDefined();
		});

		it('should render "Add Answer" button for right column', () => {
			const { container } = render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});
			const buttons = Array.from(container.querySelectorAll('button'));
			const addAnswerButton = buttons.find((btn) => btn.textContent?.includes('Add Answer'));
			expect(addAnswerButton).toBeDefined();
		});

		it('should show column A row label in correct matches grid', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});
			expect(screen.getByText('Countries')).toBeInTheDocument();
		});

		it('should show column B label in correct matches grid', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});
			expect(screen.getByText('Capitals')).toBeInTheDocument();
		});

		it('should show default labels when no matrix options exist', () => {
			render(SingleQuestionPage, {
				data: {
					...baseData,
					questionData: {
						...matrixMatchQuestionData,
						options: null
					}
				} as any
			});
			expect(screen.getByDisplayValue('Questions')).toBeInTheDocument();
			expect(screen.getByDisplayValue('Answers')).toBeInTheDocument();
		});

		it('should update column B label when matrixColLabel changes', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});
			const capitalsLabel = screen.getByDisplayValue('Capitals');
			await fireEvent.input(capitalsLabel, { target: { value: 'Populations' } });
			expect(screen.getByText('Populations')).toBeInTheDocument();
		});
	});

	describe('Matrix Match Save Button State', () => {
		it('should enable Save when all items filled and all rows have matches', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});
			const saveButton = screen.getByRole('button', { name: /Save/i });
			expect(saveButton).toBeEnabled();
		});

		it('should disable Save when question text is empty', () => {
			render(SingleQuestionPage, {
				data: {
					...baseData,
					questionData: { ...matrixMatchQuestionData, question_text: '' }
				} as any
			});
			expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
		});

		it('should disable Save when a left item value is empty', () => {
			const dataWithEmptyLeft = {
				...matrixMatchQuestionData,
				options: {
					...matrixMatchQuestionData.options,
					rows: {
						label: 'Countries',
						items: [
							{ id: 1, key: '1', value: '' },
							{ id: 2, key: '2', value: 'France' }
						]
					}
				}
			};
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: dataWithEmptyLeft } as any
			});
			expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
		});

		it('should disable Save when a right item value is empty', () => {
			const dataWithEmptyRight = {
				...matrixMatchQuestionData,
				options: {
					...matrixMatchQuestionData.options,
					columns: {
						label: 'Capitals',
						items: [
							{ id: 10, key: 'A', value: '' },
							{ id: 11, key: 'B', value: 'Paris' }
						]
					}
				}
			};
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: dataWithEmptyRight } as any
			});
			expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
		});

		it('should disable Save when a left row has no match assigned', () => {
			render(SingleQuestionPage, {
				data: {
					...baseData,
					questionData: { ...matrixMatchQuestionData, correct_answer: { '1': [10] } }
				} as any
			});
			expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
		});

		it('should disable Save on fresh matrix match question with empty items', () => {
			render(SingleQuestionPage, {
				data: {
					...baseData,
					questionData: {
						question_text: 'Match it',
						question_type: QuestionTypeEnum.MatrixMatch,
						options: {
							rows: { label: 'Column A', items: [{ id: 1, key: '1', value: '' }] },
							columns: { label: 'Column B', items: [{ id: 1, key: 'A', value: '' }] }
						},
						correct_answer: {},
						is_mandatory: false,
						is_active: true,
						marking_scheme: { correct: 1, wrong: 0, skipped: 0 }
					}
				} as any
			});
			expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
		});

		it('should disable Save when a left row has an empty array match (all deselected in edit mode)', () => {
			render(SingleQuestionPage, {
				data: {
					...baseData,
					questionData: {
						...matrixMatchQuestionData,
						correct_answer: { '1': [10], '2': [] }
					}
				} as any
			});
			expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
		});

		it('should disable Save when all matches are cleared (empty arrays for every row)', () => {
			render(SingleQuestionPage, {
				data: {
					...baseData,
					questionData: {
						...matrixMatchQuestionData,
						correct_answer: { '1': [], '2': [] }
					}
				} as any
			});
			expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
		});

		it('should re-disable Save after toggling off the last match in edit mode', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});

			expect(screen.getByRole('button', { name: /Save/i })).toBeEnabled();

			const matchButtons = screen.getAllByRole('button', { name: /^[A-Z]$/ });

			await fireEvent.click(matchButtons[3]);

			expect(screen.getByRole('button', { name: /Save/i })).toBeDisabled();
		});
	});

	describe('Matrix Match Item Management', () => {
		it('should add a new left column item when "Add Question" is clicked', async () => {
			const { container } = render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});

			const initialInputs = screen.getAllByRole('textbox');
			const addQuestionButton = Array.from(container.querySelectorAll('button')).find((btn) =>
				btn.textContent?.includes('Add Question')
			)!;
			await fireEvent.click(addQuestionButton);

			expect(screen.getAllByRole('textbox').length).toBe(initialInputs.length + 1);
		});

		it('should add a new right column item when "Add Answer" is clicked', async () => {
			const { container } = render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});

			const initialInputs = screen.getAllByRole('textbox');
			const addAnswerButton = Array.from(container.querySelectorAll('button')).find((btn) =>
				btn.textContent?.includes('Add Answer')
			)!;
			await fireEvent.click(addAnswerButton);

			expect(screen.getAllByRole('textbox').length).toBe(initialInputs.length + 1);
		});

		it('should allow editing a left column item value', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});

			const indiaInput = screen.getByDisplayValue('India');
			await fireEvent.input(indiaInput, { target: { value: 'Japan' } });
			expect(indiaInput).toHaveValue('Japan');
		});

		it('should allow editing a right column item value', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});

			const parisInput = screen.getByDisplayValue('Paris');
			await fireEvent.input(parisInput, { target: { value: 'Tokyo' } });
			expect(parisInput).toHaveValue('Tokyo');
		});

		it('should allow editing the left column label', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});

			const countriesLabel = screen.getByDisplayValue('Countries');
			await fireEvent.input(countriesLabel, { target: { value: 'Cities' } });
			expect(countriesLabel).toHaveValue('Cities');
		});

		it('should allow editing the right column label', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});

			const capitalsLabel = screen.getByDisplayValue('Capitals');
			await fireEvent.input(capitalsLabel, { target: { value: 'Populations' } });
			expect(capitalsLabel).toHaveValue('Populations');
		});
	});

	describe('Matrix Match Correct Answers Toggle', () => {
		it('should render match toggle buttons for each left-right pair', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});

			const matchButtons = screen.getAllByRole('button', { name: /^[A-Z]$/ });
			expect(matchButtons.length).toBe(4);
		});

		it('should toggle a match when a match button is clicked', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});

			const matchButtons = screen.getAllByRole('button', { name: /^[A-Z]$/ });

			const franceParisButton = matchButtons[3];
			expect(franceParisButton).toHaveClass('bg-primary');

			await fireEvent.click(franceParisButton);
			expect(franceParisButton).not.toHaveClass('bg-primary');
		});

		it('should add a match when an unselected match button is clicked', async () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: matrixMatchQuestionData } as any
			});

			const matchButtons = screen.getAllByRole('button', { name: /^[A-Z]$/ });

			const indiaParisButton = matchButtons[1];
			expect(indiaParisButton).not.toHaveClass('bg-primary');

			await fireEvent.click(indiaParisButton);
			expect(indiaParisButton).toHaveClass('bg-primary');
		});
	});

	describe('Matrix Match Default State (Create Mode)', () => {
		it('should render "Match The Following" when matrix-match type is set via form default', () => {
			render(SingleQuestionPage, {
				data: {
					...baseData,
					questionData: {
						question_text: '',
						question_type: QuestionTypeEnum.MatrixMatch,
						options: {
							rows: {
								label: 'Column A',
								items: Array.from({ length: 4 }, (_, i) => ({
									id: i + 1,
									key: String(i + 1),
									value: ''
								}))
							},
							columns: {
								label: 'Column B',
								items: Array.from({ length: 4 }, (_, i) => ({
									id: i + 1,
									key: String.fromCharCode(65 + i),
									value: ''
								}))
							}
						},
						correct_answer: {},
						is_mandatory: false,
						is_active: true,
						marking_scheme: { correct: 1, wrong: 0, skipped: 0 }
					}
				} as any
			});
			expect(screen.getByText('Match The Following')).toBeInTheDocument();
		});

		it('should show default "Column A" placeholder in left label input', () => {
			render(SingleQuestionPage, {
				data: {
					...baseData,
					questionData: {
						question_text: 'Q?',
						question_type: QuestionTypeEnum.MatrixMatch,
						options: {
							rows: { label: 'Column A', items: [] },
							columns: { label: 'Column B', items: [] }
						},
						correct_answer: {},
						is_mandatory: false,
						is_active: true,
						marking_scheme: { correct: 1, wrong: 0, skipped: 0 }
					}
				} as any
			});
			expect(screen.getByDisplayValue('Column A')).toBeInTheDocument();
		});

		it('should show default "Column B" placeholder in right label input', () => {
			render(SingleQuestionPage, {
				data: {
					...baseData,
					questionData: {
						question_text: 'Q?',
						question_type: QuestionTypeEnum.MatrixMatch,
						options: {
							rows: { label: 'Column A', items: [] },
							columns: { label: 'Column B', items: [] }
						},
						correct_answer: {},
						is_mandatory: false,
						is_active: true,
						marking_scheme: { correct: 1, wrong: 0, skipped: 0 }
					}
				} as any
			});
			expect(screen.getByDisplayValue('Column B')).toBeInTheDocument();
		});
	});
});

describe('Single Question Page - Media', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Add media button', () => {
		it('should show "Add media" buttons in create mode', () => {
			render(SingleQuestionPage, { data: baseData as any });
			const mediaButtons = screen.getAllByText('Add media');
			// Question-level + 4 default options
			expect(mediaButtons.length).toBe(5);
		});

		it('should toggle question-level media manager when clicked', async () => {
			render(SingleQuestionPage, { data: baseData as any });

			// First "Add media" is the question-level one
			const addMediaButtons = screen.getAllByText('Add media');
			await fireEvent.click(addMediaButtons[0]);

			expect(screen.getByText('Hide media')).toBeInTheDocument();
			expect(screen.getByText('Image')).toBeInTheDocument();
			expect(screen.getByText('External Media')).toBeInTheDocument();
		});

		it('should hide media manager when "Hide media" is clicked', async () => {
			render(SingleQuestionPage, { data: baseData as any });

			const addMediaButtons = screen.getAllByText('Add media');
			await fireEvent.click(addMediaButtons[0]);

			const hideMediaBtn = screen.getByText('Hide media');
			await fireEvent.click(hideMediaBtn);

			// Should go back to 5 "Add media" buttons
			expect(screen.getAllByText('Add media').length).toBe(5);
		});
	});

	describe('Media in edit mode', () => {
		const questionDataWithMedia = {
			id: 42,
			question_text: 'Question with media',
			question_type: QuestionTypeEnum.SingleChoice,
			options: [
				{
					id: 1,
					key: 'A',
					value: 'Option A',
					media: {
						image: {
							gcs_path: 'org_1/q_42_opt_1.png',
							content_type: 'image/png',
							size_bytes: 5120,
							uploaded_at: '2026-03-16T00:00:00Z'
						}
					}
				},
				{ id: 2, key: 'B', value: 'Option B' }
			],
			correct_answer: [1],
			is_mandatory: false,
			is_active: true,
			marking_scheme: { correct: 1, wrong: 0, skipped: 0 },
			media: {
				image: {
					gcs_path: 'org_1/q_42.png',
					content_type: 'image/jpeg',
					size_bytes: 73279,
					uploaded_at: '2026-03-16T00:00:00Z'
				}
			}
		};

		it('should auto-expand media panels when media exists', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: questionDataWithMedia } as any
			});
			// Both question-level and option A should auto-expand
			const hideButtons = screen.getAllByText('Hide media');
			expect(hideButtons.length).toBe(2);
		});

		it('should display existing question-level media info', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: questionDataWithMedia } as any
			});
			expect(screen.getByText(/image\/jpeg/)).toBeInTheDocument();
		});

		it('should display existing option-level media info', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: questionDataWithMedia } as any
			});
			expect(screen.getByText(/image\/png/)).toBeInTheDocument();
		});

		it('should show "Add media" for options without media', () => {
			render(SingleQuestionPage, {
				data: { ...baseData, questionData: questionDataWithMedia } as any
			});
			// Option B has no media — its button says "Add media"
			const addMediaButtons = screen.getAllByText('Add media');
			expect(addMediaButtons.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('Media manager UI', () => {
		it('should show upload area when media panel is open', async () => {
			render(SingleQuestionPage, { data: baseData as any });

			const addMediaButtons = screen.getAllByText('Add media');
			await fireEvent.click(addMediaButtons[0]);

			expect(screen.getByText('Click to upload image')).toBeInTheDocument();
		});

		it('should show external media URL input when media panel is open', async () => {
			render(SingleQuestionPage, { data: baseData as any });

			const addMediaButtons = screen.getAllByText('Add media');
			await fireEvent.click(addMediaButtons[0]);

			expect(
				screen.getByPlaceholderText('Paste YouTube, Vimeo, Spotify, or SoundCloud URL...')
			).toBeInTheDocument();
		});

		it('should show file format and size hint', async () => {
			render(SingleQuestionPage, { data: baseData as any });

			const addMediaButtons = screen.getAllByText('Add media');
			await fireEvent.click(addMediaButtons[0]);

			expect(screen.getByText(/PNG, JPG, WebP, GIF/)).toBeInTheDocument();
		});
	});
});
