export enum QuestionTypeEnum {
	SingleChoice = 'single-choice',
	MultiChoice = 'multi-choice',
	Subjective = 'subjective',
	NumericalInteger = 'numerical-integer',
	NumericalDecimal = 'numerical-decimal',
	MatrixMatch = 'matrix-match',
	MatrixRating = 'matrix-rating',
	MatrixInput = 'matrix-input',
	MatrixString = 'matrix-string',
	MatrixNumber = 'matrix-number'
}

export const QUESTION_TYPE_LABELS: Record<string, string> = {
	[QuestionTypeEnum.SingleChoice]: 'Single/Multiple Choice',
	[QuestionTypeEnum.MultiChoice]: 'Multiple Choice',
	[QuestionTypeEnum.Subjective]: 'Subjective',
	[QuestionTypeEnum.NumericalInteger]: 'Numerical (Integer)',
	[QuestionTypeEnum.NumericalDecimal]: 'Numerical (Decimal)',
	[QuestionTypeEnum.MatrixMatch]: 'Matrix Match',
	[QuestionTypeEnum.MatrixRating]: 'Matrix Rating',
	[QuestionTypeEnum.MatrixInput]: 'Matrix Input',
	[QuestionTypeEnum.MatrixString]: 'Matrix Text',
	[QuestionTypeEnum.MatrixNumber]: 'Matrix Number'
};
